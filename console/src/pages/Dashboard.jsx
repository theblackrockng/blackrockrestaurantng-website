import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays, MessageSquare, Clock, LayoutDashboard,
  ArrowRight, RefreshCw, Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatCard({ icon: Icon, label, value, sub, to, accent = false }) {
  const Inner = (
    <div
      className="group flex flex-col justify-between hover:border-[var(--gold)] transition-colors duration-200"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border-soft)",
        padding: "20px 22px 18px",
        minHeight: "110px",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--muted)]">{label}</span>
        <div
          className="w-8 h-8 flex items-center justify-center shrink-0"
          style={{
            background: accent ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.08)",
            color: "var(--gold)",
          }}
        >
          <Icon size={15} strokeWidth={1.75} />
        </div>
      </div>
      <div>
        <div
          className="text-4xl font-light"
          style={{ color: "var(--warm-white)", lineHeight: 1, letterSpacing: "-0.01em" }}
        >
          {value ?? <span className="text-2xl text-[var(--muted)]">—</span>}
        </div>
        {sub && <div className="text-xs text-[var(--muted)] mt-1.5">{sub}</div>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{Inner}</Link> : Inner;
}

function ReservationRow({ r }) {
  const date = r.date
    ? new Date(r.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "—";
  const statusColors = {
    pending: "text-[var(--gold)] bg-[rgba(201,168,76,0.1)]",
    confirmed: "text-emerald-400 bg-emerald-400/10",
    cancelled: "text-red-400 bg-red-400/10",
    rescheduled: "text-violet-400 bg-violet-400/10",
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border-soft)] last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--warm-white)] truncate">{r.name}</div>
        <div className="text-xs text-[var(--muted)] mt-0.5">{date} · {r.time || "time TBC"} · {r.party} guests</div>
      </div>
      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 shrink-0 ${statusColors[r.status] ?? "text-[var(--muted)]"}`}>
        {r.status}
      </span>
    </div>
  );
}

function EnquiryRow({ e }) {
  const statusColors = {
    new: "text-[var(--gold)] bg-[rgba(201,168,76,0.1)]",
    read: "text-[var(--muted)] bg-[rgba(156,142,122,0.1)]",
    responded: "text-emerald-400 bg-emerald-400/10",
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--border-soft)] last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--warm-white)] truncate">{e.name}</div>
        <div className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">{e.message}</div>
      </div>
      <div className="text-right shrink-0">
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${statusColors[e.status] ?? ""}`}>
          {e.status}
        </span>
        <div className="text-[10px] text-[var(--muted)] mt-1">{timeAgo(e.created_at)}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ today: null, pending: null, total: null, enquiries: null });
  const [recentRes, setRecentRes] = useState([]);
  const [recentEnq, setRecentEnq] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const todayStr = new Date().toISOString().split("T")[0];
    const [r1, r2, r3, r4, r5, r6] = await Promise.all([
      supabase.from("reservations").select("id", { count: "exact" }).eq("date", todayStr),
      supabase.from("reservations").select("id", { count: "exact" }).eq("status", "pending"),
      supabase.from("reservations").select("id", { count: "exact" }),
      supabase.from("enquiries").select("id", { count: "exact" }).eq("status", "new"),
      supabase.from("reservations").select("id,name,date,time,party,status").order("created_at", { ascending: false }).limit(6),
      supabase.from("enquiries").select("id,name,message,status,created_at").order("created_at", { ascending: false }).limit(6),
    ]);
    setStats({ today: r1.count, pending: r2.count, total: r3.count, enquiries: r4.count });
    setRecentRes(r5.data ?? []);
    setRecentEnq(r6.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 md:p-8 max-w-6xl">

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-[var(--warm-white)]" style={{ letterSpacing: "-0.01em" }}>
            Dashboard
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">Welcome back. Here's your overview.</p>
        </div>
        <button
          onClick={load}
          className="btn-ghost flex items-center gap-2 text-xs mt-1"
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Clock}
          label="Today's Reservations"
          value={stats.today}
          sub="scheduled for today"
          to="/reservations"
          accent
        />
        <StatCard
          icon={CalendarDays}
          label="Pending Reservations"
          value={stats.pending}
          sub="awaiting confirmation"
          to="/reservations"
        />
        <StatCard
          icon={LayoutDashboard}
          label="Total Reservations"
          value={stats.total}
          sub="all time"
          to="/reservations"
        />
        <StatCard
          icon={MessageSquare}
          label="New Enquiries"
          value={stats.enquiries}
          sub="unread messages"
          to="/enquiries"
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Recent reservations — wider */}
        <div
          className="lg:col-span-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-soft)]">
            <div>
              <div className="text-sm font-medium text-[var(--warm-white)]">Recent Reservations</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">Latest guest bookings</div>
            </div>
            <Link
              to="/reservations"
              className="flex items-center gap-1 text-xs text-[var(--gold)] hover:opacity-75 transition-opacity"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="px-5">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-[var(--muted)]">
                <Loader2 size={16} className="animate-spin mr-2" /> Loading…
              </div>
            ) : recentRes.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--muted)]">No reservations yet.</div>
            ) : (
              recentRes.map((r) => <ReservationRow key={r.id} r={r} />)
            )}
          </div>
        </div>

        {/* Recent enquiries — narrower */}
        <div
          className="lg:col-span-2"
          style={{ background: "var(--surface)", border: "1px solid var(--border-soft)" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-soft)]">
            <div>
              <div className="text-sm font-medium text-[var(--warm-white)]">Recent Enquiries</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">Guest messages</div>
            </div>
            <Link
              to="/enquiries"
              className="flex items-center gap-1 text-xs text-[var(--gold)] hover:opacity-75 transition-opacity"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="px-5">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-[var(--muted)]">
                <Loader2 size={16} className="animate-spin mr-2" /> Loading…
              </div>
            ) : recentEnq.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--muted)]">No enquiries yet.</div>
            ) : (
              recentEnq.map((e) => <EnquiryRow key={e.id} e={e} />)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
