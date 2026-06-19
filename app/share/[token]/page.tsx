import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Sparkles, User, Bot, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const shared = await db.sharedChat.findUnique({
    where: { shareToken: token },
    include: { chatSession: { select: { title: true } } },
  });
  const title = shared?.chatSession.title ?? "Shared Chat";
  return {
    title: `${title} — Dev Agent`,
    description: "A shared conversation from Dev Agent, your intelligent AI assistant.",
    openGraph: { title: `${title} — Dev Agent`, type: "website" },
  };
}

export default async function SharedChatPage({ params }: Props) {
  const { token } = await params;

  const shared = await db.sharedChat.findUnique({
    where: { shareToken: token },
    include: {
      chatSession: {
        select: {
          title: true,
          mode: true,
          createdAt: true,
          messages: {
            orderBy: { createdAt: "asc" },
            select: { id: true, role: true, content: true, modelId: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!shared) notFound();

  const { chatSession } = shared;
  const messages = chatSession.messages.map((m) => ({
    ...m,
    role: m.role === "USER" ? "user" : "assistant",
    createdAt: m.createdAt.toISOString(),
  }));
  const sharedDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(shared.createdAt);

  return (
    <div className="min-h-screen bg-[#f4f4f8] dark:bg-[#0B1020]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#243042]">
        <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">Dev Agent</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}
          >
            Try Dev Agent
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        {/* Chat meta */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e8f9ea] dark:bg-[#15b728]/10 text-[#15b728] border border-[#d1f5d3] dark:border-[#15b728]/20 uppercase tracking-wider">
              {chatSession.mode}
            </span>
            <span className="text-xs text-[#9CA3AF]">·</span>
            <span className="text-xs text-[#9CA3AF]">Shared {sharedDate}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB] mt-2">
            {chatSession.title}
          </h1>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#9CA3AF]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{messages.filter((m) => m.role !== "tool").length} messages</span>
          </div>
        </div>

        {/* Messages */}
        {messages.length === 0 ? (
          <div className="text-center py-16 text-[#9CA3AF]">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">This conversation has no messages.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "text-white"
                    : "bg-[#f4f4f8] dark:bg-[#1e293b] text-[#9CA3AF]"
                }`}
                  style={msg.role === "user" ? { background: "linear-gradient(135deg,#15b728,#22d63b)" } : {}}>
                  {msg.role === "user"
                    ? <User className="w-3.5 h-3.5" />
                    : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {msg.role === "assistant" && msg.modelId && (
                    <span className="text-[10px] text-[#9CA3AF] px-1 font-medium">{msg.modelId}</span>
                  )}
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "rounded-br-sm text-[#111827]"
                      : "rounded-tl-sm bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] text-[#111827] dark:text-[#F9FAFB] shadow-sm"
                  }`}
                    style={msg.role === "user"
                      ? { background: "linear-gradient(135deg,#e8f9ea 0%,#FFFFFF 100%)", border: "1px solid #d1f5d3" }
                      : {}}>
                    {msg.content}
                  </div>
                  <span className="text-[11px] text-[#9CA3AF] px-1">
                    {new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(msg.createdAt))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-[#E5E7EB] dark:border-[#243042] mt-12">
        <div className="max-w-3xl mx-auto px-5 py-8 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-base font-bold text-[#111827] dark:text-[#F9FAFB] mb-1">
            Start your own conversation
          </h3>
          <p className="text-sm text-[#9CA3AF] mb-4">
            Dev Agent is your intelligent assistant for smarter work and better decisions.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)", boxShadow: "0 4px 16px rgba(21,183,40,0.35)" }}
          >
            Open Dev Agent
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
