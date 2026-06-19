"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LogoImage from "@/public/dev-agent-logo.svg";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router    = useRouter();

  const [tokenStatus, setTokenStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [showCf,      setShowCf]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [done,        setDone]        = useState(false);

  // Pre-validate the token before the user types anything
  useEffect(() => {
    if (!token) { setTokenStatus("invalid"); return; }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then((r) => r.json())
      .then((d: { valid: boolean }) => setTokenStatus(d.valid ? "valid" : "invalid"))
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full px-4 py-3 bg-white dark:bg-white/5 border border-[#E5E7EB] dark:border-[#243042] rounded-xl text-sm text-[#111827] dark:text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#15b728] focus:border-[#15b728] disabled:opacity-50 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8f9ea] dark:bg-[#0B1020] px-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#15b728]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#22d63b]/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <Image
            src={LogoImage}
            alt="Dev Agent"
            className="w-20 h-20 mb-5"
            style={{ filter: "drop-shadow(0 0 28px rgba(109,93,246,0.45))" }}
          />
          <h1 className="text-[26px] font-bold text-[#111827] dark:text-[#F9FAFB] mb-1">
            Reset Password
          </h1>
          <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1]">
            Choose a new password for your account
          </p>
        </div>

        <div
          className="bg-white dark:bg-[#111827] rounded-2xl p-8 border border-[#F1F5F9] dark:border-[#243042]"
          style={{ boxShadow: "0 8px 40px rgba(15,23,42,0.10)" }}
        >
          {/* Checking token */}
          {tokenStatus === "checking" && (
            <div className="flex flex-col items-center gap-3 py-6 text-[#9CA3AF]">
              <Loader2 className="w-6 h-6 animate-spin text-[#15b728]" />
              <p className="text-sm">Verifying reset link…</p>
            </div>
          )}

          {/* Token invalid / expired */}
          {tokenStatus === "invalid" && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#111827] dark:text-[#F9FAFB] mb-1">
                  Link invalid or expired
                </p>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                  This reset link has already been used or has expired (links are valid for 1 hour).
                </p>
              </div>
              <Link
                href="/login"
                className="mt-2 w-full py-3 rounded-xl text-sm font-semibold text-white text-center block"
                style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}
              >
                Request a new link
              </Link>
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[#15b728]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#111827] dark:text-[#F9FAFB] mb-1">
                  Password updated!
                </p>
                <p className="text-sm text-[#6B7280] dark:text-[#94A3B8]">
                  Redirecting you to the login page…
                </p>
              </div>
              <Loader2 className="w-5 h-5 animate-spin text-[#15b728]" />
            </div>
          )}

          {/* Reset form */}
          {tokenStatus === "valid" && !done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    className={inp + " pr-11"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#15b728] transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5">
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    type={showCf ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    required
                    disabled={loading}
                    className={inp + " pr-11"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCf((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#15b728] transition-colors"
                  >
                    {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)", boxShadow: "0 4px 20px rgba(21,183,40,0.35)" }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Updating…" : "Set new password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[#6B7280] dark:text-[#94A3B8] mt-6">
          Remember it?{" "}
          <Link href="/login" className="text-[#15b728] font-semibold hover:text-[#12a023] transition-colors">
            Back to Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
