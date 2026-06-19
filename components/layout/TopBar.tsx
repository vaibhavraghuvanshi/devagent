"use client";

import { useState } from "react";
import { useChatStore } from "@/lib/store";
import { ModelSelector } from "@/components/model/ModelSelector";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ShareModal } from "@/components/layout/ShareModal";
import { SessionInfoPanel } from "@/components/layout/SessionInfoPanel";
import { ChevronDown, Share2, Info } from "lucide-react";
import Image from "next/image";
import LogoImage from "@/public/dev-agent-logo.svg";

export function TopBar() {
  const { mode, setMode, currentSessionId } = useChatStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  return (
    <>
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB] dark:border-[#243042] bg-white dark:bg-[#111827]">
      <div className="flex items-center gap-2">
        <Image src={LogoImage} alt="Dev Agent Logo" className="w-8 h-8 flex-shrink-0" />
        <button className="flex items-center gap-1.5 text-[15px] font-semibold text-[#111827] dark:text-[#F9FAFB] hover:opacity-80 transition-opacity">
          {currentSessionId ? "Chat" : "New Chat"}
          <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
        </button>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1 bg-[#e8f9ea] dark:bg-white/5 p-1 rounded-xl mr-2 border border-[#d1f5d3] dark:border-[#243042]">
          {["chat","agent"].map((m) => (
            <button key={m} onClick={() => setMode(m as "chat"|"agent")}
              className={"flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all " + (mode === m
                ? "text-white" : "text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white")}
              style={mode === m ? { background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" } : {}}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <ModelSelector />
        <div className="w-px h-5 bg-[#E5E7EB] dark:bg-[#243042] mx-1" />
        <ThemeToggle />
        <button
          onClick={() => currentSessionId && setShareOpen(true)}
          disabled={!currentSessionId}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f4f4f8] dark:hover:bg-white/5 text-[#9CA3AF] hover:text-[#15b728] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title={currentSessionId ? "Share chat" : "Open a chat to share"}
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setInfoOpen((v) => !v)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f4f4f8] dark:hover:bg-white/5 transition-all ${
            infoOpen ? "bg-[#e8f9ea] dark:bg-[#15b728]/10 text-[#15b728]" : "text-[#9CA3AF] hover:text-[#15b728]"
          }`}
          title="Chat info"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </div>
    {shareOpen && currentSessionId && (
      <ShareModal sessionId={currentSessionId} onClose={() => setShareOpen(false)} />
    )}
    {infoOpen && <SessionInfoPanel onClose={() => setInfoOpen(false)} />}
  </>
  );
}
