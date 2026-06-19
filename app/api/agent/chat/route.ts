import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { Prisma } from "@prisma/client";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { getModelById } from "@/lib/models";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AGENT_TOOL_DEFINITIONS, executeAgentTool } from "@/lib/agent-tools";
import { dbThreadToGroqMessages } from "@/lib/chat-thread";

const MAX_TOOL_ROUNDS = 8;
const CHARS_PER_TOKEN = 4; // rough approximation
const TOOL_TIMEOUT_MS = 30_000;

/** Race a tool execution against a hard timeout to prevent hung streams. */
function withToolTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Tool timed out after ${TOOL_TIMEOUT_MS / 1000}s`)),
        TOOL_TIMEOUT_MS
      )
    ),
  ]);
}

/** Estimate token count from a string. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Trim conversation history (oldest first) so the total input fits inside
 * the model's context window, reserving space for the system prompt and
 * the expected max-response budget.
 */
function trimMessagesToBudget(
  messages: ChatCompletionMessageParam[],
  budgetTokens: number
): ChatCompletionMessageParam[] {
  let used = 0;
  const kept: ChatCompletionMessageParam[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const raw =
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content ?? "");
    const tokens = estimateTokens(raw);
    if (used + tokens > budgetTokens) break;
    kept.unshift(msg);
    used += tokens;
  }
  return kept;
}

function chunkTextForStream(text: string, size = 32): string[] {
  if (!text) return [""];
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push(text.slice(i, i + size));
  }
  return parts;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { sessionId, message, modelId, mode, streamResponses, safeMode, developerMode, betaFeatures } = body as {
      sessionId?: string;
      message?: string;
      modelId?: string;
      mode?: string;
      streamResponses?: boolean;
      safeMode?: boolean;
      developerMode?: boolean;
      betaFeatures?: boolean;
    };

    if (!sessionId || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "sessionId and message required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!modelId) {
      return new Response(JSON.stringify({ error: "modelId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const model = getModelById(modelId);
    if (!model) {
      return new Response(JSON.stringify({ error: "Invalid model ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const chatSession = await db.chatSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });
    if (!chatSession) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: "GROQ_API_KEY is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        role: "USER",
        content: message.trim(),
      },
    });

    if (chatSession.title === "New chat") {
      const title = message.trim().slice(0, 80) || "New chat";
      await db.chatSession.update({
        where: { id: sessionId },
        data: { title },
      });
    }

    const rows = await db.chatMessage.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: "asc" },
      include: { toolCalls: { orderBy: { createdAt: "asc" } } },
    });

    const isSafeMode = safeMode !== false;
    const isAgentMode = mode === "agent";
    const allowTools = isAgentMode && !isSafeMode;
    const enableStreaming = streamResponses !== false;
    const temperature = isAgentMode ? (isSafeMode ? 0.2 : 0.3) : 0.7;
    const maxTokens = Math.min(4096, model.contextWindow - 2000);

    // Token budget: reserve space for system prompt + response
    // Clamped to 0 so trimMessagesToBudget never receives a negative value
    const systemTokens = estimateTokens(SYSTEM_PROMPT);
    const historyBudget = Math.max(0, model.contextWindow - maxTokens - systemTokens - 512);
    const trimmedHistory = trimMessagesToBudget(
      dbThreadToGroqMessages(rows),
      historyBudget
    );

    const groqMessages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...trimmedHistory,
    ];

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)
          );
        };

        try {
          let rounds = 0;
          const roundLimit = allowTools ? (betaFeatures ? MAX_TOOL_ROUNDS + 2 : MAX_TOOL_ROUNDS) : 1;
          let messages: ChatCompletionMessageParam[] = [...groqMessages];

          // In chat mode: single shot, no tools.
          // In agent mode: multi-round with tools.
          while (rounds < roundLimit) {
            rounds += 1;
            const completion = await groq.chat.completions.create({
              model: model.id,
              messages,
              ...(allowTools
                ? { tools: AGENT_TOOL_DEFINITIONS, tool_choice: "auto" }
                : { tool_choice: "none" }),
              temperature,
              max_tokens: maxTokens,
              stream: false,
            });

            const choice = completion.choices[0];
            const msg = choice?.message;
            const finishReason = choice?.finish_reason;

            if (
              finishReason === "tool_calls" &&
              msg?.tool_calls &&
              msg.tool_calls.length > 0
            ) {
              const assistantRecord = await db.chatMessage.create({
                data: {
                  chatSessionId: sessionId,
                  role: "ASSISTANT",
                  content: typeof msg.content === "string" ? msg.content : "",
                  modelId: model.id,
                },
              });

              messages = [
                ...messages,
                {
                  role: "assistant" as const,
                  content: msg.content,
                  tool_calls: msg.tool_calls,
                },
              ];

              for (const tc of msg.tool_calls) {
                const fn = tc.function;
                let parsedArgs: Record<string, unknown> = {};
                try {
                  parsedArgs = JSON.parse(fn.arguments || "{}") as Record<
                    string,
                    unknown
                  >;
                } catch {
                  parsedArgs = {};
                }

                const toolRow = await db.toolCall.create({
                  data: {
                    messageId: assistantRecord.id,
                    externalId: tc.id,
                    name: fn.name,
                    args: parsedArgs as Prisma.InputJsonValue,
                  },
                });

                send({
                  type: "tool",
                  id: toolRow.id,
                  name: fn.name,
                  args: parsedArgs,
                  assistantMessageId: assistantRecord.id,
                });

                let result: string;
                try {
                  result = await withToolTimeout(executeAgentTool(fn.name, parsedArgs));
                } catch (toolErr) {
                  result = `Tool error: ${toolErr instanceof Error ? toolErr.message : String(toolErr)}`;
                }

                await db.toolCall.update({
                  where: { id: toolRow.id },
                  data: { result },
                });

                send({
                  type: "tool_result",
                  id: toolRow.id,
                  name: fn.name,
                  result,
                });

                messages.push({
                  role: "tool",
                  tool_call_id: tc.id,
                  content: result,
                });
              }

              continue;
            }

            const finalText =
              typeof msg?.content === "string" ? msg.content : "";

            await db.chatMessage.create({
              data: {
                chatSessionId: sessionId,
                role: "ASSISTANT",
                content: finalText,
                modelId: model.id,
              },
            });

            for (const piece of chunkTextForStream(finalText, enableStreaming ? 32 : finalText.length || 1)) {
              send({ type: "token", content: piece });
            }

            if (developerMode) {
              send({
                type: "meta",
                mode: allowTools ? "agent-with-tools" : "chat-safe",
                rounds,
              });
            }
            send({ type: "done", content: finalText });
            controller.close();
            return;
          }

          send({
            type: "error",
            error: "Stopped after maximum tool-calling rounds",
          });
          controller.close();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: errorMessage })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
