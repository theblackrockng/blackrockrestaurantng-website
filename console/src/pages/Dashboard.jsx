import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, UtensilsCrossed, MessageSquare, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";

const DAY = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function today() {
  const d = new Date();
  return `${DAY[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()]} ${d.getFullYear()}`;
}

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link
      to={to}
      className="console-card group hover:border-[var(--gold)] transition-colors duration-200"
      style={{ padding: "28px 28px 24px" }}
    >
      <div className="flex items-start justify-between mb-8">
        <span className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{label}</span>
        <Icon size={16} className="text-[var(--gold)] opacity-50 mt-0.5" />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-6xl font-light text-[var(--warm-white)]" style={{ lineHeight: 1 }}>
          {value ?? "—"}
        </span>
        <ArrowRight
          size={15}
          className="text-[var(--muted)] group-hover:text-[var(--gold)] transition-colors duration-150 mb-1"
        />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ pending: null, total: null, enquiries: null });

  useEffect(() => {
    async function load() {
      const [r1, r2, r3] = await Promise.all([
        supabase.from("reservations").select("id", { count: "exact" }).eq("status", "pending"),
        supabase.from("reservations").select("id", { count: "exact" }),
        supabase.from("enquiries").select("id", { count: "exact" }).eq("status", "new"),
      ]);
      setStats({ pending: r1.count, total: r2.count, enquiries: r3.count });
    }
    load();
  }, []);

  return (
    <div className="p-8 md:p-12 max-w-5xl">

      {/* Header */}
      <div className="mb-12 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] mb-2">Overview</div>
          <h1 className="text-3xl font-light text-[var(--warm-white)]" style={{ letterSpacing: "-0.01em" }}>
            Dashboard
          </h1>
        </div>
        <div className="text-xs text-[var(--muted)] pb-1">{today()}</div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px mb-px" style={{ background: "var(--border-soft)" }}>
        <StatCard icon={CalendarDays} label="Pending Reservations" value={stats.pending} to="/reservations" />
        <StatCard icon={CalendarDays} label="Total Reservations" value={stats.total} to="/reservations" />
        <StatCard icon={MessageSquare} label="New Enquiries" value={stats.enquiries} to="/enquiries" />
      </div>

      {/* Bottom strip */}
      <div
        className="flex items-center justify-between"
        style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderTop: "none", padding: "16px 28px" }}
      >
        <p className="text-xs text-[var(--muted)] leading-relaxed max-w-lg">
          Live reservations, guest enquiries, and menu content are all managed here. Menu changes take effect on the public site immediately.
        </p>
        <Link
          to="/reservations"
          className="text-xs uppercase tracking-[0.1em] text-[var(--gold)] hover:opacity-75 transition-opacity shrink-0 ml-8 flex items-center gap-2"
        >
          View Reservations <ArrowRight size={11} />
        </Link>
      </div>

      {/* Section links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
        {[
          { to: "/reservations", label: "Reservations", sub: "Manage guest bookings", icon: CalendarDays },
          { to: "/menu", label: "Menu Editor", sub: "Update dishes and pricing", icon: UtensilsCrossed },
          { to: "/enquiries", label: "Enquiries", sub: "Respond to guest messages", icon: MessageSquare },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group flex items-center gap-4 hover:border-[var(--gold)] transition-colors duration-200"
            style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", padding: "18px 20px" }}
          >
            <item.icon size={18} className="text-[var(--gold)] opacity-60 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--warm-white)] group-hover:text-[var(--gold)] transition-colors duration-150">
                {item.label}
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5">{item.sub}</div>
            </div>
            <ArrowRight size={13} className="ml-auto text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0" />
          </Link>
        ))}
      </div>

    </div>
  );
}
