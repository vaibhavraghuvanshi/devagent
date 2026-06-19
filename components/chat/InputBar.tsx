"use client";

import { useEffect, useRef, useState } from "react";
import { useChatStore } from "@/lib/store";
import { Paperclip, Smile } from "lucide-react";
import { useGroqChat } from "@/lib/hooks/useGroqChat";

export function InputBar() {
  const [message, setMessage] = useState("");
  const { selectedModel, isLoading, sendOnEnter } = useChatStore();
  const { sendMessage } = useGroqChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (resizeThrottleRef.current) clearTimeout(resizeThrottleRef.current);
    resizeThrottleRef.current = setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, 100);
    return () => {
      if (resizeThrottleRef.current) clearTimeout(resizeThrottleRef.current);
    };
  }, [message]);

  useEffect(() => {
    const handler = (e: Event) => {
      const prompt = (e as CustomEvent<string>).detail;
      setMessage(prompt);
      textareaRef.current?.focus();
    };
    window.addEventListener("suggestion-click", handler);
    return () => window.removeEventListener("suggestion-click", handler);
  }, []);

  const handleSend = async () => {
    if (!message.trim() || !selectedModel || isLoading) return;
    const msg = message;
    setMessage("");
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!sendOnEnter) return;
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const canSend = !!message.trim() && !!selectedModel && !isLoading;

  return (
    <div className="px-5 pb-4 pt-3 bg-[#f4f4f8] dark:bg-[#0B1020]">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl px-4 py-3 shadow-sm"
          style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}>
          {/* Left icons */}
          <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
            <button disabled={isLoading}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#15b728] hover:bg-[#e8f9ea] dark:hover:bg-white/5 transition-all disabled:opacity-40"
              title="Attach file">
              <Paperclip className="w-4 h-4" />
            </button>
            <button disabled={isLoading}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#15b728] hover:bg-[#e8f9ea] dark:hover:bg-white/5 transition-all disabled:opacity-40"
              title="Emoji">
              <Smile className="w-4 h-4" />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Agent..."
            disabled={!selectedModel || isLoading}
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#111827] dark:text-[#F9FAFB] placeholder-[#9CA3AF] resize-none focus:outline-none disabled:cursor-not-allowed leading-6 py-0.5"
            style={{ maxHeight: "200px" }}
          />

          {/* Send button */}
          <button onClick={handleSend} disabled={!canSend}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={canSend ? { background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)", boxShadow: "0 4px 16px rgba(21,183,40,0.40)" } : { background: "#E5E7EB" }}
            title="Send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={canSend ? "white" : "#9CA3AF"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[11px] text-[#9CA3AF] mt-2">
          AI Agent can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}
