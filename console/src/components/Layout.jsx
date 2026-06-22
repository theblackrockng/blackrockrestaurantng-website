import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, UtensilsCrossed, MessageSquare, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reservations", label: "Reservations", icon: CalendarDays },
  { to: "/menu", label: "Menu Editor", icon: UtensilsCrossed },
  { to: "/enquiries", label: "Enquiries", icon: MessageSquare },
];

function NavItem({ item, onClick }) {
  const location = useLocation();
  const active = location.pathname === item.to;
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 h-full text-xs font-medium uppercase tracking-[0.08em] transition-colors duration-150 whitespace-nowrap ${
        active
          ? "text-[var(--gold)]"
          : "text-[var(--muted)] hover:text-[var(--warm-white)]"
      }`}
    >
      <Icon size={14} strokeWidth={1.75} />
      <span>{item.label}</span>
      {active && (
        <span className="absolute inset-x-0 bottom-0 h-px" style={{ background: "var(--gold)" }} />
      )}
    </Link>
  );
}

export default function Layout({ children }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initial = session?.user?.email?.[0]?.toUpperCase() ?? "A";

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--charcoal)" }}>

      {/* ── Top navbar ── */}
      <header
        className="flex-shrink-0 flex items-center gap-6 px-6 md:px-8 border-b border-[var(--border-soft)]"
        style={{ background: "var(--surface)", height: "60px" }}
      >
        {/* Brand */}
        <div className="shrink-0 flex flex-col justify-center leading-none">
          <div
            className="text-[18px] text-[var(--gold)]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1 }}
          >
            BlackRock
          </div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-[var(--muted)] mt-1">Admin Console</div>
        </div>

        <div className="h-5 w-px shrink-0" style={{ background: "var(--border-soft)" }} />

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-stretch flex-1 h-full gap-0">
          {NAV.map((item) => <NavItem key={item.to} item={item} />)}
        </nav>

        {/* Admin info — desktop */}
        <div className="hidden md:flex items-center gap-4 shrink-0 ml-auto">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: "var(--gold)", color: "var(--charcoal)" }}
            >
              {initial}
            </div>
            <span className="text-xs text-[var(--muted)] max-w-[180px] truncate">
              {session?.user?.email}
            </span>
          </div>
          <div className="h-4 w-px" style={{ background: "var(--border-soft)" }} />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--warm-white)] transition-colors duration-150"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden ml-auto text-[var(--warm-white)] p-1"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside
            className="relative w-72 flex flex-col border-r border-[var(--border-soft)]"
            style={{ background: "var(--surface)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-soft)]">
              <div>
                <div
                  className="text-lg text-[var(--gold)]"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                >
                  BlackRock
                </div>
                <div className="text-[9px] uppercase tracking-[0.22em] text-[var(--muted)] mt-0.5">Admin Console</div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-[var(--muted)]" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 py-3">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-sm text-[var(--muted)] hover:text-[var(--warm-white)] transition-colors"
                  >
                    <Icon size={15} className="text-[var(--gold)]" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="px-5 py-4 border-t border-[var(--border-soft)]">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-7 h-7 flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{ background: "var(--gold)", color: "var(--charcoal)" }}
                >
                  {initial}
                </div>
                <span className="text-xs text-[var(--muted)] truncate">{session?.user?.email}</span>
              </div>
              <button onClick={handleSignOut} className="btn-ghost w-full justify-center text-xs">
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
