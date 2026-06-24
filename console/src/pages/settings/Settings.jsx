import { useState, useEffect, useLayoutEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  Store, Lock, Sun, Moon, Check, Loader, ChevronRight,
  MapPin, Phone, Mail, Globe, Clock,
} from "lucide-react";

/* ─── Section wrapper ─── */
function Section({ title, icon: Icon, children }) {
  return (
    <div style={{
      background: "var(--ds-surface)",
      border: "1px solid var(--ds-border)",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 20px",
        borderBottom: "1px solid var(--ds-border)",
        background: "var(--ds-sidebar)",
      }}>
        <Icon size={14} strokeWidth={1.75} style={{ color: "var(--ds-gold)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ds-text)" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "20px" }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Field row ─── */
function Field({ label, icon: Icon, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--ds-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--ds-muted)", fontSize: 12.5 }}>
        {Icon && <Icon size={13} strokeWidth={1.75} style={{ flexShrink: 0 }} />}
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 11px",
  background: "var(--ds-input-bg)",
  border: "1px solid var(--ds-border)",
  borderRadius: 7, fontSize: 13,
  color: "var(--ds-text)",
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
};

/* ─── Toast ─── */
function Toast({ msg, ok }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: ok ? "#166534" : "#991b1b", color: "#fff",
      padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
      boxShadow: "0 6px 24px rgba(0,0,0,0.18)", zIndex: 9998, whiteSpace: "nowrap",
    }}>
      {msg}
    </div>
  );
}

/* ─── Restaurant Info ─── */
function RestaurantSection({ toast }) {
  const [form, setForm] = useState({
    name: "BLACKROCK", tagline: "", address: "", phone: "", email: "", website: "", hours: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("restaurant_settings").select("*").eq("id", 1).maybeSingle()
      .then(({ data }) => {
        if (data) setForm(f => ({ ...f, ...data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("restaurant_settings").upsert({ id: 1, ...form });
    setSaving(false);
    toast(error ? "Failed to save: " + error.message : "Restaurant info saved", !error);
  }

  if (loading) return <div style={{ color: "var(--ds-muted)", fontSize: 13 }}>Loading…</div>;

  return (
    <>
      <div style={{ marginBottom: -1 }}>
        <Field label="Restaurant name" icon={Store}>
          <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Restaurant name" />
        </Field>
        <Field label="Tagline" icon={ChevronRight}>
          <input style={inputStyle} value={form.tagline} onChange={e => set("tagline", e.target.value)} placeholder="e.g. Where flavour meets fire" />
        </Field>
        <Field label="Address" icon={MapPin}>
          <input style={inputStyle} value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full street address" />
        </Field>
        <Field label="Phone" icon={Phone}>
          <input style={inputStyle} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+234 800 000 0000" />
        </Field>
        <Field label="Email" icon={Mail}>
          <input style={inputStyle} value={form.email} onChange={e => set("email", e.target.value)} placeholder="hello@yourrestaurant.com" type="email" />
        </Field>
        <Field label="Website" icon={Globe}>
          <input style={inputStyle} value={form.website} onChange={e => set("website", e.target.value)} placeholder="www.yourrestaurant.com" />
        </Field>
        <Field label="Opening hours" icon={Clock}>
          <input style={inputStyle} value={form.hours} onChange={e => set("hours", e.target.value)} placeholder="e.g. Mon–Sun 10AM – 12AM" />
        </Field>
      </div>
      <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 20px", borderRadius: 7, border: "none", cursor: saving ? "not-allowed" : "pointer",
            background: saving ? "var(--ds-border)" : "var(--ds-gold)", color: saving ? "var(--ds-muted)" : "#1a1008",
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            transition: "opacity 0.15s",
          }}
        >
          {saving ? <Loader size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Check size={13} />}
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </>
  );
}

/* ─── Security ─── */
function SecuritySection({ toast }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function changePassword() {
    if (!next || next !== confirm) { toast("Passwords do not match", false); return; }
    if (next.length < 8) { toast("Password must be at least 8 characters", false); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) { toast("Failed: " + error.message, false); return; }
    toast("Password updated successfully", true);
    setCurrent(""); setNext(""); setConfirm("");
  }

  const pw = { ...inputStyle, type: "password" };

  return (
    <>
      <div style={{ marginBottom: -1 }}>
        <Field label="New password" icon={Lock}>
          <input style={inputStyle} type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="At least 8 characters" />
        </Field>
        <Field label="Confirm password" icon={Lock}>
          <input style={inputStyle} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password" />
        </Field>
      </div>
      <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={changePassword}
          disabled={saving || !next || !confirm}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 20px", borderRadius: 7, border: "none",
            cursor: saving || !next || !confirm ? "not-allowed" : "pointer",
            background: saving || !next || !confirm ? "var(--ds-border)" : "var(--ds-gold)",
            color: saving || !next || !confirm ? "var(--ds-muted)" : "#1a1008",
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            opacity: !next || !confirm ? 0.5 : 1,
          }}
        >
          {saving ? <Loader size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Lock size={13} />}
          {saving ? "Updating…" : "Update password"}
        </button>
      </div>
    </>
  );
}

/* ─── Appearance ─── */
function AppearanceSection() {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("blackrock-theme") === "dark"; } catch { return false; }
  });

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  function toggle(val) {
    setIsDark(val);
    try { localStorage.setItem("blackrock-theme", val ? "dark" : "light"); } catch {}
  }

  const btn = (active, label, Icon) => (
    <button
      onClick={() => toggle(label === "Dark")}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 18px", borderRadius: 8,
        border: active ? "1.5px solid var(--ds-gold)" : "1.5px solid var(--ds-border)",
        background: active ? "rgba(200,169,110,0.1)" : "var(--ds-input-bg)",
        color: active ? "var(--ds-gold)" : "var(--ds-muted)",
        cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
        fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
      }}
    >
      <Icon size={15} strokeWidth={1.75} />
      {label}
      {active && <Check size={12} style={{ marginLeft: 2 }} />}
    </button>
  );

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--ds-muted)", marginBottom: 16 }}>
        Choose how the console looks. Your preference is saved to this browser.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        {btn(!isDark, "Light", Sun)}
        {btn(isDark,  "Dark",  Moon)}
      </div>
    </div>
  );
}

/* ─── Main export ─── */
export default function Settings() {
  const [toastMsg, setToastMsg] = useState(null);
  const [toastOk, setToastOk] = useState(true);

  function showToast(msg, ok) {
    setToastMsg(msg); setToastOk(ok);
    setTimeout(() => setToastMsg(null), 3500);
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 26, fontWeight: 700, color: "var(--ds-text)", marginBottom: 4,
        }}>Settings</h1>
        <p style={{ fontSize: 13, color: "var(--ds-muted)" }}>
          Manage your restaurant profile, security, and console preferences.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Section title="Restaurant Info" icon={Store}>
          <RestaurantSection toast={showToast} />
        </Section>

        <Section title="Security" icon={Lock}>
          <SecuritySection toast={showToast} />
        </Section>

        <Section title="Appearance" icon={Sun}>
          <AppearanceSection />
        </Section>
      </div>

      <Toast msg={toastMsg} ok={toastOk} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
