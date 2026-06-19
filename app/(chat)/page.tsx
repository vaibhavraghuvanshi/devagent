"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { SearchModal } from "@/components/layout/SearchModal";
import { LibraryView } from "@/components/layout/LibraryView";
import { AgentsView } from "@/components/layout/AgentsView";
import { TemplatesView } from "@/components/layout/TemplatesView";
import { SettingsView } from "@/components/layout/SettingsView";
import { ChatLog } from "@/components/chat/ChatLog";
import { InputBar } from "@/components/chat/InputBar";
import { useChatStore, Session, Message } from "@/lib/store";
import { MODELS } from "@/lib/models";

function ChatPageContent() {
  const router = useRouter();
  const { status } = useSession();
  const {
    setSelectedModel,
    setMode,
    setSendOnEnter,
    setCodeHighlighting,
    setStreamResponses,
    setVerboseToolLogs,
    setSafeMode,
    setDeveloperMode,
    setBetaFeatures,
    setSessions,
    setCurrentMessages,
    setCurrentSessionId,
    setView,
    currentSessionId,
    view,
    setIsLoadingSession,
  } = useChatStore();
  const [initialized, setInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !initialized) {
      (async () => {
        try {
          const [prefRes, advancedRes, sessionsRes] = await Promise.all([
            fetch("/api/user/preferences"),
            fetch("/api/user/advanced"),
            fetch("/api/sessions"),
          ]);

          let preferredModelId: string | undefined;
          let preferredMode: "chat" | "agent" | undefined;
          let sendOnEnter = true;
          let codeHighlighting = true;
          if (prefRes.ok) {
            const prefData = (await prefRes.json()) as { defaultModel?: string; defaultMode?: string; sendOnEnter?: boolean; codeHighlighting?: boolean };
            preferredModelId = prefData.defaultModel;
            preferredMode = prefData.defaultMode === "agent" ? "agent" : "chat";
            sendOnEnter = prefData.sendOnEnter ?? true;
            codeHighlighting = prefData.codeHighlighting ?? true;
          }
          setMode(preferredMode ?? "chat");
          setSendOnEnter(sendOnEnter);
          setCodeHighlighting(codeHighlighting);

          if (!useChatStore.getState().selectedModel) {
            const preferred = MODELS.find((m) => m.id === preferredModelId);
            setSelectedModel(preferred ?? MODELS[1] ?? MODELS[0]);
          }

          if (advancedRes.ok) {
            const advancedData = (await advancedRes.json()) as {
              streamResponses?: boolean;
              verboseToolLogs?: boolean;
              safeMode?: boolean;
              developerMode?: boolean;
              betaFeatures?: boolean;
            };
            setStreamResponses(advancedData.streamResponses ?? true);
            setVerboseToolLogs(advancedData.verboseToolLogs ?? false);
            setSafeMode(advancedData.safeMode ?? true);
            setDeveloperMode(advancedData.developerMode ?? false);
            setBetaFeatures(advancedData.betaFeatures ?? false);
          }

          if (!sessionsRes.ok) {
            setInitError("Failed to load sessions. Please refresh the page.");
            setInitialized(true);
            return;
          }
          const data = (await sessionsRes.json()) as { sessions?: Session[] };
          const list = Array.isArray(data.sessions) ? data.sessions : [];

          setSessions(list);
          setCurrentSessionId(null);
          setCurrentMessages([]);
          setView("chat");
        } catch (e) {
          console.error(e);
          setInitError("Failed to initialize. Please refresh the page.");
        } finally {
          setInitialized(true);
        }
      })();
    }
  }, [
    status,
    router,
    initialized,
    setSelectedModel,
    setMode,
    setSendOnEnter,
    setCodeHighlighting,
    setStreamResponses,
    setVerboseToolLogs,
    setSafeMode,
    setDeveloperMode,
    setBetaFeatures,
    setSessions,
    setCurrentMessages,
    setCurrentSessionId,
    setView,
  ]);

  useEffect(() => {
    if (status !== "authenticated" || !initialized || !currentSessionId) return;

    let cancelled = false;
    setIsLoadingSession(true);
    (async () => {
      const res = await fetch(`/api/sessions/${currentSessionId}/messages`);
      const data = (await res.json()) as { messages?: unknown };
      if (cancelled) return;
      if (!res.ok || !Array.isArray(data.messages)) {
        setIsLoadingSession(false);
        return;
      }
      setCurrentMessages(data.messages as Message[]);
      setIsLoadingSession(false);
    })();

    return () => {
      cancelled = true;
      setIsLoadingSession(false);
    };
  }, [currentSessionId, initialized, status, setCurrentMessages, setIsLoadingSession]);

  if (status === "loading" || (status === "authenticated" && !initialized)) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-secondary">Loading…</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex h-screen bg-primary text-primary overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        {initError && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm" role="alert">
            <span>{initError}</span>
            <button onClick={() => setInitError(null)} className="ml-4 text-red-400 hover:text-red-600 transition-colors" aria-label="Dismiss">✕</button>
          </div>
        )}
        {view === "library" ? (
          <LibraryView />
        ) : view === "agents" ? (
          <AgentsView />
        ) : view === "templates" ? (
          <TemplatesView />
        ) : view === "settings" ? (
          <SettingsView />
        ) : (
          <>
            <ChatLog />
            <InputBar />
          </>
        )}
      </div>
      <SearchModal />
    </div>
  );
}

export default function ChatPage() {
  return <ChatPageContent />;
}
