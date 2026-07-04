import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

function fmtTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-NG", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit", hour12: true,
      timeZone: "Africa/Lagos",
    });
  } catch { return iso; }
}

export default function FeatureControl() {
  const { session } = useAuth();
  const [flags, setFlags]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(null);
  const [message, setMessage]   = useState(null);

  useEffect(() => {
    supabase
      .from("feature_flags")
      .select("*")
      .order("label", { ascending: true })
      .then(({ data }) => {
        if (data) setFlags(data);
        setLoading(false);
      });
  }, []);

  async function toggle(flag) {
    if (updating) return;
    setUpdating(flag.flag_name);
    const newVal = !flag.enabled;
    const now    = new Date().toISOString();
    const email  = session?.user?.email ?? "unknown";

    const { error } = await supabase
      .from("feature_flags")
      .update({ enabled: newVal, updated_at: now, updated_by: email })
      .eq("flag_name", flag.flag_name);

    if (!error) {
      setFlags((prev) =>
        prev.map((f) =>
          f.flag_name === flag.flag_name
            ? { ...f, enabled: newVal, updated_at: now, updated_by: email }
            : f
        )
      );
      setMessage({
        flag_name: flag.flag_name,
        on: newVal,
        text: newVal
          ? "Ordering is now live on the website."
          : "Ordering is now disabled on the website.",
      });
      setTimeout(() => setMessage(null), 3000);
    }
    setUpdating(null);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#1a1a1a",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        background: "#faf8f5", borderRadius: 12, padding: 40,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>

        {/* Back */}
        <Link
          to="/"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9c8e7a", textDecoration: "none", marginBottom: 32, fontWeight: 500, transition: "color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#c8a96e"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#9c8e7a"; }}
        >
          <ArrowLeft size={13} /> Back to Console
        </Link>

        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, letterSpacing: "4px", color: "#c8a96e", textTransform: "uppercase" }}>
            BLACKROCK
          </div>
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 700, color: "#c8a96e", textAlign: "center", margin: "14px 0 6px" }}>
          Feature Control
        </h1>
        <p style={{ fontSize: 12.5, color: "#9c8e7a", textAlign: "center", margin: "0 0 32px", lineHeight: 1.6 }}>
          Changes take effect immediately across the website.
        </p>

        <div style={{ height: 1, background: "rgba(0,0,0,0.08)", marginBottom: 28 }} />

        {/* Flags */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#9c8e7a", fontSize: 13, padding: "24px 0" }}>
            Loading…
          </div>
        ) : flags.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9c8e7a", fontSize: 13, padding: "24px 0" }}>
            No feature flags found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {flags.map((flag, idx) => {
              const isUpdating = updating === flag.flag_name;
              const hasMsg     = message?.flag_name === flag.flag_name;
              const isLast     = idx === flags.length - 1;

              return (
                <div
                  key={flag.flag_name}
                  style={{ paddingBottom: 24, marginBottom: isLast ? 0 : 24, borderBottom: isLast ? "none" : "1px solid rgba(0,0,0,0.07)" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    {/* Label + description + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
                          {flag.label || flag.flag_name}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 600, color: flag.enabled ? "#16a34a" : "#9c8e7a" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: flag.enabled ? "#16a34a" : "#c0b8ae", display: "inline-block", flexShrink: 0 }} />
                          {flag.enabled ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {flag.description && (
                        <p style={{ fontSize: 12, color: "#9c8e7a", margin: "0 0 8px", lineHeight: 1.55 }}>
                          {flag.description}
                        </p>
                      )}

                      <div style={{ fontSize: 11, color: "#c0b8ae" }}>
                        Last updated: {fmtTime(flag.updated_at)}
                        {flag.updated_by ? ` · ${flag.updated_by}` : ""}
                      </div>
                    </div>

                    {/* Toggle switch */}
                    <button
                      onClick={() => toggle(flag)}
                      disabled={!!updating}
                      aria-label={`Toggle ${flag.label || flag.flag_name}`}
                      style={{
                        flexShrink: 0, width: 48, height: 26, borderRadius: 99,
                        border: "none", position: "relative",
                        background: flag.enabled ? "#c8a96e" : "#d0c8be",
                        cursor: updating ? "wait" : "pointer",
                        opacity: isUpdating ? 0.55 : 1,
                        transition: "background 0.25s ease, opacity 0.15s",
                        marginTop: 3,
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 3,
                        left: flag.enabled ? 25 : 3,
                        width: 20, height: 20, borderRadius: "50%",
                        background: "#fff",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
                        transition: "left 0.25s ease",
                      }} />
                    </button>
                  </div>

                  {/* Inline confirmation */}
                  {hasMsg && (
                    <div style={{
                      marginTop: 10, fontSize: 12, fontWeight: 500,
                      color: message.on ? "#16a34a" : "#7a1c1c",
                      animation: "br-fadein 0.2s ease",
                    }}>
                      {message.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes br-fadein {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
