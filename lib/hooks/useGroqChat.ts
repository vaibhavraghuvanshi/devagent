import { useCallback } from "react";
import { useChatStore, Message, Session } from "@/lib/store";

async function fetchSessionMessages(sessionId: string): Promise<Message[]> {
  const res = await fetch(`/api/sessions/${sessionId}/messages`);
  if (!res.ok) return [];
  const data = (await res.json()) as { messages?: Message[] };
  return Array.isArray(data.messages) ? data.messages : [];
}

export function useGroqChat() {
  const {
    currentSessionId,
    selectedModel,
    mode,
    streamResponses,
    safeMode,
    developerMode,
    betaFeatures,
    addMessage,
    appendToLastMessage,
    setIsLoading,
    setCurrentMessages,
    setSessions,
    setCurrentSessionId,
    addToolCall,
    updateToolCallResult,
    remapLastAssistantMessageId,
  } = useChatStore();

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!selectedModel) return;

      // Auto-create a session if one isn't active yet
      let sessionId = currentSessionId;
      if (!sessionId) {
        try {
          const res = await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "New chat", mode }),
          });
          if (!res.ok) throw new Error("Failed to create session");
          const data = (await res.json()) as { session?: Session };
          if (!data.session?.id) throw new Error("No session returned");
          sessionId = data.session.id;
          setCurrentSessionId(sessionId);
          setSessions([data.session, ...useChatStore.getState().sessions]);
        } catch (e) {
          console.error("Session creation failed:", e);
          return;
        }
      }

      try {
        setIsLoading(true);

        // Update session title from "New chat" → first user message (mirrors server behaviour)
        const state = useChatStore.getState();
        const currentSession = state.sessions.find((s) => s.id === sessionId);
        if (currentSession && currentSession.title === "New chat") {
          const autoTitle = userMessage.trim().slice(0, 60) || "New chat";
          state.setSessions(
            state.sessions.map((s) =>
              s.id === sessionId ? { ...s, title: autoTitle } : s
            )
          );
        }

        const userMsg: Message = {
          id: `msg-${Date.now()}`,
          sessionId: sessionId!,
          role: "user",
          content: userMessage,
          createdAt: new Date().toISOString(),
        };
        addMessage(userMsg);

        const assistantMsg: Message = {
          id: `msg-${Date.now() + 1}`,
          sessionId: sessionId!,
          role: "assistant",
          content: "",
          modelId: selectedModel.id,
          createdAt: new Date().toISOString(),
        };
        addMessage(assistantMsg);

        const response = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionId,
            message: userMessage,
            modelId: selectedModel.id,
            mode,
            streamResponses,
            safeMode,
            developerMode,
            betaFeatures,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6)) as {
                type?: string;
                content?: string;
                error?: string;
                id?: string;
                name?: string;
                args?: Record<string, unknown>;
                result?: string;
                assistantMessageId?: string;
              };

              if (data.type === "token" && typeof data.content === "string") {
                appendToLastMessage(data.content);
              } else if (data.type === "error") {
                appendToLastMessage(
                  `\n\n[Error: ${data.error ?? "Unknown error"}]`
                );
              } else if (data.type === "tool") {
                if (typeof data.assistantMessageId === "string") {
                  remapLastAssistantMessageId(data.assistantMessageId);
                }
                const msgs = useChatStore.getState().currentMessages;
                const lastAssistant = [...msgs]
                  .reverse()
                  .find((m) => m.role === "assistant");
                if (
                  lastAssistant &&
                  typeof data.id === "string" &&
                  typeof data.name === "string"
                ) {
                  addToolCall({
                    id: data.id,
                    messageId: lastAssistant.id,
                    name: data.name,
                    args: data.args ?? {},
                    createdAt: new Date().toISOString(),
                  });
                }
              } else if (data.type === "tool_result" && typeof data.id === "string") {
                updateToolCallResult(
                  data.id,
                  typeof data.result === "string" ? data.result : ""
                );
              }
            } catch (e) {
              console.error("Failed to parse SSE event:", e);
            }
          }

          buffer = lines[lines.length - 1];
        }

        const synced = await fetchSessionMessages(sessionId!);
        if (synced.length > 0) {
          setCurrentMessages(synced);
        }
      } catch (error) {
        console.error("Chat error:", error);
        appendToLastMessage(
          `\n\n[Error: ${error instanceof Error ? error.message : "Unknown error"}]`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      selectedModel,
      currentSessionId,
      mode,
      streamResponses,
      safeMode,
      developerMode,
      betaFeatures,
      addMessage,
      appendToLastMessage,
      setIsLoading,
      setCurrentMessages,
      setSessions,
      setCurrentSessionId,
      addToolCall,
      updateToolCallResult,
      remapLastAssistantMessageId,
    ]
  );

  return { sendMessage };
}
