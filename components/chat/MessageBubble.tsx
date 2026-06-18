"use client";

import { Message } from "@/lib/store";
import { getModelById, getTierTextColor } from "@/lib/models";
import { Sparkles, User, Copy, Check } from "lucide-react";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const model = message.modelId ? getModelById(message.modelId) : null;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-end gap-2.5 flex-row-reverse">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#15b728,#22d63b)" }}>
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed whitespace-pre-wrap break-words"
            style={{ background: "linear-gradient(135deg,#e8f9ea 0%,#FFFFFF 100%)", border: "1px solid #d1f5d3", color: "#111827", boxShadow: "0 2px 12px rgba(21,183,40,0.10)" }}>
            {message.content}
          </div>
        </div>
        <span className="text-[11px] text-[#9CA3AF] mr-9">{time}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-end gap-2.5">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}>
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="group relative max-w-[80%] px-4 py-3 bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl rounded-tl-sm text-sm leading-relaxed text-[#111827] dark:text-[#F9FAFB] whitespace-pre-wrap break-words"
          style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.06)" }}>
          {message.content}
          <button onClick={handleCopy}
            className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center bg-white dark:bg-[#1A2235] border border-[#E5E7EB] dark:border-[#243042] rounded-lg shadow-sm"
            title="Copy">
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-[#9CA3AF]" />}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-9">
        <span className="text-[11px] text-[#9CA3AF]">{time}</span>
        {model && <span className={`text-[11px] font-medium ${getTierTextColor(model.tier)}`}>{model.label}</span>}
      </div>
    </div>
  );
}
