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
    setSessions,
    setCurrentMessages,
    setCurrentSessionId,
    currentSessionId,
    view,
  } = useChatStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !initialized) {
      // Only set a default model if none is selected yet
      if (!useChatStore.getState().selectedModel) {
        setSelectedModel(MODELS[1]);
      }

      (async () => {
        try {
          const createMode = useChatStore.getState().mode;
          const res = await fetch("/api/sessions");
          if (!res.ok) {
            console.error("Failed to load sessions", await res.text());
            setInitialized(true);
            return;
          }
          const data = (await res.json()) as { sessions?: Session[] };
          let list = Array.isArray(data.sessions) ? data.sessions : [];

          if (list.length === 0) {
            const create = await fetch("/api/sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: "New chat", mode: createMode }),
            });
            if (create.ok) {
              const created = (await create.json()) as { session?: Session };
              if (created.session) {
                list = [created.session];
              }
            }
          }

          setSessions(list);
          if (list[0]?.id) {
            setCurrentSessionId(list[0].id);
          }
        } catch (e) {
          console.error(e);
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
    setSessions,
    setCurrentSessionId,
  ]);

  useEffect(() => {
    if (status !== "authenticated" || !currentSessionId) return;

    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/sessions/${currentSessionId}/messages`);
      const data = (await res.json()) as { messages?: unknown };
      if (cancelled || !res.ok || !Array.isArray(data.messages)) return;
      setCurrentMessages(data.messages as Message[]);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentSessionId, status, setCurrentMessages]);

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
