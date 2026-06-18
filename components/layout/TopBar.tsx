"use client";

import { useChatStore } from "@/lib/store";
import { ModelSelector } from "@/components/model/ModelSelector";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ChevronDown, Share2, Info } from "lucide-react";

export function TopBar() {
  const { mode, setMode, currentSessionId } = useChatStore();
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB] dark:border-[#243042] bg-white dark:bg-[#111827]">
      <div className="flex items-center gap-2">
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
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f4f4f8] dark:hover:bg-white/5 text-[#9CA3AF] hover:text-[#15b728] transition-all" title="Share">
          <Share2 className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f4f4f8] dark:hover:bg-white/5 text-[#9CA3AF] hover:text-[#15b728] transition-all" title="Info">
          <Info className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
