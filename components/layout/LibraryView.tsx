"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/lib/store";
import {
  MessageSquare,
  Zap,
  LayoutGrid,
  List,
  Search,
  Plus,
  Clock,
} from "lucide-react";

interface LibrarySession {
  id: string;
  title: string;
  mode: "chat" | "agent";
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

type Filter = "all" | "chat" | "agent";
type ViewMode = "grid" | "list";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: diff > 365 ? "numeric" : undefined });
}

export function LibraryView() {
  const { setView, setCurrentSessionId, setCurrentMessages } = useChatStore();
  const [sessions, setSessions] = useState<LibrarySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/sessions/search?q=");
        if (!res.ok) return;
        const data = (await res.json()) as { sessions?: LibrarySession[] };
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openSession = (id: string) => {
    setCurrentSessionId(id);
    setCurrentMessages([]);
    setView("chat");
  };

  const filtered = sessions.filter((s) => {
    if (filter === "chat" && s.mode !== "chat") return false;
    if (filter === "agent" && s.mode !== "agent") return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f4f8] dark:bg-[#0B1020] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#111827] dark:text-[#F9FAFB]">
            Library
          </h1>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-xl text-sm">
              <Search className="w-4 h-4 text-[#9CA3AF]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="bg-transparent text-[#111827] dark:text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none w-36"
              />
            </div>
            {/* New chat button */}
            <button
              onClick={() => setView("chat")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1">
            {(["all", "chat", "agent"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-[#111827] dark:bg-white text-white dark:text-[#111827]"
                    : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white hover:bg-white dark:hover:bg-white/5"
                }`}
              >
                {f === "all" ? "All" : f === "chat" ? "Chat" : "Agent"}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-[#e8f9ea] dark:bg-white/10 text-[#15b728]" : "text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-[#e8f9ea] dark:bg-white/10 text-[#15b728]" : "text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#15b728] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f9ea] dark:bg-white/5 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-[#15b728]" />
            </div>
            <p className="text-sm text-[#9CA3AF]">
              {search ? `No chats matching "${search}"` : "No chats yet"}
            </p>
          </div>
        ) : viewMode === "list" ? (
          /* ── List view ─────────────────────────────────────────── */
          <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_140px_80px] gap-4 px-5 py-3 border-b border-[#E5E7EB] dark:border-[#243042]">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Name</span>
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Modified</span>
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Messages</span>
            </div>
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s.id)}
                className="w-full grid grid-cols-[1fr_140px_80px] gap-4 px-5 py-3.5 border-b border-[#F3F4F6] dark:border-[#1E293B] last:border-0 hover:bg-[#f4f4f8] dark:hover:bg-white/5 transition-all text-left group"
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#e8f9ea] dark:bg-white/5 group-hover:bg-[#d1f5d3] dark:group-hover:bg-[#15b728]/20 transition-colors">
                    {s.mode === "agent" ? (
                      <Zap className="w-4 h-4 text-[#F59E0B]" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-[#15b728]" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] truncate">
                    {s.title}
                  </span>
                </div>
                {/* Modified */}
                <div className="flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-[#94A3B8]">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  {formatDate(s.updatedAt)}
                </div>
                {/* Message count */}
                <span className="flex items-center text-sm text-[#6B7280] dark:text-[#94A3B8]">
                  {s.messageCount}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* ── Grid view ─────────────────────────────────────────── */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s.id)}
                className="flex flex-col gap-3 p-4 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl text-left hover:border-[#15b728] hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#e8f9ea] dark:bg-white/5 group-hover:bg-[#d1f5d3] dark:group-hover:bg-[#15b728]/20 transition-colors">
                  {s.mode === "agent" ? (
                    <Zap className="w-4 h-4 text-[#F59E0B]" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-[#15b728]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] truncate">
                    {s.title}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    {s.messageCount} messages
                  </p>
                </div>
                <p className="text-[11px] text-[#9CA3AF]">
                  {formatDate(s.updatedAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
