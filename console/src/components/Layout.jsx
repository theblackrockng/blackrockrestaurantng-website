import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid, CalendarDays, MessageSquare, UtensilsCrossed,
  Bell, Sun, Moon, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

/* ─── useTheme ─── */
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("blackrock-theme") === "dark"; }
    catch { return false; }
  });

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try { localStorage.setItem("blackrock-theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  }, []);

  return [isDark, toggleDark];
}

/* ─── Nav items ─── */
const NAV_ITEMS = [
  { to: "/",            label: "Dashboard",   icon: LayoutGrid },
  { to: "/reservations",label: "Reservations",icon: CalendarDays,   badge: "pending" },
  { to: "/enquiries",   label: "Enquiries",   icon: MessageSquare,  badge: "enquiries" },
  { to: "/menu",        label: "Menu",        icon: UtensilsCrossed },
];

/* ─── TopNavLink ─── */
function TopNavLink({ item, pathname, pendingCount, newEnqCount, onClick }) {
  const Icon = item.icon;
  const active = pathname === item.to;
  const badgeCount =
    item.badge === "pending"   ? pendingCount :
    item.badge === "enquiries" ? newEnqCount  : 0;
  const isAmber = item.badge === "pending";

  return (
    <Link
      to={item.to}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        color: active ? "var(--ds-gold)" : "var(--ds-muted)",
        background: active ? "var(--ds-nav-active)" : "transparent",
        textDecoration: "none",
        whiteSpace: "nowrap",
        position: "relative",
        flexShrink: 0,
        border: active ? "1px solid rgba(200,169,110,0.18)" : "1px solid transparent",
        transition: "background 0.12s, color 0.12s, border-color 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--ds-nav-active)";
          e.currentTarget.style.color = "var(--ds-text)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--ds-muted)";
        }
      }}
    >
      <Icon size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />
      <span>{item.label}</span>
      {badgeCount > 0 && (
        <span style={{
          fontSize: 9.5, fontWeight: 700, lineHeight: 1,
          background: isAmber ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
          color: isAmber ? "#d97706" : "#ef4444",
          padding: "2px 6px",
          borderRadius: 99,
        }}>
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      )}
    </Link>
  );
}

/* ─── Layout ─── */
export default function Layout({ children }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isDark, toggleDark] = useTheme();
  const [pendingCount, setPendingCount]   = useState(0);
  const [newEnqCount,  setNewEnqCount]    = useState(0);
  const [clock, setClock]                 = useState("");
  const [mobileOpen, setMobileOpen]       = useState(false);

  /* Admin info derived from session */
  const emailRaw    = session?.user?.email ?? "";
  const initials    = emailRaw.slice(0, 2).toUpperCase() || "BK";
  const displayName = emailRaw.split("@")[0] || "Admin";

  /* Fetch badge counts */
  useEffect(() => {
    async function fetchCounts() {
      const [r1, r2] = await Promise.all([
        supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
      ]);
      setPendingCount(r1.count ?? 0);
      setNewEnqCount(r2.count ?? 0);
    }
    fetchCounts();
  }, []);

  /* Live clock */
  useEffect(() => {
    function tick() {
      const now = new Date();
      setClock(now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr    = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const totalBadge = Math.min(99, pendingCount + newEnqCount);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  /* ── Icon button shared style ── */
  const iconBtn = {
    width: 32, height: 32,
    borderRadius: 7,
    background: "none", border: "none",
    cursor: "pointer",
    color: "var(--ds-muted)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--ds-bg)" }}>

      {/* ── Top Nav Bar ── */}
      <header style={{
        flexShrink: 0,
        height: 60,
        background: "var(--ds-surface)",
        borderBottom: "1px solid var(--ds-border)",
        display: "flex", alignItems: "center",
        padding: "0 20px",
        gap: 0,
        position: "sticky", top: 0, zIndex: 40,
      }}>

        {/* Brand */}
        <div style={{ display: "flex", flexDirection: "column", marginRight: 24, flexShrink: 0 }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 19, fontWeight: 700,
            letterSpacing: "3.5px",
            color: "var(--ds-gold)",
            textTransform: "uppercase",
            lineHeight: 1,
          }}>
            BLACKROCK
          </span>
          <span style={{
            fontSize: 9, fontWeight: 600,
            letterSpacing: "2.2px",
            color: "var(--ds-muted)",
            textTransform: "uppercase",
            marginTop: 4,
          }}>
            Admin Console
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 26, background: "var(--ds-border)", marginRight: 20, flexShrink: 0 }} />

        {/* Nav links — hidden on mobile */}
        <nav style={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }} className="ds-topnav">
          {NAV_ITEMS.map((item) => (
            <TopNavLink
              key={item.to}
              item={item}
              pathname={pathname}
              pendingCount={pendingCount}
              newEnqCount={newEnqCount}
            />
          ))}
        </nav>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", flexShrink: 0 }}>

          {/* Date & time — hide on narrow */}
          <div style={{ fontSize: 12, color: "var(--ds-muted)", whiteSpace: "nowrap", marginRight: 6 }} className="ds-datetime">
            {dateStr}
            <span style={{ margin: "0 4px", opacity: 0.4 }}>·</span>
            <span style={{ fontWeight: 500, color: "var(--ds-text)" }}>{clock}</span>
          </div>

          {/* Bell */}
          <button style={{ ...iconBtn, position: "relative" }} aria-label="Notifications">
            <Bell size={16} />
            {totalBadge > 0 && (
              <span style={{
                position: "absolute", top: 4, right: 4,
                width: 14, height: 14, borderRadius: "50%",
                background: "#ef4444",
                border: "1.5px solid var(--ds-surface)",
                fontSize: 8, fontWeight: 700, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {totalBadge > 99 ? "99" : totalBadge}
              </span>
            )}
          </button>

          {/* Dark mode */}
          <button
            onClick={toggleDark}
            style={iconBtn}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ds-gold)"; e.currentTarget.style.background = "var(--ds-input-bg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ds-muted)"; e.currentTarget.style.background = "none"; }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "var(--ds-border)", margin: "0 4px" }} />

          {/* Admin chip */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 10px 5px 6px",
            borderRadius: 8,
            border: "1px solid var(--ds-border)",
            background: "var(--ds-input-bg)",
            flexShrink: 0,
          }}>
            {/* Avatar */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "rgba(200,169,110,0.15)",
              border: "1.5px solid var(--ds-gold)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10.5, fontWeight: 600, color: "var(--ds-gold)",
              flexShrink: 0,
            }}>
              {initials}
            </div>
            {/* Name + role */}
            <div style={{ lineHeight: 1 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 500,
                color: "var(--ds-text)",
                whiteSpace: "nowrap",
                maxWidth: 120,
                overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {displayName}
              </div>
              <div style={{ fontSize: 10, color: "var(--ds-muted)", marginTop: 2, letterSpacing: "0.3px" }}>
                Administrator
              </div>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            style={iconBtn}
            title="Sign out"
            aria-label="Sign out"
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.07)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ds-muted)"; e.currentTarget.style.background = "none"; }}
          >
            <LogOut size={15} />
          </button>

          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileOpen(true)}
            style={{ ...iconBtn, display: "none" }}
            className="ds-hamburger"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside style={{
            position: "relative",
            width: 230,
            background: "var(--ds-surface)",
            borderRight: "1px solid var(--ds-border)",
            display: "flex", flexDirection: "column",
            padding: "16px 12px",
            gap: 4,
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingBottom: 12, borderBottom: "1px solid var(--ds-border)", marginBottom: 8,
            }}>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 16, fontWeight: 700,
                letterSpacing: "3px",
                color: "var(--ds-gold)",
                textTransform: "uppercase",
              }}>
                BLACKROCK
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ds-muted)", display: "flex" }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            {NAV_ITEMS.map((item) => (
              <TopNavLink
                key={item.to}
                item={item}
                pathname={pathname}
                pendingCount={pendingCount}
                newEnqCount={newEnqCount}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </aside>
        </div>
      )}

      {/* ── Page content ── */}
      <main style={{ flex: 1, overflowY: "auto", background: "var(--ds-bg)" }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 720px) {
          .ds-topnav   { display: none !important; }
          .ds-datetime { display: none !important; }
          .ds-hamburger { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
