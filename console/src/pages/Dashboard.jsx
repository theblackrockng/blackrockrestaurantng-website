import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, AlertCircle, LayoutGrid, MessageSquare,
} from "lucide-react";
import { supabase } from "../lib/supabase";

/* ─── Helpers ─── */
function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ─── Status pill ─── */
const STATUS_PILL = {
  confirmed:   { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" },
  pending:     { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" },
  cancelled:   { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
  rescheduled: { background: "#f5f3ff", color: "#5b21b6", border: "1px solid #ddd6fe" },
};

function StatusPill({ status }) {
  const s = STATUS_PILL[status] ?? { background: "var(--ds-input-bg)", color: "var(--ds-muted)", border: "1px solid var(--ds-border)" };
  return (
    <span style={{
      ...s,
      borderRadius: 99,
      fontSize: 10.5, fontWeight: 600,
      padding: "3px 9px",
      textTransform: "capitalize",
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, sub, iconEl, loading }) {
  return (
    <div style={{
      background: "var(--ds-surface)",
      border: "1px solid var(--ds-border)",
      borderRadius: 11,
      padding: "18px 20px 16px",
      boxShadow: "var(--ds-shadow)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{
          textTransform: "uppercase",
          fontSize: 10.5, fontWeight: 600,
          letterSpacing: "0.6px",
          color: "var(--ds-muted)",
          maxWidth: 100,
          lineHeight: 1.4,
        }}>
          {label}
        </span>
        {iconEl}
      </div>
      <div style={{
        fontSize: 36, fontWeight: 600,
        color: "var(--ds-text)",
        lineHeight: 1,
        marginBottom: 10,
        letterSpacing: "-1px",
        fontVariantNumeric: "tabular-nums",
      }}>
        {loading ? <span style={{ fontSize: 24, color: "var(--ds-muted)" }}>—</span> : (value ?? <span style={{ fontSize: 24, color: "var(--ds-muted)" }}>—</span>)}
      </div>
      <div style={{ fontSize: 12, color: "var(--ds-muted)" }}>{sub}</div>
    </div>
  );
}

/* ─── Reservation row ─── */
function ReservationRow({ r }) {
  const partyDisplay = r.party === "other" ? (r.party_other ?? "—") : (r.party ?? "—");
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "minmax(140px,1.9fr) 62px 72px 40px minmax(90px,1fr) 88px",
      padding: "12px 20px",
      borderBottom: "1px solid var(--ds-border)",
      alignItems: "center",
      gap: 0,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ds-input-bg)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {/* Guest */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "rgba(200,169,110,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 600, color: "var(--ds-gold)",
        }}>
          {initials(r.name)}
        </div>
        <span style={{
          fontSize: 13, fontWeight: 500, color: "var(--ds-text)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {r.name}
        </span>
      </div>

      {/* Date */}
      <div style={{ fontSize: 12.5, color: "var(--ds-muted)" }}>{fmtDate(r.date)}</div>

      {/* Time */}
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ds-text)" }}>{r.time || "—"}</div>

      {/* Pax */}
      <div style={{ fontSize: 12.5, color: "var(--ds-muted)", textAlign: "center" }}>{partyDisplay}</div>

      {/* Occasion */}
      <div style={{
        fontSize: 12, color: "var(--ds-muted)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {r.occasion || "—"}
      </div>

      {/* Status */}
      <div style={{ textAlign: "right" }}>
        <StatusPill status={r.status} />
      </div>
    </div>
  );
}

/* ─── Enquiry row ─── */
const ENQ_AVATAR = {
  new:       { background: "rgba(239,68,68,0.1)", color: "#ef4444" },
  read:      { background: "rgba(107,114,128,0.1)", color: "#6b7280" },
  responded: { background: "rgba(200,169,110,0.12)", color: "var(--ds-gold)" },
};

function EnquiryRow({ e }) {
  const av = ENQ_AVATAR[e.status] ?? ENQ_AVATAR.read;
  return (
    <div
      style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--ds-border)",
        cursor: "pointer",
      }}
      onMouseEnter={(el) => { el.currentTarget.style.background = "var(--ds-input-bg)"; }}
      onMouseLeave={(el) => { el.currentTarget.style.background = "transparent"; }}
    >
      {/* Row 1 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          ...av,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10.5, fontWeight: 600,
        }}>
          {initials(e.name)}
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ds-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {e.name}
        </span>
        <span style={{ fontSize: 11, color: "var(--ds-muted)", whiteSpace: "nowrap" }}>
          {timeAgo(e.created_at)}
        </span>
      </div>
      {/* Row 2 */}
      <div style={{
        marginLeft: 34,
        fontSize: 12, color: "var(--ds-muted)", lineHeight: 1.55,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      }}>
        {e.message}
      </div>
    </div>
  );
}

/* ─── Panel wrapper ─── */
function Panel({ children, style }) {
  return (
    <div style={{
      background: "var(--ds-surface)",
      border: "1px solid var(--ds-border)",
      borderRadius: 11,
      boxShadow: "var(--ds-shadow)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

function PanelHeader({ title, to, toLabel = "View all →" }) {
  return (
    <div style={{
      padding: "16px 20px 13px",
      borderBottom: "1px solid var(--ds-border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <h2 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 18, fontWeight: 600,
        color: "var(--ds-text)",
        letterSpacing: "0.2px",
        margin: 0,
      }}>
        {title}
      </h2>
      {to && (
        <Link to={to} style={{
          fontSize: 12, color: "var(--ds-gold)",
          fontWeight: 500, textDecoration: "none",
        }}>
          {toLabel}
        </Link>
      )}
    </div>
  );
}

/* ─── Dashboard ─── */
export default function Dashboard() {
  const [stats, setStats] = useState({ today: null, pending: null, total: null, enquiries: null });
  const [recentRes, setRecentRes] = useState([]);
  const [recentEnq, setRecentEnq] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const todayStr = new Date().toISOString().split("T")[0];
    const [r1, r2, r3, r4, r5, r6] = await Promise.all([
      supabase.from("reservations").select("id", { count: "exact", head: true }).eq("date", todayStr),
      supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("reservations").select("id", { count: "exact", head: true }),
      supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("reservations")
        .select("id,name,date,time,party,party_other,occasion,status")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("enquiries")
        .select("id,name,message,status,created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    setStats({ today: r1.count, pending: r2.count, total: r3.count, enquiries: r4.count });
    setRecentRes(r5.data ?? []);
    setRecentEnq(r6.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  /* Header date string */
  const now = new Date();
  const dayName = now.toLocaleDateString("en-GB", { weekday: "long" });
  const day = now.getDate();
  const month = now.toLocaleDateString("en-GB", { month: "long" });
  const year = now.getFullYear();
  const headerDate = `${dayName}, ${day} ${month} ${year}`;

  /* Current time for system info */
  const currentTime = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  /* Responsive breakpoint (inline JS for SSR-safe) */
  const isNarrow = typeof window !== "undefined" && window.innerWidth < 1150;

  return (
    <div style={{ padding: "24px 28px 40px", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Page header */}
      <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28, fontWeight: 600,
            letterSpacing: "0.3px",
            color: "var(--ds-text)",
            margin: "0 0 2px",
          }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 12.5, color: "var(--ds-muted)" }}>
            {headerDate}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 20,
      }}
        className="ds-stat-grid"
      >
        {/* Today's Reservations */}
        <StatCard
          label="Today's Reservations"
          value={stats.today}
          sub="scheduled for today"
          loading={loading}
          iconEl={
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "rgba(200,169,110,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--ds-gold)",
            }}>
              <Clock size={15} strokeWidth={1.75} />
            </div>
          }
        />

        {/* Pending Confirmation */}
        <StatCard
          label="Pending Confirmation"
          value={stats.pending}
          sub="awaiting confirmation"
          loading={loading}
          iconEl={
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "rgba(245,158,11,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#d97706",
            }}>
              <AlertCircle size={15} strokeWidth={1.75} />
            </div>
          }
        />

        {/* Total All Time */}
        <StatCard
          label="Total All Time"
          value={stats.total}
          sub="all time"
          loading={loading}
          iconEl={
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "rgba(107,114,128,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--ds-muted)",
            }}>
              <LayoutGrid size={15} strokeWidth={1.75} />
            </div>
          }
        />

        {/* Unread Enquiries */}
        <StatCard
          label="Unread Enquiries"
          value={stats.enquiries}
          sub="need attention"
          loading={loading}
          iconEl={
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "rgba(239,68,68,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#ef4444",
              position: "relative",
            }}>
              <MessageSquare size={15} strokeWidth={1.75} />
              {stats.enquiries > 0 && (
                <span style={{
                  position: "absolute", top: -2, right: -2,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#ef4444",
                  border: "1.5px solid var(--ds-surface)",
                }} />
              )}
            </div>
          }
        />
      </div>

      {/* Row 2: Recent Reservations + Recent Enquiries */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "3fr 2fr",
        gap: 16,
        marginBottom: 20,
      }}
        className="ds-row2-grid"
      >
        {/* Recent Reservations */}
        <Panel>
          <PanelHeader title="Recent Reservations" to="/reservations" />

          {/* Table head */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(140px,1.9fr) 62px 72px 40px minmax(90px,1fr) 88px",
            padding: "9px 20px",
            borderBottom: "1px solid var(--ds-border)",
          }}>
            {["GUEST", "DATE", "TIME", "PAX", "OCCASION", "STATUS"].map((col) => (
              <div key={col} style={{
                fontSize: 10.5, fontWeight: 600,
                color: "var(--ds-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                textAlign: col === "STATUS" ? "right" : col === "PAX" ? "center" : "left",
              }}>
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div style={{ overflowX: "auto" }}>
            {loading ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "40px 20px", color: "var(--ds-muted)", fontSize: 13,
                minHeight: 200,
              }}>
                Loading…
              </div>
            ) : recentRes.length === 0 ? (
              <div style={{
                padding: "40px 20px", textAlign: "center",
                color: "var(--ds-muted)", fontSize: 13,
              }}>
                No reservations yet.
              </div>
            ) : (
              recentRes.map((r) => <ReservationRow key={r.id} r={r} />)
            )}
          </div>
        </Panel>

        {/* Recent Enquiries */}
        <Panel>
          <PanelHeader title="Recent Enquiries" to="/enquiries" />
          {loading ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "40px 20px", color: "var(--ds-muted)", fontSize: 13,
              minHeight: 200,
            }}>
              Loading…
            </div>
          ) : recentEnq.length === 0 ? (
            <div style={{
              padding: "40px 20px", textAlign: "center",
              color: "var(--ds-muted)", fontSize: 13,
            }}>
              No enquiries yet.
            </div>
          ) : (
            recentEnq.map((e) => <EnquiryRow key={e.id} e={e} />)
          )}
        </Panel>
      </div>

      {/* Row 3: Quick Actions + System Info + Console note */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}
        className="ds-row3-grid"
      >
        {/* Quick Actions */}
        <Panel style={{ overflow: "visible" }}>
          <div style={{ padding: "18px 20px" }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18, fontWeight: 600,
              color: "var(--ds-text)",
              letterSpacing: "0.2px",
              margin: "0 0 14px",
            }}>
              Quick Actions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <Link
                to="/menu"
                style={{
                  display: "flex", alignItems: "center",
                  background: "var(--ds-burgundy)", color: "#fff",
                  borderRadius: 8, padding: "10px 14px",
                  fontSize: 13, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  textDecoration: "none",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                + Add Menu Item
              </Link>
              <Link
                to="/reservations"
                style={{
                  display: "flex", alignItems: "center",
                  background: "transparent", color: "var(--ds-text)",
                  border: "1px solid var(--ds-border)",
                  borderRadius: 8, padding: "10px 14px",
                  fontSize: 13, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ds-input-bg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                View All Reservations
              </Link>
              <Link
                to="/enquiries"
                style={{
                  display: "flex", alignItems: "center",
                  background: "transparent", color: "var(--ds-text)",
                  border: "1px solid var(--ds-border)",
                  borderRadius: 8, padding: "10px 14px",
                  fontSize: 13, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ds-input-bg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Read Enquiries
              </Link>
            </div>
          </div>
        </Panel>

        {/* System Info */}
        <Panel style={{ overflow: "visible" }}>
          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", height: "100%" }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18, fontWeight: 600,
              color: "var(--ds-text)",
              letterSpacing: "0.2px",
              margin: "0 0 12px",
            }}>
              System Info
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
              <p style={{ fontSize: 12.5, color: "var(--ds-muted)", lineHeight: 1.6 }}>
                Menu changes take effect on the public site immediately.
              </p>
              <p style={{ fontSize: 12.5, color: "var(--ds-muted)", lineHeight: 1.6 }}>
                Last checked: {currentTime}
              </p>
            </div>
            <div style={{ marginTop: 16 }}>
              <a
                href="https://blackrockrestaurantng.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, color: "var(--ds-gold)", textDecoration: "none" }}
              >
                blackrockrestaurantng.com →
              </a>
            </div>
          </div>
        </Panel>

        {/* Console note */}
        <Panel style={{ overflow: "visible" }}>
          <div style={{ padding: "18px 20px" }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18, fontWeight: 600,
              color: "var(--ds-text)",
              letterSpacing: "0.2px",
              margin: "0 0 12px",
            }}>
              Console
            </h2>
            <p style={{ fontSize: 12.5, color: "var(--ds-muted)", lineHeight: 1.6, marginBottom: 10 }}>
              This console manages live reservations, menu content, and guest enquiries for BLACKROCK.
              Access is restricted to authorised staff.
            </p>
            <p style={{ fontSize: 12, color: "var(--ds-muted)", lineHeight: 1.6 }}>
              Use the sun/moon icon in the topbar to toggle between light and dark mode.
            </p>
          </div>
        </Panel>
      </div>

      {/* Responsive grid styles */}
      <style>{`
        @media (max-width: 1149px) {
          .ds-stat-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .ds-row2-grid  { grid-template-columns: 1fr !important; }
          .ds-row3-grid  { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .ds-stat-grid  { grid-template-columns: 1fr !important; }
          .ds-row3-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
