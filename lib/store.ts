import { create } from "zustand";
import { ModelConfig } from "./models";

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "tool";
  content: string;
  modelId?: string;
  createdAt: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  messageId: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  mode: "chat" | "agent";
  createdAt: string;
}

export interface ContextFile {
  path: string;
  addedAt: string;
}

interface ChatStore {
  currentSessionId: string | null;
  sessions: Session[];
  currentMessages: Message[];
  selectedModel: ModelConfig | null;
  mode: "chat" | "agent";
  contextFiles: ContextFile[];
  isLoading: boolean;
  view: "chat" | "library" | "agents" | "templates" | "settings";
  searchOpen: boolean;
  sendOnEnter: boolean;
  codeHighlighting: boolean;
  streamResponses: boolean;
  verboseToolLogs: boolean;
  safeMode: boolean;
  developerMode: boolean;
  betaFeatures: boolean;

  setCurrentSessionId: (id: string | null) => void;
  setSessions: (sessions: Session[]) => void;
  setCurrentMessages: (messages: Message[]) => void;
  setSelectedModel: (model: ModelConfig) => void;
  setMode: (mode: "chat" | "agent") => void;
  setView: (view: "chat" | "library" | "agents" | "templates" | "settings") => void;
  setSearchOpen: (open: boolean) => void;
  setSendOnEnter: (enabled: boolean) => void;
  setCodeHighlighting: (enabled: boolean) => void;
  setStreamResponses: (enabled: boolean) => void;
  setVerboseToolLogs: (enabled: boolean) => void;
  setSafeMode: (enabled: boolean) => void;
  setDeveloperMode: (enabled: boolean) => void;
  setBetaFeatures: (enabled: boolean) => void;
  addContextFile: (path: string) => void;
  removeContextFile: (path: string) => void;
  setIsLoading: (loading: boolean) => void;
  addMessage: (message: Message) => void;
  addToolCall: (toolCall: ToolCall) => void;
  updateToolCallResult: (toolCallId: string, result: string) => void;
  remapLastAssistantMessageId: (serverId: string) => void;
  updateLastMessageContent: (content: string) => void;
  appendToLastMessage: (content: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentSessionId: null,
  sessions: [],
  currentMessages: [],
  selectedModel: null,
  mode: "chat",
  contextFiles: [],
  isLoading: false,
  view: "chat",
  searchOpen: false,
  sendOnEnter: true,
  codeHighlighting: true,
  streamResponses: true,
  verboseToolLogs: false,
  safeMode: true,
  developerMode: false,
  betaFeatures: false,

  setCurrentSessionId: (id: string | null) =>
    set({ currentSessionId: id }),
  setSessions: (sessions: Session[]) => set({ sessions }),
  setCurrentMessages: (messages: Message[]) =>
    set({ currentMessages: messages }),
  setSelectedModel: (model: ModelConfig) =>
    set({ selectedModel: model }),
  setMode: (mode: "chat" | "agent") => set({ mode }),
  setView: (view: "chat" | "library" | "agents" | "templates" | "settings") => set({ view }),
  setSearchOpen: (open: boolean) => set({ searchOpen: open }),
  setSendOnEnter: (enabled: boolean) => set({ sendOnEnter: enabled }),
  setCodeHighlighting: (enabled: boolean) => set({ codeHighlighting: enabled }),
  setStreamResponses: (enabled: boolean) => set({ streamResponses: enabled }),
  setVerboseToolLogs: (enabled: boolean) => set({ verboseToolLogs: enabled }),
  setSafeMode: (enabled: boolean) => set({ safeMode: enabled }),
  setDeveloperMode: (enabled: boolean) => set({ developerMode: enabled }),
  setBetaFeatures: (enabled: boolean) => set({ betaFeatures: enabled }),
  addContextFile: (path: string) =>
    set((state) => ({
      contextFiles: [
        ...state.contextFiles,
        { path, addedAt: new Date().toISOString() },
      ],
    })),
  removeContextFile: (path: string) =>
    set((state) => ({
      contextFiles: state.contextFiles.filter((f) => f.path !== path),
    })),
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  addMessage: (message: Message) =>
    set((state) => ({
      currentMessages: [...state.currentMessages, message],
    })),
  addToolCall: (toolCall: ToolCall) =>
    set((state) => ({
      currentMessages: state.currentMessages.map((msg) =>
        msg.id === toolCall.messageId
          ? {
              ...msg,
              toolCalls: [...(msg.toolCalls || []), toolCall],
            }
          : msg
      ),
    })),
  updateToolCallResult: (toolCallId: string, result: string) =>
    set((state) => ({
      currentMessages: state.currentMessages.map((msg) => ({
        ...msg,
        toolCalls: msg.toolCalls?.map((tc) =>
          tc.id === toolCallId ? { ...tc, result } : tc
        ),
      })),
    })),
  remapLastAssistantMessageId: (serverId: string) =>
    set((state) => {
      let idx = -1;
      for (let i = state.currentMessages.length - 1; i >= 0; i--) {
        if (state.currentMessages[i].role === "assistant") {
          idx = i;
          break;
        }
      }
      if (idx < 0) return state;
      const next = [...state.currentMessages];
      next[idx] = { ...next[idx], id: serverId };
      return { currentMessages: next };
    }),
  updateLastMessageContent: (content: string) =>
    set((state) => ({
      currentMessages: state.currentMessages.map((msg, idx) =>
        idx === state.currentMessages.length - 1
          ? { ...msg, content }
          : msg
      ),
    })),
  appendToLastMessage: (content: string) =>
    set((state) => ({
      currentMessages: state.currentMessages.map((msg, idx) =>
        idx === state.currentMessages.length - 1
          ? { ...msg, content: msg.content + content }
          : msg
      ),
    })),
}));
