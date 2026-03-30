"use client";

import { useState, useEffect, useCallback } from "react";
import { property } from "@/config/property";
import { formatUSD } from "@/lib/pricing";
import type { Booking, BookingEvent, BlockedDate, BookingStatus } from "@/lib/db";
import type { VrboEvent } from "@/app/api/admin/vrbo-feed/route";

// ── Auth ────────────────────────────────────────────────────────────────────

function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const adminPw = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin123";
  const submit = () => {
    if (pw === adminPw) { onAuth(); setErr(false); }
    else setErr(true);
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Admin</h1>
        <p className="text-slate-500 text-sm mb-6">Observation Point management</p>
        <div className="space-y-3">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()} placeholder="Password"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
          {err && <p className="text-red-500 text-sm">Incorrect password.</p>}
          <button onClick={submit} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2 rounded-full transition-colors">Sign In</button>
        </div>
      </div>
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-sky-100 text-sky-800",
  denied: "bg-red-100 text-red-700",
  deposit_paid: "bg-blue-100 text-blue-800",
  balance_due: "bg-orange-100 text-orange-800",
  paid_in_full: "bg-green-100 text-green-800",
  cancelled: "bg-slate-100 text-slate-500",
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const label = status.replace("_", " ");
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[status]}`}>
      {label}
    </span>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

type BookingWithEvents = Booking & { events: BookingEvent[] };

interface SeasonalRate {
  label: string;
  start: string;
  end: string;
  nightly: number;
  weekly: number;
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────

function DashboardTab({ bookings, vrboEvents }: { bookings: BookingWithEvents[]; vrboEvents: VrboEvent[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yearStart = new Date(today.getFullYear(), 0, 1);

  const paid = bookings.filter(b => b.status === "paid_in_full" || b.status === "deposit_paid" || b.status === "balance_due");
  const ytdRevenue = paid
    .filter(b => new Date(b.check_in) >= yearStart)
    .reduce((sum, b) => sum + b.total_price / 100, 0);

  const confirmed = bookings.filter(b =>
    ["confirmed", "deposit_paid", "balance_due", "paid_in_full"].includes(b.status)
  );
  const confirmedNights = confirmed.reduce((sum, b) => {
    const ci = new Date(b.check_in + "T12:00:00");
    const co = new Date(b.check_out + "T12:00:00");
    if (ci >= yearStart && ci <= new Date(today.getFullYear(), 11, 31)) {
      return sum + Math.round((co.getTime() - ci.getTime()) / 86400000);
    }
    return sum;
  }, 0);
  const occupancy = Math.round((confirmedNights / 365) * 100);

  const upcoming = [
    ...confirmed
      .filter(b => new Date(b.check_in + "T12:00:00") >= today)
      .map(b => ({ date: b.check_in, label: `${b.guest_name} (${b.num_guests} guests)`, source: "Website", status: b.status })),
    ...vrboEvents
      .filter(e => e.start >= today.toISOString().split("T")[0])
      .map(e => ({ date: e.start, label: e.summary, source: "VRBO", status: null })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);

  const pending = bookings.filter(b => b.status === "pending").length;
  const nextArrival = upcoming[0];

  const cards = [
    { label: "YTD Revenue", value: formatUSD(ytdRevenue), sub: `${today.getFullYear()}` },
    { label: "Occupancy", value: `${occupancy}%`, sub: `${confirmedNights} nights confirmed` },
    { label: "Pending Requests", value: String(pending), sub: pending === 1 ? "needs review" : "need review" },
    { label: "Next Arrival", value: nextArrival ? new Date(nextArrival.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—", sub: nextArrival?.label ?? "None scheduled" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-sky-600">{c.value}</div>
            <div className="text-slate-800 font-semibold text-sm mt-1">{c.label}</div>
            <div className="text-slate-400 text-xs mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Upcoming Arrivals</h2>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-6 py-8 text-slate-400 text-sm">No upcoming arrivals.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {upcoming.map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-3">
                <div className="text-sm font-semibold text-slate-700 w-24 shrink-0">
                  {new Date(item.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                <div className="text-sm text-slate-600 flex-1">{item.label}</div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.source === "VRBO" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"}`}>
                  {item.source}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bookings Tab ──────────────────────────────────────────────────────────────

const STATUS_FILTERS: Array<BookingStatus | "all"> = ["all", "pending", "confirmed", "deposit_paid", "balance_due", "paid_in_full", "denied", "cancelled"];

function BookingsTab({ bookings, onRefresh }: { bookings: BookingWithEvents[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [acting, setActing] = useState<Record<string, boolean>>({});

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const saveNotes = async (id: string) => {
    setSaving(p => ({ ...p, [id]: true }));
    await fetch(`/api/booking/${id}/notes`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes[id] }),
    });
    setSaving(p => ({ ...p, [id]: false }));
  };

  const act = async (bookingId: string, action: "confirm" | "deny") => {
    setActing(p => ({ ...p, [bookingId]: true }));
    await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, bookingId }),
    });
    setActing(p => ({ ...p, [bookingId]: false }));
    onRefresh();
  };

  const ACTOR_LABELS: Record<string, string> = {
    guest: "Guest",
    owner: "Owner",
    stripe: "Stripe",
    cron: "System",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${filter === s ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <a href="/api/admin/export" className="text-sm font-semibold text-sky-600 hover:text-sky-500">
          Export CSV ↓
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-6 py-10 text-slate-400 text-sm text-center">No bookings found.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(b => {
              const isExpanded = expanded === b.id;
              const noteVal = notes[b.id] ?? b.notes ?? "";
              return (
                <div key={b.id}>
                  {/* Row */}
                  <div
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : b.id)}
                  >
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{b.guest_name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        {new Date(b.check_in + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                        {new Date(b.check_out + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}{b.num_guests} guests
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700 text-right">{formatUSD(b.total_price / 100)}</div>
                    <StatusBadge status={b.status} />
                    {b.status === "pending" && (
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button disabled={acting[b.id]} onClick={() => act(b.id, "confirm")}
                          className="text-xs font-semibold px-3 py-1 bg-green-500 hover:bg-green-400 text-white rounded-full disabled:opacity-50 transition-colors">
                          Confirm
                        </button>
                        <button disabled={acting[b.id]} onClick={() => act(b.id, "deny")}
                          className="text-xs font-semibold px-3 py-1 bg-red-500 hover:bg-red-400 text-white rounded-full disabled:opacity-50 transition-colors">
                          Deny
                        </button>
                      </div>
                    )}
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Guest info */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-3">Guest Details</h3>
                        <table className="text-sm w-full">
                          {[
                            ["Email", b.guest_email],
                            ["Phone", b.guest_phone ?? "—"],
                            ["Guests", String(b.num_guests)],
                            ["Submitted", new Date(b.created_at).toLocaleDateString()],
                          ].map(([label, val]) => (
                            <tr key={label}>
                              <td className="text-slate-500 py-1 pr-4 w-24">{label}</td>
                              <td className="text-slate-800 font-medium py-1">{val}</td>
                            </tr>
                          ))}
                        </table>

                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-5 mb-2">Internal Notes</h3>
                        <textarea
                          value={noteVal}
                          onChange={e => setNotes(p => ({ ...p, [b.id]: e.target.value }))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
                          rows={3}
                          placeholder="Private notes (not visible to guest)"
                        />
                        <button onClick={() => saveNotes(b.id)} disabled={saving[b.id]}
                          className="mt-2 text-xs font-semibold text-sky-600 hover:text-sky-500 disabled:opacity-50">
                          {saving[b.id] ? "Saving…" : "Save Notes"}
                        </button>
                      </div>

                      {/* Status timeline */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-3">Status Timeline</h3>
                        {b.events.length === 0 ? (
                          <p className="text-slate-400 text-sm">No events recorded.</p>
                        ) : (
                          <ol className="space-y-3">
                            {b.events.map(ev => (
                              <li key={ev.id} className="flex gap-3 text-sm">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                                  <div className="w-px flex-1 bg-slate-200 my-1" />
                                </div>
                                <div className="pb-1">
                                  <div className="font-medium text-slate-700 capitalize">
                                    {ev.from_status ? `${ev.from_status.replace("_", " ")} → ` : ""}{ev.to_status.replace("_", " ")}
                                  </div>
                                  <div className="text-slate-400 text-xs">
                                    {ACTOR_LABELS[ev.actor] ?? ev.actor} · {new Date(ev.created_at).toLocaleString()}
                                  </div>
                                  {ev.note && <div className="text-slate-400 text-xs font-mono mt-0.5">{ev.note.slice(0, 40)}</div>}
                                </div>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pricing Tab ───────────────────────────────────────────────────────────────

function getSaturdays(count: number): Date[] {
  const result: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  for (let i = 0; i < count; i++) {
    result.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return result;
}

function PricingTab() {
  const [seasonal, setSeasonal] = useState<SeasonalRate[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const saturdays = getSaturdays(52);

  useEffect(() => {
    fetch("/api/admin/prices?type=seasonal").then(r => r.json()).then(setSeasonal);
    fetch("/api/admin/prices").then(r => r.json()).then((data: Record<string, number>) => {
      const s: Record<string, string> = {};
      for (const [k, v] of Object.entries(data)) s[k] = String(v);
      setOverrides(s);
    });
  }, []);

  const getSeasonForDate = (d: Date) => {
    const mmdd = d.toISOString().split("T")[0].slice(5);
    return seasonal.find(s => mmdd >= s.start && mmdd < s.end) ?? seasonal[seasonal.length - 1];
  };

  const save = async () => {
    setSaving(true); setMsg(null);
    const weeklyPayload: Record<string, number> = {};
    for (const [k, v] of Object.entries(overrides)) {
      const n = parseFloat(v);
      if (!isNaN(n) && n > 0) weeklyPayload[k] = n;
    }
    const [r1, r2] = await Promise.all([
      fetch("/api/admin/prices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(weeklyPayload) }),
      fetch("/api/admin/prices?type=seasonal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(seasonal) }),
    ]);
    setSaving(false);
    setMsg(r1.ok && r2.ok ? "Saved!" : "Error saving.");
  };

  return (
    <div className="space-y-8">
      {/* Seasonal rates */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Seasonal Rates</h2>
          <p className="text-xs text-slate-400">Changes apply to new server-side calculations immediately</p>
        </div>
        <div className="grid grid-cols-5 bg-slate-50 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Season</span><span>Start (MM-DD)</span><span>End (MM-DD)</span><span>Nightly</span><span>Weekly</span>
        </div>
        {seasonal.map((s, i) => (
          <div key={i} className="grid grid-cols-5 px-6 py-3 border-b border-slate-50 last:border-0 items-center">
            <input value={s.label} onChange={e => setSeasonal(prev => prev.map((r, j) => j === i ? { ...r, label: e.target.value } : r))}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-sky-300" />
            <input value={s.start} onChange={e => setSeasonal(prev => prev.map((r, j) => j === i ? { ...r, start: e.target.value } : r))}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-sky-300" />
            <input value={s.end} onChange={e => setSeasonal(prev => prev.map((r, j) => j === i ? { ...r, end: e.target.value } : r))}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-sky-300" />
            <input type="number" value={s.nightly} onChange={e => setSeasonal(prev => prev.map((r, j) => j === i ? { ...r, nightly: Number(e.target.value) } : r))}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-sky-300" />
            <input type="number" value={s.weekly} onChange={e => setSeasonal(prev => prev.map((r, j) => j === i ? { ...r, weekly: Number(e.target.value) } : r))}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-sky-300" />
          </div>
        ))}
      </div>

      {/* Weekly overrides */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Weekly Overrides</h2>
          <p className="text-xs text-slate-400 mt-1">Leave blank to use seasonal rate. Prices pre-tax (12.75% added at checkout).</p>
        </div>
        <div className="grid grid-cols-5 bg-slate-50 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Check-in</span><span>Check-out</span><span>Season</span><span>Base Rate</span><span>Override</span>
        </div>
        {saturdays.map(sat => {
          const co = new Date(sat); co.setDate(co.getDate() + 7);
          const s = getSeasonForDate(sat);
          const key = sat.toISOString().split("T")[0];
          const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          return (
            <div key={key} className="grid grid-cols-5 px-6 py-3 border-b border-slate-50 last:border-0 items-center hover:bg-slate-50 transition-colors">
              <span className="text-slate-700 text-sm">{fmt(sat)}</span>
              <span className="text-slate-500 text-sm">{fmt(co)}</span>
              <span className="text-slate-500 text-sm">{s?.label ?? "—"}</span>
              <span className="text-slate-600 text-sm">{s ? formatUSD(s.weekly) : "—"}</span>
              <input type="number" value={overrides[key] ?? ""} onChange={e => setOverrides(p => ({ ...p, [key]: e.target.value }))}
                placeholder={String(s?.weekly ?? "")}
                className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving}
          className="bg-sky-500 hover:bg-sky-400 disabled:bg-slate-200 text-white font-semibold px-8 py-2 rounded-full transition-colors">
          {saving ? "Saving…" : "Save All Changes"}
        </button>
        {msg && <span className={`text-sm ${msg.startsWith("Saved") ? "text-green-600" : "text-red-500"}`}>{msg}</span>}
      </div>
    </div>
  );
}

// ── Calendar Tab ──────────────────────────────────────────────────────────────

function CalendarTab({ bookings, vrboEvents }: { bookings: BookingWithEvents[]; vrboEvents: VrboEvent[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [blocks, setBlocks] = useState<BlockedDate[]>([]);
  const [blockForm, setBlockForm] = useState({ checkIn: "", checkOut: "", reason: "" });
  const [adding, setAdding] = useState(false);

  const loadBlocks = useCallback(async () => {
    const r = await fetch("/api/admin/block");
    setBlocks(await r.json());
  }, []);

  useEffect(() => { loadBlocks(); }, [loadBlocks]);

  const addBlock = async () => {
    if (!blockForm.checkIn || !blockForm.checkOut) return;
    setAdding(true);
    await fetch("/api/admin/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockForm),
    });
    setBlockForm({ checkIn: "", checkOut: "", reason: "" });
    await loadBlocks();
    setAdding(false);
  };

  const removeBlock = async (id: string) => {
    await fetch(`/api/admin/block?id=${id}`, { method: "DELETE" });
    await loadBlocks();
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getCellInfo(day: number) {
    const ds = dateStr(day);
    const wb = bookings.find(b =>
      ["confirmed", "deposit_paid", "balance_due", "paid_in_full"].includes(b.status) &&
      b.check_in <= ds && b.check_out > ds
    );
    const vb = vrboEvents.find(e => e.start <= ds && e.end > ds);
    const bl = blocks.find(b => b.check_in <= ds && b.check_out > ds);
    return { wb, vb, bl };
  }

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="space-y-6">
      {/* Month nav */}
      <div className="flex items-center gap-4">
        <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="font-semibold text-slate-800 w-32 text-center">{MONTH_NAMES[month]} {year}</span>
        <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div className="flex gap-3 ml-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-sky-200 inline-block"/> Website</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-200 inline-block"/> VRBO</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-300 inline-block"/> Blocked</span>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="h-14 border-b border-r border-slate-50" />;
            const { wb, vb, bl } = getCellInfo(day);
            const isToday = dateStr(day) === today.toISOString().split("T")[0];
            return (
              <div key={i} className={`h-14 border-b border-r border-slate-50 p-1 relative ${wb ? "bg-sky-50" : vb ? "bg-purple-50" : bl ? "bg-slate-100" : ""}`}>
                <span className={`text-xs font-medium ${isToday ? "bg-sky-500 text-white w-5 h-5 rounded-full flex items-center justify-center" : "text-slate-600"}`}>
                  {day}
                </span>
                {wb && <div className="absolute bottom-1 left-1 right-1 text-[9px] text-sky-700 truncate font-medium">{wb.guest_name.split(" ")[0]}</div>}
                {vb && !wb && <div className="absolute bottom-1 left-1 right-1 text-[9px] text-purple-700 truncate font-medium">VRBO</div>}
                {bl && <div className="absolute bottom-1 left-1 right-1 text-[9px] text-slate-500 truncate">{bl.reason || "Blocked"}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Block dates form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Block Dates</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Check-in</label>
            <input type="date" value={blockForm.checkIn} onChange={e => setBlockForm(p => ({ ...p, checkIn: e.target.value }))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Check-out</label>
            <input type="date" value={blockForm.checkOut} onChange={e => setBlockForm(p => ({ ...p, checkOut: e.target.value }))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Reason</label>
            <input type="text" value={blockForm.reason} onChange={e => setBlockForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="Personal use, Maintenance…"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-sky-300" />
          </div>
          <button onClick={addBlock} disabled={adding || !blockForm.checkIn || !blockForm.checkOut}
            className="bg-sky-500 hover:bg-sky-400 disabled:bg-slate-200 text-white font-semibold px-6 py-2 rounded-full transition-colors text-sm">
            {adding ? "Adding…" : "Block"}
          </button>
        </div>

        {/* Existing blocks */}
        {blocks.length > 0 && (
          <div className="mt-5 space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Blocked Periods</h3>
            {blocks.map(b => (
              <div key={b.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-4 py-2">
                <span className="text-slate-700">
                  {new Date(b.check_in + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} –{" "}
                  {new Date(b.check_out + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {b.reason ? ` · ${b.reason}` : ""}
                </span>
                <button onClick={() => removeBlock(b.id)} className="text-red-400 hover:text-red-500 text-xs font-semibold">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Admin Page ──────────────────────────────────────────────────────────

type Tab = "dashboard" | "bookings" | "pricing" | "calendar";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [bookings, setBookings] = useState<BookingWithEvents[]>([]);
  const [vrboEvents, setVrboEvents] = useState<VrboEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [bRes, vRes] = await Promise.all([
      fetch("/api/admin/bookings"),
      fetch("/api/admin/vrbo-feed"),
    ]);
    if (bRes.ok) setBookings(await bRes.json());
    if (vRes.ok) {
      const { events } = await vRes.json();
      setVrboEvents(events ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) loadData();
  }, [authed, loadData]);

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "dashboard", label: "Dashboard" },
    { id: "bookings", label: `Bookings${bookings.filter(b => b.status === "pending").length ? ` (${bookings.filter(b => b.status === "pending").length})` : ""}` },
    { id: "pricing", label: "Pricing" },
    { id: "calendar", label: "Calendar" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-lg font-bold text-slate-800">Observation Point</h1>
              <p className="text-slate-400 text-xs">Admin</p>
            </div>
            <a href="/" className="text-xs text-slate-400 hover:text-slate-600">← Back to site</a>
          </div>
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${tab === t.id ? "bg-slate-50 text-sky-600 border-b-2 border-sky-500" : "text-slate-500 hover:text-slate-700"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {loading && tab !== "pricing" ? (
          <div className="text-slate-400 text-sm">Loading…</div>
        ) : (
          <>
            {tab === "dashboard" && <DashboardTab bookings={bookings} vrboEvents={vrboEvents} />}
            {tab === "bookings" && <BookingsTab bookings={bookings} onRefresh={loadData} />}
            {tab === "pricing" && <PricingTab />}
            {tab === "calendar" && <CalendarTab bookings={bookings} vrboEvents={vrboEvents} />}
          </>
        )}
      </div>
    </div>
  );
}
