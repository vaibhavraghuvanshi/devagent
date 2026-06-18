"use client";

import { useChatStore, Session } from "@/lib/store";
import { Plus, Trash2, Search, BookOpen, Bot, LayoutTemplate, Sparkles, ChevronUp, Settings, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

function groupSessions(sessions: Session[]) {
  const now = new Date();
  const today: Session[] = [], yesterday: Session[] = [], earlier: Session[] = [];
  for (const s of sessions) {
    const d = Math.floor((now.getTime() - new Date(s.createdAt).getTime()) / 86400000);
    if (d === 0) today.push(s);
    else if (d === 1) yesterday.push(s);
    else earlier.push(s);
  }
  return { today, yesterday, earlier };
}

export function Sidebar() {
  const { sessions, currentSessionId, setCurrentSessionId, setCurrentMessages, setSessions, mode, view, setView, setSearchOpen } = useChatStore();
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleNewChat = async () => {
    setView("chat");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New chat", mode }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { session?: Session };
      if (!data.session) return;
      setSessions([data.session, ...useChatStore.getState().sessions]);
      setCurrentSessionId(data.session.id);
      setCurrentMessages([]);
    } catch (e) { console.error(e); }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) { setCurrentSessionId(updated[0]?.id ?? ""); setCurrentMessages([]); }
  };

  const NAV_ITEMS = [
    { icon: Search,         label: "Search",    action: () => setSearchOpen(true) },
    { icon: BookOpen,       label: "Library",   action: () => setView("library") },
    { icon: Bot,            label: "Agents",    action: () => setView("agents") },
    { icon: LayoutTemplate, label: "Templates", action: () => setView("templates") },
  ];

  const { today, yesterday, earlier } = groupSessions(sessions);

  const SessionItem = ({ s }: { s: Session }) => (
    <div onClick={() => { setCurrentSessionId(s.id); setCurrentMessages([]); setView("chat"); }}
      className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all ${
        currentSessionId === s.id
          ? "bg-white/10 text-white font-medium"
          : "text-[#bbbbbc] hover:bg-white/5 hover:text-white"
      }`} title={s.title}>
      <span className="truncate">{s.title || "Untitled"}</span>
      <button onClick={(e) => handleDelete(e, s.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-0.5 rounded">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const SectionLabel = ({ label }: { label: string }) => (
    <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold text-[#767679] uppercase tracking-widest">{label}</p>
  );

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full" style={{ background: "linear-gradient(180deg,#141414 0%,#1a1a1a 100%)" }}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-wide">Dev Agent</span>
        </div>
        <button onClick={handleNewChat}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#94A3B8] hover:text-white transition-all"
          title="New chat">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat nav item */}
      <div className="px-3 pt-3">
        <button onClick={handleNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-white bg-white/10 hover:bg-white/15">
          <Plus className="w-4 h-4 text-[#1ec830]" />
          New Chat
        </button>
      </div>

      {/* Nav items */}
      <div className="px-3 pt-1 pb-2 border-b border-white/5">
        {NAV_ITEMS.map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              label.toLowerCase() === view
                ? "bg-white/10 text-white font-medium"
                : "text-[#99999b] hover:bg-white/5 hover:text-white"
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {sessions.length === 0 ? (
          <p className="px-3 py-6 text-xs text-center text-[#475569]">No chats yet</p>
        ) : (
          <>
            {today.length > 0 && (<><SectionLabel label="Today" />{today.map((s) => <SessionItem key={s.id} s={s} />)}</>)}
            {yesterday.length > 0 && (<><SectionLabel label="Yesterday" />{yesterday.map((s) => <SessionItem key={s.id} s={s} />)}</>)}
            {earlier.length > 0 && (<><SectionLabel label="Last 7 days" />{earlier.map((s) => <SessionItem key={s.id} s={s} />)}</>)}
          </>
        )}
      </div>

      {/* User profile */}
      <div className="px-3 py-3 border-t border-white/5 relative">
        {/* Popup menu */}
        {profileOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
            <div className="absolute bottom-full left-3 right-3 mb-2 z-20 bg-[#1A2235] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <button
                onClick={() => { setView("settings"); setProfileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                  view === "settings" ? "text-white bg-white/10" : "text-[#94A3B8] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <div className="h-px bg-white/5 mx-3" />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => setProfileOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#15b728,#22d63b)" }}>
            {session?.user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-white truncate">{session?.user?.name || "User"}</p>
            <p className="text-[10px] text-[#15b728] font-medium">Pro Plan</p>
          </div>
          <ChevronUp className={`w-3.5 h-3.5 text-[#475569] group-hover:text-white transition-all ${profileOpen ? "" : "rotate-180"}`} />
        </button>
      </div>
    </aside>
  );
}
