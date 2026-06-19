"use client";

import { useState, useEffect, useCallback } from "react";
import { useChatStore } from "@/lib/store";
import {
  X, Link2, Check, Copy, Trash2, Globe, Loader2, Share2, RefreshCw,
} from "lucide-react";

interface ShareState {
  shareToken: string | null;
  createdAt: string | null;
}

interface Props {
  sessionId: string;
  onClose: () => void;
}

export function ShareModal({ sessionId, onClose }: Props) {
  const { sessions } = useChatStore();
  const chatSession = sessions.find((s) => s.id === sessionId);

  const [shareState, setShareState] = useState<ShareState | null>(null); // null = loading
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const shareUrl =
    typeof window !== "undefined" && shareState?.shareToken
      ? `${window.location.origin}/share/${shareState.shareToken}`
      : null;

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/share`);
      const data = (await res.json()) as { shareToken?: string | null; createdAt?: string | null; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to load share status"); return; }
      setShareState({ shareToken: data.shareToken ?? null, createdAt: data.createdAt ?? null });
    } catch {
      setError("Network error. Please try again.");
    }
  }, [sessionId]);

  useEffect(() => { void load(); }, [load]);

  const createShare = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/share`, { method: "POST" });
      const data = (await res.json()) as { shareToken?: string; createdAt?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to create share link"); return; }
      setShareState({ shareToken: data.shareToken ?? null, createdAt: data.createdAt ?? null });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/share`, { method: "DELETE" });
      if (!res.ok) { setError("Failed to revoke share link"); return; }
      setShareState({ shareToken: null, createdAt: null });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const refreshShare = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/share`, { method: "POST" });
      const data = (await res.json()) as { shareToken?: string; createdAt?: string; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to refresh link"); return; }
      setShareState({ shareToken: data.shareToken ?? null, createdAt: data.createdAt ?? null });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl p-6 w-full max-w-[420px] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}
            >
              <Share2 className="w-4.5 h-4.5 text-white" style={{ width: "18px", height: "18px" }} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-[#F9FAFB]">Share Chat</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5 max-w-[230px] truncate">
                {chatSession?.title || "Untitled"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f4f4f8] dark:hover:bg-white/5 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Content */}
        {shareState === null ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#15b728]" />
          </div>
        ) : shareState.shareToken ? (
          <>
            {/* Active share status */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#e8f9ea] dark:bg-[#15b728]/10 border border-[#d1f5d3] dark:border-[#15b728]/20 mb-4">
              <Globe className="w-3.5 h-3.5 text-[#15b728] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#15b728]">Public link active</p>
                <p className="text-[11px] text-[#15b728]/70 mt-0.5">
                  Anyone with this link can view — no login required
                </p>
              </div>
            </div>

            {/* URL row */}
            <div className="flex gap-2 mb-1">
              <input
                readOnly
                value={shareUrl!}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#243042] bg-[#f4f4f8] dark:bg-[#0B1020] text-xs text-[#6B7280] dark:text-[#94A3B8] focus:outline-none focus:border-[#15b728] transition-colors cursor-text"
              />
              <button
                onClick={copyToClipboard}
                title={copied ? "Copied!" : "Copy link"}
                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-[#E5E7EB] dark:border-[#243042] hover:border-[#15b728] hover:bg-[#e8f9ea] dark:hover:bg-[#15b728]/10 transition-all"
              >
                {copied
                  ? <Check className="w-4 h-4 text-[#15b728]" />
                  : <Copy className="w-4 h-4 text-[#9CA3AF]" />}
              </button>
            </div>

            {/* Copy feedback */}
            <p className={`text-[11px] text-[#15b728] mb-4 h-4 transition-opacity ${copied ? "opacity-100" : "opacity-0"}`}>
              ✓ Link copied to clipboard
            </p>

            {/* Actions row */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-[#9CA3AF]">
                Created{" "}
                {shareState.createdAt
                  ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(shareState.createdAt))
                  : "just now"}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={refreshShare}
                  disabled={loading}
                  title="Generate new link (invalidates old)"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-[#f4f4f8] dark:hover:bg-white/5 transition-all disabled:opacity-40"
                >
                  {loading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />}
                  Reset
                </button>
                <button
                  onClick={revokeShare}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900 transition-all disabled:opacity-40"
                >
                  {loading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                  Revoke link
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* No share yet */}
            <div className="text-center py-5 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-[#f4f4f8] dark:bg-white/5 flex items-center justify-center mx-auto mb-3 border border-[#E5E7EB] dark:border-[#243042]">
                <Link2 className="w-7 h-7 text-[#9CA3AF]" />
              </div>
              <p className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] mb-1.5">
                Share this conversation
              </p>
              <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-[280px] mx-auto">
                Create a public read-only link so anyone can view this chat — no account needed.
              </p>
            </div>

            <button
              onClick={createShare}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Link2 className="w-4 h-4" />}
              {loading ? "Creating link…" : "Create share link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
