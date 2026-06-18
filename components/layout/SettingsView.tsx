"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { MODELS as AVAILABLE_MODELS } from "@/lib/models";
import {
  User,
  Settings,
  Sliders,
  Palette,
  ShieldCheck,
  Plug,
  CreditCard,
  Lock,
  Bell,
  Wrench,
  Upload,
  ChevronRight,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  Check,
} from "lucide-react";

type SettingsSection =
  | "profile"
  | "account"
  | "preferences"
  | "appearance"
  | "data-privacy"
  | "integrations"
  | "billing"
  | "security"
  | "notifications"
  | "advanced";

const NAV: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: "profile",       label: "Profile",        icon: User },
  { id: "account",       label: "Account",        icon: Settings },
  { id: "preferences",   label: "Preferences",    icon: Sliders },
  { id: "appearance",    label: "Appearance",     icon: Palette },
  { id: "data-privacy",  label: "Data & Privacy", icon: ShieldCheck },
  { id: "integrations",  label: "Integrations",   icon: Plug },
  { id: "billing",       label: "Billing",        icon: CreditCard },
  { id: "security",      label: "Security",       icon: Lock },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "advanced",      label: "Advanced",       icon: Wrench },
];

/* ─── Shared primitives ────────────────────────────────────────────── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl p-6">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-[#111827] dark:text-[#F9FAFB] mb-5">{children}</h2>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-[#9CA3AF]">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#243042] bg-[#f4f4f8] dark:bg-[#0B1020] text-sm text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#15b728] transition-colors";

async function parseJsonResponse<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function SaveButton({ saved, loading, onClick }: { saved: boolean; loading?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
      style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}
    >
      {saved ? "Saved ✓" : loading ? "Saving…" : "Save Changes"}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-[#15b728]" : "bg-[#D1D5DB] dark:bg-[#374151]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[#E5E7EB] dark:border-[#243042] last:border-0">
      <div>
        <p className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">{label}</p>
        {hint && <p className="text-xs text-[#9CA3AF] mt-0.5">{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

/* ─── Profile ──────────────────────────────────────────────────────── */
function ProfileSection() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [lang, setLang] = useState("English");
  const [tz, setTz] = useState("(GMT+05:30) Asia/Kolkata");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => parseJsonResponse<{ name?: string; email?: string; bio?: string; language?: string; timezone?: string }>(res))
      .then((d) => {
        if (!d) return;
        setName(d.name ?? "");
        setEmail(d.email ?? "");
        setBio(d.bio ?? "");
        setLang(d.language ?? "English");
        setTz(d.timezone ?? "(GMT+05:30) Asia/Kolkata");
      })
      .catch((error) => console.error("Failed to load profile settings", error));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, language: lang, timezone: tz }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Profile</SectionTitle>
        <p className="text-xs text-[#9CA3AF] -mt-3 mb-5">Manage your public profile information</p>

        <div className="flex items-center gap-5 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#15b728,#22d63b)" }}
          >
            {(name || session?.user?.name || "U")[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mb-2">PNG, JPEG or GIF · Max 3MB</p>
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#243042] text-sm font-medium text-[#111827] dark:text-[#F9FAFB] hover:border-[#15b728] transition-all">
              <Upload className="w-3.5 h-3.5" />
              Upload new
            </button>
          </div>
        </div>

        <Field label="Full Name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className={inputCls} value={email} readOnly disabled />
        </Field>
        <Field label="Bio">
          <textarea
            className={inputCls + " resize-none"}
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a little about yourself…"
          />
        </Field>
        <Field label="Language">
          <select className={inputCls} value={lang} onChange={(e) => setLang(e.target.value)}>
            {["English", "Spanish", "French", "German", "Hindi", "Japanese"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Time Zone">
          <select className={inputCls} value={tz} onChange={(e) => setTz(e.target.value)}>
            {[
              "(GMT-08:00) Pacific Time",
              "(GMT-05:00) Eastern Time",
              "(GMT+00:00) UTC",
              "(GMT+01:00) London",
              "(GMT+05:30) Asia/Kolkata",
              "(GMT+08:00) Asia/Singapore",
              "(GMT+09:00) Asia/Tokyo",
            ].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>

        <SaveButton saved={saved} loading={saving} onClick={handleSave} />
      </Card>

      <Card>
        <h3 className="text-base font-bold text-red-500 mb-1">Danger Zone</h3>
        <p className="text-xs text-[#9CA3AF] mb-4">Permanently delete your account and all data.</p>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-800 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </Card>
    </div>
  );
}

/* ─── Account ──────────────────────────────────────────────────────── */
function AccountSection() {
  const [email, setEmail]               = useState("");
  const [hasPassword, setHasPassword]   = useState(false);
  const [verified, setVerified]         = useState(false);
  const [providers, setProviders]       = useState<string[]>([]);
  const [currentPw, setCurrentPw]       = useState("");
  const [newPw, setNewPw]               = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [emailSaved, setEmailSaved]     = useState(false);
  const [pwSaved, setPwSaved]           = useState(false);
  const [emailError, setEmailError]     = useState("");
  const [pwError, setPwError]           = useState("");
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    fetch("/api/user/account")
      .then((res) => parseJsonResponse<{ email?: string; hasPassword?: boolean; emailVerified?: boolean; connectedProviders?: string[] }>(res))
      .then((d) => {
        if (!d) return;
        setEmail(d.email ?? "");
        setHasPassword(d.hasPassword ?? false);
        setVerified(d.emailVerified ?? false);
        setProviders(d.connectedProviders ?? []);
      })
      .catch((error) => console.error("Failed to load account settings", error));
  }, []);

  const saveEmail = async () => {
    setEmailError("");
    setSaving(true);
    const res = await fetch("/api/user/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await parseJsonResponse<{ error?: string }>(res);
    setSaving(false);
    if (!res.ok) { setEmailError(data?.error ?? "Failed to update email"); return; }
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2000);
  };

  const savePassword = async () => {
    setPwError("");
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters"); return; }
    setSaving(true);
    const res = await fetch("/api/user/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await parseJsonResponse<{ error?: string }>(res);
    setSaving(false);
    if (!res.ok) { setPwError(data?.error ?? "Failed to update password"); return; }
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2000);
  };

  const PROVIDER_LABELS: Record<string, string> = { github: "GitHub", google: "Google" };

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Account</SectionTitle>
        <Field label="Email Address">
          <div className="flex gap-2">
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              onClick={saveEmail}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}
            >
              {emailSaved ? <Check className="w-4 h-4" /> : "Update"}
            </button>
          </div>
          {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}
          {verified && (
            <p className="mt-1 text-xs text-[#15b728] flex items-center gap-1">
              <Check className="w-3 h-3" /> Verified
            </p>
          )}
        </Field>
      </Card>

      {hasPassword && (
        <Card>
          <SectionTitle>Change Password</SectionTitle>
          <Field label="Current Password">
            <div className="relative">
              <input
                className={inputCls + " pr-10"}
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="New Password">
            <div className="relative">
              <input
                className={inputCls + " pr-10"}
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm New Password">
            <input
              className={inputCls}
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
            />
          </Field>
          {pwError && <p className="mb-3 text-xs text-red-500">{pwError}</p>}
          <SaveButton saved={pwSaved} loading={saving} onClick={savePassword} />
        </Card>
      )}

      {providers.length > 0 && (
        <Card>
          <SectionTitle>Connected Accounts</SectionTitle>
          <div className="space-y-3">
            {providers.map((p) => (
              <div
                key={p}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f4f4f8] dark:bg-[#0B1020] border border-[#E5E7EB] dark:border-[#243042]"
              >
                <span className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB]">
                  {PROVIDER_LABELS[p] ?? p}
                </span>
                <span className="text-xs font-semibold text-[#15b728] bg-[#e8f9ea] dark:bg-[#15b728]/10 px-2.5 py-1 rounded-full">
                  Connected
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ─── Preferences ──────────────────────────────────────────────────── */
function PreferencesSection() {
  const [model, setModel]       = useState(AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0]?.id ?? "");
  const [mode, setMode]         = useState("chat");
  const [enter, setEnter]       = useState(true);
  const [highlight, setHighlight] = useState(true);
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((res) => parseJsonResponse<{ defaultModel?: string; defaultMode?: string; sendOnEnter?: boolean; codeHighlighting?: boolean }>(res))
      .then((d) => {
        if (!d) return;
        const fallbackModelId = AVAILABLE_MODELS[1]?.id ?? AVAILABLE_MODELS[0]?.id ?? "";
        const isValidDefault = !!d.defaultModel && AVAILABLE_MODELS.some((m) => m.id === d.defaultModel);
        setModel(isValidDefault ? (d.defaultModel as string) : fallbackModelId);
        setMode(d.defaultMode ?? "chat");
        setEnter(d.sendOnEnter ?? true);
        setHighlight(d.codeHighlighting ?? true);
      })
      .catch((error) => console.error("Failed to load preferences settings", error));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultModel: model, defaultMode: mode, sendOnEnter: enter, codeHighlighting: highlight }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <SectionTitle>Preferences</SectionTitle>
      <p className="text-xs text-[#9CA3AF] -mt-3 mb-5">Customize how devAgent behaves for you</p>

      <Field label="Default AI Model">
        <select className={inputCls} value={model} onChange={(e) => setModel(e.target.value)}>
          {AVAILABLE_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </Field>

      <Field label="Default Chat Mode">
        <div className="flex gap-2">
          {(["chat", "agent"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                mode === m
                  ? "border-[#15b728] bg-[#e8f9ea] dark:bg-[#15b728]/10 text-[#15b728]"
                  : "border-[#E5E7EB] dark:border-[#243042] text-[#6B7280] dark:text-[#94A3B8] hover:border-[#15b728]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </Field>

      <div className="mb-5 rounded-xl border border-[#E5E7EB] dark:border-[#243042] px-4">
        <ToggleRow
          label="Send on Enter"
          hint="Press Enter to send; Shift+Enter for new line"
          checked={enter}
          onChange={setEnter}
        />
        <ToggleRow
          label="Code Syntax Highlighting"
          hint="Highlight code blocks in assistant responses"
          checked={highlight}
          onChange={setHighlight}
        />
      </div>

      <SaveButton saved={saved} loading={saving} onClick={handleSave} />
    </Card>
  );
}

/* ─── Appearance ───────────────────────────────────────────────────── */
type ThemeOption = "system" | "light" | "dark";

const THEME_OPTIONS: { id: ThemeOption; label: string; icon: React.ElementType; hint: string }[] = [
  { id: "system", label: "System",  icon: Monitor, hint: "Follows your OS setting" },
  { id: "light",  label: "Light",   icon: Sun,     hint: "Always light mode" },
  { id: "dark",   label: "Dark",    icon: Moon,    hint: "Always dark mode" },
];

function AppearanceSection() {
  const { setTheme } = useTheme();
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [local, setLocal]   = useState<ThemeOption>("system");

  useEffect(() => {
    fetch("/api/user/appearance")
      .then((res) => parseJsonResponse<{ theme?: string }>(res))
      .then((d) => {
        if (!d) return;
        const t = (d.theme ?? "system") as ThemeOption;
        setLocal(t);
      })
      .catch((error) => console.error("Failed to load appearance settings", error));
  }, []);

  const pick = useCallback((t: ThemeOption) => {
    setLocal(t);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/user/appearance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: local }),
    });
    if (!res.ok) {
      setSaving(false);
      return;
    }
    setTheme(local);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <SectionTitle>Appearance</SectionTitle>
      <p className="text-xs text-[#9CA3AF] -mt-3 mb-5">Choose how devAgent looks on your device</p>

      <Field label="Theme">
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map(({ id, label, icon: Icon, hint }) => (
            <button
              key={id}
              onClick={() => pick(id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                local === id
                  ? "border-[#15b728] bg-[#e8f9ea] dark:bg-[#15b728]/10"
                  : "border-[#E5E7EB] dark:border-[#243042] hover:border-[#15b728]/50"
              }`}
            >
              <Icon className={`w-6 h-6 ${local === id ? "text-[#15b728]" : "text-[#9CA3AF]"}`} />
              <span className={`text-sm font-semibold ${local === id ? "text-[#15b728]" : "text-[#111827] dark:text-[#F9FAFB]"}`}>
                {label}
              </span>
              <span className="text-xs text-[#9CA3AF] text-center">{hint}</span>
            </button>
          ))}
        </div>
      </Field>

      <SaveButton saved={saved} loading={saving} onClick={handleSave} />
    </Card>
  );
}

/* ─── Data & Privacy ───────────────────────────────────────────────── */
const RETENTION_OPTIONS = [
  { value: 30,  label: "30 days" },
  { value: 90,  label: "90 days" },
  { value: 180, label: "6 months" },
  { value: 365, label: "1 year" },
];

function DataPrivacySection() {
  const [saveHistory, setSaveHistory]   = useState(true);
  const [analytics, setAnalytics]       = useState(true);
  const [retention, setRetention]       = useState(90);
  const [saved, setSaved]               = useState(false);
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    fetch("/api/user/data-privacy")
      .then((res) => parseJsonResponse<{ saveHistory?: boolean; analyticsEnabled?: boolean; dataRetentionDays?: number }>(res))
      .then((d) => {
        if (!d) return;
        setSaveHistory(d.saveHistory ?? true);
        setAnalytics(d.analyticsEnabled ?? true);
        setRetention(d.dataRetentionDays ?? 90);
      })
      .catch((error) => console.error("Failed to load data privacy settings", error));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/user/data-privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saveHistory, analyticsEnabled: analytics, dataRetentionDays: retention }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Data & Privacy</SectionTitle>
        <p className="text-xs text-[#9CA3AF] -mt-3 mb-5">Control how your data is stored and used</p>

        <div className="rounded-xl border border-[#E5E7EB] dark:border-[#243042] px-4 mb-5">
          <ToggleRow
            label="Save Conversation History"
            hint="Store your chats so you can access them later"
            checked={saveHistory}
            onChange={setSaveHistory}
          />
          <ToggleRow
            label="Usage Analytics"
            hint="Help us improve devAgent with anonymous usage data"
            checked={analytics}
            onChange={setAnalytics}
          />
        </div>

        <Field
          label="Data Retention Period"
          hint="Conversations older than this will be automatically deleted"
        >
          <select
            className={inputCls}
            value={retention}
            onChange={(e) => setRetention(Number(e.target.value))}
          >
            {RETENTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        <SaveButton saved={saved} loading={saving} onClick={handleSave} />
      </Card>

      <Card>
        <h3 className="text-base font-bold text-[#111827] dark:text-[#F9FAFB] mb-1">Export Data</h3>
        <p className="text-xs text-[#9CA3AF] mb-4">Download a copy of all your conversations and account data.</p>
        <button className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#243042] text-sm font-semibold text-[#111827] dark:text-[#F9FAFB] hover:border-[#15b728] transition-all">
          Request Data Export
        </button>
      </Card>
    </div>
  );
}

/* ─── Placeholder ──────────────────────────────────────────────────── */
function PlaceholderSection({ label }: { label: string }) {
  return (
    <Card>
      <SectionTitle>{label}</SectionTitle>
      <p className="text-sm text-[#9CA3AF]">{label} settings coming soon.</p>
    </Card>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────── */
export function SettingsView() {
  const [active, setActive] = useState<SettingsSection>("profile");

  return (
    <div className="flex-1 flex overflow-hidden bg-[#f4f4f8] dark:bg-[#0B1020]">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 flex flex-col border-r border-[#E5E7EB] dark:border-[#243042] bg-white dark:bg-[#111827] overflow-y-auto">
        <div className="px-4 py-5 border-b border-[#E5E7EB] dark:border-[#243042]">
          <h1 className="text-base font-bold text-[#111827] dark:text-[#F9FAFB]">Settings</h1>
        </div>

        <nav className="flex-1 p-2">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active === id
                  ? "bg-[#e8f9ea] dark:bg-[#15b728]/10 text-[#15b728] font-semibold"
                  : "text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#f4f4f8] dark:hover:bg-white/5 hover:text-[#111827] dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {active === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[#E5E7EB] dark:border-[#243042]">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          {active === "profile"      && <ProfileSection />}
          {active === "account"      && <AccountSection />}
          {active === "preferences"  && <PreferencesSection />}
          {active === "appearance"   && <AppearanceSection />}
          {active === "data-privacy" && <DataPrivacySection />}
          {!["profile","account","preferences","appearance","data-privacy"].includes(active) && (
            <PlaceholderSection label={NAV.find((n) => n.id === active)?.label ?? active} />
          )}
        </div>
      </div>
    </div>
  );
}
