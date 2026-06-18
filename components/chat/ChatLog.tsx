"use client";

import { useChatStore } from "@/lib/store";
import { MessageBubble } from "./MessageBubble";
import { ToolCallCard } from "./ToolCallCard";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, Code2, Lightbulb, FileText, Pencil, Globe, FlaskConical } from "lucide-react";

const SUGGESTIONS = [
  { icon: Code2,        label: "Write code",        prompt: "Write a Python function that reads a CSV file and outputs a summary.",   color: "#15b728" },
  { icon: Lightbulb,    label: "Explain concept",   prompt: "Explain how async/await works in JavaScript with a simple example.",     color: "#F59E0B" },
  { icon: FileText,     label: "Summarize text",     prompt: "Summarize the following article in 3 concise bullet points:",            color: "#10B981" },
  { icon: Pencil,       label: "Draft email",        prompt: "Draft a professional follow-up email after a job interview.",            color: "#15b728" },
  { icon: Globe,        label: "Translate",          prompt: "Translate the following text to Spanish:",                               color: "#06B6D4" },
  { icon: FlaskConical, label: "Debug code",         prompt: "Review this code for bugs and suggest improvements:",                    color: "#EF4444" },
];

export function ChatLog() {
  const { currentMessages, isLoading, verboseToolLogs } = useChatStore();
  const { data: session } = useSession();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [currentMessages, isLoading]);

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f4f8] dark:bg-[#0B1020]">
      {currentMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-full px-6 py-16">
          <div className="w-full max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">
                  Hello, {firstName}! ??
                </h1>
                <p className="text-[#6B7280] dark:text-[#CBD5E1] text-sm">How can I help you today?</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUGGESTIONS.map(({ icon: Icon, label, prompt, color }) => (
                <button key={label}
                  onClick={() => window.dispatchEvent(new CustomEvent("suggestion-click", { detail: prompt }))}
                  className="flex flex-col gap-2.5 p-4 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl text-left hover:border-[#15b728] hover:shadow-sm transition-all group">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color + "15" }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">{label}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-2 leading-relaxed">{prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">
          {currentMessages.map((msg) => (
            <div key={msg.id} className="animate-slideUp">
              <MessageBubble message={msg} />
              {verboseToolLogs && msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="ml-11 mt-3 space-y-2">
                  {msg.toolCalls.map((tc) => <ToolCallCard key={tc.id} toolCall={tc} />)}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 animate-slideUp">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-3 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl rounded-tl-sm shadow-sm">
                <span className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-[#15b728] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-[#15b728] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-[#15b728] rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}
    </div>
  );
}
