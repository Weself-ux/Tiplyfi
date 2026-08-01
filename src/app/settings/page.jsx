import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import useSession from "../../utils/useSession";

const CURRENCIES = [
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "NGN", label: "Nigerian Naira" },
  { code: "KES", label: "Kenyan Shilling" },
  { code: "GHS", label: "Ghanaian Cedi" },
  { code: "ZAR", label: "South African Rand" },
  { code: "INR", label: "Indian Rupee" },
  { code: "BRL", label: "Brazilian Real" },
  { code: "PHP", label: "Philippine Peso" },
  { code: "IDR", label: "Indonesian Rupiah" },
  { code: "CAD", label: "Canadian Dollar" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "sw", label: "Kiswahili" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "id", label: "Bahasa Indonesia" },
];

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 mb-4">
      <h2 className="text-base font-semibold text-[#111827] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ReadOnlyRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
      <span className="text-sm text-[#6B7280]">{label}</span>
      <span className="text-sm text-[#111827] font-medium">{value}</span>
    </div>
  );
}

function SoonRow({ label }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0">
      <span className="text-sm text-[#9CA3AF]">{label}</span>
      <span className="text-[10px] font-semibold text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded uppercase tracking-wider">
        Soon
      </span>
    </div>
  );
}

function FeeToggle() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["feeMode"],
    queryFn: async () => {
      const token = localStorage.getItem("tipjar_token");
      if (!token) return null;
      const res = await fetch("/api/user/fee-mode", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const fanPays = data?.feeMode === "fan_pays";

  async function toggle() {
    if (saving) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("tipjar_token");
      const res = await fetch("/api/user/fee-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feeMode: fanPays ? "creator_absorbs" : "fan_pays",
        }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["feeMode"] });
    } catch {
      alert("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex-1">
        <p className="text-sm font-medium text-[#111827] mb-0.5">
          Supporters cover the fee
        </p>
        <p className="text-sm text-[#6B7280]">
          {fanPays
            ? "Your supporters pay the fee on top of their tip, so you receive the full amount."
            : "The fee comes out of each tip."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        role="switch"
        aria-checked={fanPays}
        className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${
          fanPays ? "bg-[#7c3aed]" : "bg-[#E5E7EB]"
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
            fanPays ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function PreferenceSelect({ label, note, options, value, onChange, saving }) {
  return (
    <div className="mb-5 last:mb-0">
      <label className="block text-sm font-medium text-[#111827] mb-1">
        {label}
      </label>
      <p className="text-xs text-[#6B7280] mb-2">{note}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={saving}
        className="w-full px-3 py-2.5 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-xl outline-none focus:ring-2 focus:ring-[#7c3aed] disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading } = useSession();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: prefs } = useQuery({
    queryKey: ["preferences"],
    queryFn: async () => {
      const token = localStorage.getItem("tipjar_token");
      if (!token) return null;
      const res = await fetch("/api/user/preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  async function savePreference(patch) {
    setSaving(true);
    setSaved(false);
    try {
      const token = localStorage.getItem("tipjar_token");
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <Loader2 size={24} className="text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-inter">
      <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[720px] mx-auto px-6 flex items-center gap-3 h-14">
        <a            
            href="/dashboard"
            className="text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <ArrowLeft size={18} />
          </a>
          <span className="text-lg font-semibold text-[#111827] tracking-tight">
            Settings
          </span>
          {saved && (
            <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
              <Check size={13} /> Saved
            </span>
          )}
        </div>
      </nav>

      <div className="max-w-[720px] mx-auto px-6 py-8">
        <Section title="Account">
          <ReadOnlyRow label="Email" value={user.email} />
          <ReadOnlyRow label="Username" value={`@${user.username}`} />
          <ReadOnlyRow label="Member since" value={memberSince} />
          <SoonRow label="Change password" />
          <SoonRow label="Change email" />
          <SoonRow label="Delete account" />
        </Section>

        <Section title="Payments">
          <FeeToggle />
        </Section>

        <Section title="Preferences">
          <PreferenceSelect
            label="Currency"
            note="Choose how amounts are shown to you. Tips are always sent and held in USDC."
            options={CURRENCIES}
            value={prefs?.currency || "USD"}
            onChange={(v) => savePreference({ currency: v })}
            saving={saving}
          />
          <PreferenceSelect
            label="Language"
            note="Translations are rolling out soon. Your choice is saved now."
            options={LANGUAGES}
            value={prefs?.language || "en"}
            onChange={(v) => savePreference({ language: v })}
            saving={saving}
          />
        </Section>

        <Section title="Notifications">
          <SoonRow label="Email me about new tips" />
          <SoonRow label="Minimum amount for notifications" />
          <SoonRow label="Webhook URL" />
        </Section>

        <Section title="Security">
          <div className="flex items-center justify-between py-3 border-b border-[#F3F4F6]">
            <span className="text-sm text-[#6B7280]">Wallet key</span>
            <a
              href="/dashboard"
              className="text-sm text-[#7c3aed] font-medium hover:text-[#6d28d9]"
            >
              Manage in Wallet
            </a>
          </div>
          <SoonRow label="PIN and recovery" />
          <SoonRow label="Linked accounts" />
        </Section>

        <Section title="Integrations">
          <SoonRow label="Embedded tip widget" />
          <SoonRow label="Recurring tips" />
          <SoonRow label="Tip split" />
        </Section>
      </div>
    </div>
  );
}
