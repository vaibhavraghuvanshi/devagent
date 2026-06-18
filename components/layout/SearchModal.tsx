"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "@/lib/store";
import { Search, X, Plus, MessageSquare, Zap } from "lucide-react";

interface SearchSession {
  id: string;
  title: string;
  mode: "chat" | "agent";
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

function groupByDate(sessions: SearchSession[]) {
  const now = new Date();
  const groups: Record<string, SearchSession[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  };
  for (const s of sessions) {
    const diff = Math.floor(
      (now.getTime() - new Date(s.updatedAt).getTime()) / 86400000
    );
    if (diff === 0) groups["Today"].push(s);
    else if (diff === 1) groups["Yesterday"].push(s);
    else if (diff <= 7) groups["Previous 7 days"].push(s);
    else groups["Older"].push(s);
  }
  return groups;
}

export function SearchModal() {
  const { searchOpen, setSearchOpen, setCurrentSessionId, setCurrentMessages, setView } =
    useChatStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSession[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Fetch on query change (debounced)
  const fetchResults = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/sessions/search?q=${encodeURIComponent(q)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as { sessions?: SearchSession[] };
      setResults(Array.isArray(data.sessions) ? data.sessions : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchOpen, fetchResults]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSearchOpen]);

  const openSession = (id: string) => {
    setCurrentSessionId(id);
    setCurrentMessages([]);
    setView("chat");
    setSearchOpen(false);
  };

  if (!searchOpen) return null;

  const groups = groupByDate(results);
  const hasResults = results.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setSearchOpen(false)}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#1A2235] rounded-2xl shadow-2xl overflow-hidden border border-[#E5E7EB] dark:border-[#243042]"
        style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.35)" }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E5E7EB] dark:border-[#243042]">
          <Search className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="flex-1 bg-transparent text-sm text-[#111827] dark:text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-[#15b728] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          <button
            onClick={() => setSearchOpen(false)}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#f4f4f8] dark:hover:bg-white/5 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {/* New chat shortcut */}
          <div className="p-2">
            <button
              onClick={() => {
                setView("chat");
                setSearchOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#111827] dark:text-[#F9FAFB] hover:bg-[#f4f4f8] dark:hover:bg-white/5 transition-all"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#e8f9ea] dark:bg-white/5">
                <Plus className="w-4 h-4 text-[#15b728]" />
              </div>
              <span className="font-medium">New chat</span>
            </button>
          </div>

          {hasResults ? (
            Object.entries(groups).map(([label, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={label} className="px-2 pb-2">
                  <p className="px-3 py-1.5 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                    {label}
                  </p>
                  {items.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => openSession(s.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[#f4f4f8] dark:hover:bg-white/5 transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#f4f4f8] dark:bg-white/5 group-hover:bg-[#e8f9ea] dark:group-hover:bg-[#15b728]/10 transition-colors">
                        {s.mode === "agent" ? (
                          <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 text-[#15b728]" />
                        )}
                      </div>
                      <span className="flex-1 text-sm text-[#111827] dark:text-[#F9FAFB] truncate">
                        {s.title}
                      </span>
                      <span className="text-[11px] text-[#9CA3AF] flex-shrink-0">
                        {s.messageCount} msg
                      </span>
                    </button>
                  ))}
                </div>
              );
            })
          ) : !loading && query ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[#9CA3AF]">
                No chats found for &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
