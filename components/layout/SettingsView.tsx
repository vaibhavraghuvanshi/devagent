"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
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

const NAV: { id: SettingsSection; label: string; icon: React.ElementType }[] =
  [
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

/* ─── Shared card wrapper ─────────────────────────────────────────── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#243042] rounded-2xl p-6">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-[#111827] dark:text-[#F9FAFB] mb-5">
      {children}
    </h2>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-semibold text-[#6B7280] dark:text-[#94A3B8] uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#243042] bg-[#f4f4f8] dark:bg-[#0B1020] text-sm text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#15b728] transition-colors";

/* ─── Profile section ──────────────────────────────────────────────── */
function ProfileSection({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [name, setName]   = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [bio, setBio]     = useState("");
  const [lang, setLang]   = useState("English");
  const [tz, setTz]       = useState("(GMT+05:30) Asia/Kolkata");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <Card>
        <SectionTitle>Profile</SectionTitle>
        <p className="text-xs text-[#9CA3AF] -mt-3 mb-5">Manage your profile information</p>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#15b728,#22d63b)" }}
          >
            {name[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="text-xs text-[#6B7280] dark:text-[#94A3B8] mb-2">
              PNG, JPEG or GIF · Max size 3MB
            </p>
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
          <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
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
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg,#15b728 0%,#22d63b 100%)" }}
        >
          {saved ? "Saved ✓" : "Save Changes"}
        </button>
      </Card>

      {/* Danger Zone */}
      <Card>
        <h3 className="text-base font-bold text-red-500 mb-1">Danger Zone</h3>
        <p className="text-xs text-[#9CA3AF] mb-4">
          Permanently delete your account and all data.
        </p>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-800 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all">
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </Card>
    </div>
  );
}

/* ─── Placeholder section ──────────────────────────────────────────── */
function PlaceholderSection({ label }: { label: string }) {
  return (
    <Card>
      <SectionTitle>{label}</SectionTitle>
      <p className="text-sm text-[#9CA3AF]">
        {label} settings coming soon.
      </p>
    </Card>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────── */
export function SettingsView() {
  const { data: session } = useSession();
  const [active, setActive] = useState<SettingsSection>("profile");

  const userName  = session?.user?.name  ?? "User";
  const userEmail = session?.user?.email ?? "";

  return (
    <div className="flex-1 flex overflow-hidden bg-[#f4f4f8] dark:bg-[#0B1020]">
      {/* Settings sidebar */}
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

        {/* Sign out */}
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
          {active === "profile" ? (
            <ProfileSection userName={userName} userEmail={userEmail} />
          ) : (
            <PlaceholderSection label={NAV.find((n) => n.id === active)?.label ?? active} />
          )}
        </div>
      </div>
    </div>
  );
}
