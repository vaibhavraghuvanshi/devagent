"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import LogoImage from "@/public/dev-agent-logo.svg";

type Mode = "signin" | "signup" | "forgot";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12Z"/>
  </svg>
);

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => { setName(""); setEmail(""); setPassword(""); setConfirm(""); setError(""); setSuccess(""); };
  const switchMode = (m: Mode) => { setMode(m); resetForm(); };

  const handleOAuth = async (provider: "github" | "google") => {
    setLoading(provider); setError("");
    try { await signIn(provider, { callbackUrl: "/" }); }
    catch { setError("Authentication failed."); setLoading(null); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Please enter your email address"); return; }
    setLoading("forgot"); setError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success — never reveal whether the email exists
      setSuccess("If an account with that email exists, we've sent a reset link. Check your inbox.");
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(null); }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading("credentials"); setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.ok) { window.location.href = "/"; }
    else { setError("Invalid email or password."); setLoading(null); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading("register"); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(null); return; }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.ok) { window.location.href = "/"; }
      else { setSuccess("Account created! Please sign in."); setTimeout(() => switchMode("signin"), 1500); }
    } catch { setError("Something went wrong."); setLoading(null); }
  };

  const busy = loading !== null;
  const inp = "w-full px-4 py-3 bg-white dark:bg-white/5 border border-[#E5E7EB] dark:border-[#243042] rounded-xl text-sm text-[#111827] dark:text-[#F9FAFB] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#15b728] focus:border-[#15b728] disabled:opacity-50 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8f9ea] dark:bg-[#0B1020] px-4 py-12 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-[#15b728]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#22d63b]/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px]">
        <div className="flex justify-center items-center flex-col text-center mb-8">
          <Image src={LogoImage} alt="Dev Agent Logo" className="w-20 h-20 mb-5" style={{ filter: "drop-shadow(0 0 28px rgba(109,93,246,0.45))" }} />
          <h1 className="text-[28px] font-bold text-[#111827] dark:text-[#F9FAFB] mb-2">
            Welcome to{" "}
            <span style={{ background: "linear-gradient(135deg,#15b728,#22d63b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
             Dev Agent
            </span>
          </h1>
          <p className="text-sm text-[#6B7280] dark:text-[#CBD5E1] leading-relaxed">
            Your intelligent assistant for<br />smarter work and better decisions.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-2xl p-8 border border-[#F1F5F9] dark:border-[#243042]"
          style={{ boxShadow: "0 8px 40px rgba(15,23,42,0.10)" }}>

          <div className="flex mb-7 border-b border-[#E5E7EB] dark:border-[#243042]">
            {(mode === "forgot" ? (["signin", "signup"] as Mode[]) : (["signin", "signup"] as Mode[])).map((m) => (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  mode === m
                    ? "border-[#15b728] text-[#15b728]"
                    : "border-transparent text-[#6B7280] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F9FAFB]"
                }`}>
                {m === "signin" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-300 text-sm">{success}</div>
          )}

          {/* ── Forgot password form ── */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {!success && (
                <>
                  <p className="text-sm text-[#6B7280] dark:text-[#94A3B8] mb-1">
                    Enter your email and we&apos;ll send you a link to reset your password.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5">Email address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" autoComplete="email" required disabled={busy} className={inp} />
                  </div>
                  <button type="submit" disabled={busy}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)", boxShadow: "0 4px 20px rgba(21,183,40,0.35)" }}>
                    {loading === "forgot" && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading === "forgot" ? "Sending…" : "Send reset link"}
                  </button>
                </>
              )}
              <button type="button" onClick={() => switchMode("signin")}
                className="w-full text-sm text-[#6B7280] dark:text-[#94A3B8] hover:text-[#15b728] transition-colors mt-1">
                ← Back to Log In
              </button>
            </form>
          )}

          {/* ── Sign-in / Sign-up forms + OAuth ── */}
          {mode !== "forgot" && (
            <>
              <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5">Full name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe" autoComplete="name" disabled={busy} className={inp} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5">Email address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" autoComplete="email" required disabled={busy} className={inp} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#374151] dark:text-[#CBD5E1]">Password</label>
                    {mode === "signin" && (
                      <button type="button" onClick={() => switchMode("forgot")}
                        className="text-xs text-[#15b728] hover:text-[#12a023] font-medium">Forgot password?</button>
                    )}
                  </div>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      required disabled={busy} className={inp + " pr-11"} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#15b728] transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {mode === "signup" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#374151] dark:text-[#CBD5E1] mb-1.5">Confirm password</label>
                    <div className="relative">
                      <input type={showConfirm ? "text" : "password"} value={confirm}
                        onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password"
                        autoComplete="new-password" required disabled={busy} className={inp + " pr-11"} />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#15b728] transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <button type="submit" disabled={busy}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)", boxShadow: "0 4px 20px rgba(21,183,40,0.35)" }}>
                  {(loading === "credentials" || loading === "register") && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === "signin" ? "Log In" : "Create Account"}
                </button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-[#243042]" />
                <span className="text-xs text-[#9CA3AF]">or continue with</span>
                <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-[#243042]" />
              </div>

              <div className="space-y-3">
                <button onClick={() => handleOAuth("google")} disabled={busy}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-white/5 border border-[#E5E7EB] dark:border-[#243042] rounded-xl text-sm font-medium text-[#111827] dark:text-[#F9FAFB] hover:bg-[#F7F8FC] dark:hover:bg-white/10 hover:border-[#15b728] transition-all disabled:opacity-50">
                  {loading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                  Google
                </button>
                <button onClick={() => handleOAuth("github")} disabled={busy}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-white/5 border border-[#E5E7EB] dark:border-[#243042] rounded-xl text-sm font-medium text-[#111827] dark:text-[#F9FAFB] hover:bg-[#F7F8FC] dark:hover:bg-white/10 hover:border-[#15b728] transition-all disabled:opacity-50">
                  {loading === "github" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitHubIcon />}
                  GitHub
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-sm text-[#6B7280] dark:text-[#94A3B8] mt-6">
          {mode === "signin" ? (
            <>Don&apos;t have an account?{" "}
              <button onClick={() => switchMode("signup")} className="text-[#15b728] font-semibold hover:text-[#12a023] transition-colors">Sign up</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => switchMode("signin")} className="text-[#15b728] font-semibold hover:text-[#12a023] transition-colors">Log in</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
