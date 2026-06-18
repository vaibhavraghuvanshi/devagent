import type { Message, ToolCall } from "@/lib/store";
import type { ChatMessageWithTools } from "@/lib/chat-thread";

export function prismaMessageToClient(row: ChatMessageWithTools): Message {
  const toolCalls: ToolCall[] | undefined =
    row.toolCalls.length > 0
      ? row.toolCalls.map((tc) => ({
          id: tc.id,
          messageId: row.id,
          name: tc.name,
          args: (tc.args ?? {}) as Record<string, unknown>,
          result: tc.result ?? undefined,
          createdAt: tc.createdAt.toISOString(),
        }))
      : undefined;

  return {
    id: row.id,
    sessionId: row.chatSessionId,
    role: row.role === "USER" ? "user" : "assistant",
    content: row.content,
    modelId: row.modelId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    toolCalls,
  };
}
