import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import type { ChatMessage, ToolCall } from "@prisma/client";

export type ChatMessageWithTools = ChatMessage & { toolCalls: ToolCall[] };

/**
 * Expand persisted thread into Groq/OpenAI chat messages (including synthetic
 * `tool` messages from stored ToolCall rows).
 */
export function dbThreadToGroqMessages(
  rows: ChatMessageWithTools[]
): ChatCompletionMessageParam[] {
  const out: ChatCompletionMessageParam[] = [];
  for (const row of rows) {
    if (row.role === "USER") {
      out.push({ role: "user", content: row.content });
      continue;
    }
    if (row.role !== "ASSISTANT") continue;

    if (row.toolCalls.length > 0) {
      out.push({
        role: "assistant",
        content: row.content.length > 0 ? row.content : null,
        tool_calls: row.toolCalls.map((tc) => ({
          id: tc.externalId ?? tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.args ?? {}),
          },
        })),
      });
      for (const tc of row.toolCalls) {
        if (tc.result != null) {
          out.push({
            role: "tool",
            tool_call_id: tc.externalId ?? tc.id,
            content: tc.result,
          });
        }
      }
    } else {
      out.push({ role: "assistant", content: row.content });
    }
  }
  return out;
}
