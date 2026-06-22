import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays, UtensilsCrossed, MessageSquare,
  LayoutDashboard, LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_GROUPS = [
  {
    label: "Management",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/reservations", label: "Reservations", icon: CalendarDays },
      { to: "/menu", label: "Menu Editor", icon: UtensilsCrossed },
      { to: "/enquiries", label: "Enquiries", icon: MessageSquare },
    ],
  },
];

function SidebarNavItem({ item, onClick }) {
  const location = useLocation();
  const active = location.pathname === item.to;
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 group ${
        active
          ? "bg-[var(--gold)] text-[var(--charcoal)]"
          : "text-[var(--muted)] hover:text-[var(--warm-white)] hover:bg-[var(--charcoal-mid)]"
      }`}
    >
      <Icon size={16} strokeWidth={1.75} className={active ? "" : "text-[var(--muted)] group-hover:text-[var(--gold)]"} />
      <span>{item.label}</span>
      {active && <ChevronRight size={13} className="ml-auto opacity-50" />}
    </Link>
  );
}

function useCurrentPage() {
  const location = useLocation();
  const map = { "/": "Dashboard", "/reservations": "Reservations", "/menu": "Menu Editor", "/enquiries": "Enquiries" };
  return map[location.pathname] ?? "Console";
}

export default function Layout({ children }) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageName = useCurrentPage();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const initial = session?.user?.email?.[0]?.toUpperCase() ?? "A";

  const SidebarContent = ({ onNav }) => (
    <>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[var(--border-soft)]">
        <div
          className="text-xl text-[var(--gold)] leading-none"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
        >
          BlackRock
        </div>
        <div className="text-[9px] uppercase tracking-[0.22em] text-[var(--muted)] mt-1.5">Admin Console</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]" style={{ opacity: 0.6 }}>
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarNavItem key={item.to} item={item} onClick={onNav} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--charcoal)" }}>

      {/* ── Sidebar — desktop ── */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-[var(--border-soft)]"
        style={{ background: "var(--surface)" }}
      >
        <SidebarContent onNav={undefined} />
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside
            className="relative w-64 flex flex-col border-r border-[var(--border-soft)]"
            style={{ background: "var(--surface)" }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span />
              <button onClick={() => setMobileOpen(false)} className="text-[var(--muted)]" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <SidebarContent onNav={() => setMobileOpen(false)} />
            <div className="px-4 py-4 border-t border-[var(--border-soft)]">
              <button onClick={handleSignOut} className="btn-ghost w-full justify-center text-xs">
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Right column: topbar + content ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 md:px-8 border-b border-[var(--border-soft)]"
          style={{ background: "var(--surface)", height: "56px" }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden mr-2 text-[var(--warm-white)]"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <span>/</span>
            <span className="text-[var(--warm-white)] font-medium">{pageName}</span>
          </div>

          {/* Admin */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-[var(--muted)] max-w-[180px] truncate">
              {session?.user?.email}
            </span>
            <div
              className="w-7 h-7 flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: "var(--gold)", color: "var(--charcoal)" }}
            >
              {initial}
            </div>
            <div className="h-4 w-px" style={{ background: "var(--border-soft)" }} />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--warm-white)] transition-colors duration-150"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
