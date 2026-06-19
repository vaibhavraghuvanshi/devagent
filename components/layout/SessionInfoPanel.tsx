"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChatStore } from "@/lib/store";
import {
  X, Calendar, MessageSquare, Zap, Pencil, Check, Download,
  ChevronRight, Bot,
} from "lucide-react";

interface Props {
  onClose: () => void;
}

export function SessionInfoPanel({ onClose }: Props) {
  const {
    currentSessionId,
    sessions,
    setSessions,
    currentMessages,
    mode,
    selectedModel,
  } = useChatStore();

  const chatSession = sessions.find((s) => s.id === currentSessionId);

  const [title, setTitle] = useState(chatSession?.title ?? "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle) inputRef.current?.focus();
  }, [editingTitle]);

  useEffect(() => {
    setTitle(chatSession?.title ?? "");
  }, [chatSession?.title]);

  const saveTitle = useCallback(async () => {
    if (!currentSessionId || !title.trim() || title.trim() === chatSession?.title) {
      setEditingTitle(false);
      setTitle(chatSession?.title ?? "");
      return;
    }
    setSavingTitle(true);
    try {
      const res = await fetch(`/api/sessions/${currentSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (res.ok) {
        const trimmed = title.trim();
        setSessions(
          useChatStore.getState().sessions.map((s) =>
            s.id === currentSessionId ? { ...s, title: trimmed } : s
          )
        );
      }
    } finally {
      setSavingTitle(false);
      setEditingTitle(false);
    }
  }, [currentSessionId, title, chatSession?.title, setSessions]);

  const exportMarkdown = () => {
    const lines: string[] = [
      `# ${chatSession?.title ?? "Chat"}`,
      ``,
      `> Exported from Dev Agent — ${new Date().toLocaleString()}`,
      ``,
    ];
    currentMessages.forEach((m) => {
      if (m.role === "tool") return;
      lines.push(`### ${m.role === "user" ? "You" : `Assistant${m.modelId ? ` (${m.modelId})` : ""}`}`);
      lines.push(m.content);
      lines.push(``);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(chatSession?.title ?? "chat").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const userMessages = currentMessages.filter((m) => m.role === "user").length;
  const assistantMessages = currentMessages.filter((m) => m.role === "assistant").length;
  const lastModel = currentMessages.filter((m) => m.role === "assistant" && m.modelId).at(-1)?.modelId;
  const displayModel = lastModel ?? selectedModel?.label ?? "—";

  const createdDate = chatSession?.createdAt
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(chatSession.createdAt))
    : "—";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Slide-in panel */}
      <div className="fixed right-0 top-0 h-full z-50 w-80 bg-white dark:bg-[#111827] border-l border-[#E5E7EB] dark:border-[#243042] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] dark:border-[#243042]">
          <h2 className="text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">Chat Info</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f4f8] dark:hover:bg-white/5 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!chatSession ? (
          <div className="flex-1 flex items-center justify-center text-[#9CA3AF] text-sm px-5 text-center">
            <p>No chat selected. Start or open a conversation to see its details.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Title */}
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Title</p>
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle();
                      if (e.key === "Escape") { setEditingTitle(false); setTitle(chatSession.title); }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#15b728] bg-[#f4f4f8] dark:bg-[#0B1020] text-sm text-[#111827] dark:text-[#F9FAFB] focus:outline-none"
                    maxLength={120}
                  />
                  <button
                    onClick={saveTitle}
                    disabled={savingTitle}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#15b728] text-white hover:bg-[#12a023] transition-all disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#243042] hover:border-[#15b728] bg-[#f4f4f8] dark:bg-[#0B1020] text-sm text-[#111827] dark:text-[#F9FAFB] text-left transition-all group"
                >
                  <span className="truncate flex-1">{chatSession.title}</span>
                  <Pencil className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#15b728] flex-shrink-0 transition-colors" />
                </button>
              )}
            </div>

            {/* Stats */}
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Details</p>
              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#243042] overflow-hidden divide-y divide-[#E5E7EB] dark:divide-[#243042]">
                {[
                  {
                    icon: Calendar,
                    label: "Created",
                    value: createdDate,
                  },
                  {
                    icon: MessageSquare,
                    label: "Messages",
                    value: `${userMessages} from you · ${assistantMessages} from AI`,
                  },
                  {
                    icon: Bot,
                    label: "Model",
                    value: displayModel,
                  },
                  {
                    icon: Zap,
                    label: "Mode",
                    value: (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        mode === "agent"
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                          : "bg-[#e8f9ea] dark:bg-[#15b728]/10 text-[#15b728]"
                      }`}>
                        {mode.toUpperCase()}
                      </span>
                    ),
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2.5">
                    <Icon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#9CA3AF] font-medium">{label}</p>
                      {typeof value === "string"
                        ? <p className="text-xs text-[#111827] dark:text-[#F9FAFB] truncate mt-0.5">{value}</p>
                        : <div className="mt-0.5">{value}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Actions</p>
              <div className="rounded-xl border border-[#E5E7EB] dark:border-[#243042] overflow-hidden divide-y divide-[#E5E7EB] dark:divide-[#243042]">
                <button
                  onClick={exportMarkdown}
                  disabled={currentMessages.length === 0}
                  className="w-full flex items-center justify-between gap-3 px-3 py-3 text-sm text-[#111827] dark:text-[#F9FAFB] hover:bg-[#f4f4f8] dark:hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-[#9CA3AF]" />
                    <span>Export as Markdown</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
