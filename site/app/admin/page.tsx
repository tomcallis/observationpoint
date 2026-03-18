"use client";

import { useState, useEffect, useCallback } from "react";
import { property } from "@/config/property";
import { formatUSD } from "@/lib/pricing";

function getSeasonForDate(date: Date) {
  const mmdd = date.toISOString().split("T")[0].slice(5);
  for (const s of property.seasonalRates) {
    if (mmdd >= s.start && mmdd < s.end) return s;
  }
  return property.seasonalRates[property.seasonalRates.length - 1];
}

function getSaturdays(count: number): Date[] {
  const result: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // Advance to next Saturday
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
  for (let i = 0; i < count; i++) {
    result.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return result;
}

export default function AdminPricingPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const saturdays = getSaturdays(52);
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "admin123";

  const loadOverrides = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/prices");
      if (res.ok) {
        const data = await res.json();
        const stringified: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) {
          stringified[k] = String(v);
        }
        setOverrides(stringified);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (authenticated) loadOverrides();
  }, [authenticated, loadOverrides]);

  const handleLogin = () => {
    if (passwordInput === adminPassword) {
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      // Convert to numbers, skip empty strings
      const payload: Record<string, number> = {};
      for (const [k, v] of Object.entries(overrides)) {
        const num = parseFloat(v);
        if (!isNaN(num) && num > 0) payload[k] = num;
      }
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveMessage("Saved successfully!");
      } else {
        setSaveMessage("Error saving. Please try again.");
      }
    } catch {
      setSaveMessage("Error saving. Please try again.");
    }
    setSaving(false);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Admin</h1>
          <p className="text-slate-500 text-sm mb-6">Weekly pricing management</p>
          <div className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
            {passwordError && <p className="text-red-500 text-sm">Incorrect password.</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2 rounded-full transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Weekly Pricing</h1>
            <p className="text-slate-500 text-sm mt-1">
              Observation Point · Next 52 weeks
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className={`text-sm ${saveMessage.startsWith("Saved") ? "text-green-600" : "text-red-500"}`}>
                {saveMessage}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-sky-500 hover:bg-sky-400 disabled:bg-slate-200 text-white font-semibold px-6 py-2 rounded-full transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        <p className="text-slate-400 text-xs mb-4">
          Leave override blank to use the seasonal rate. Prices are pre-tax — 12.75% tax is added at checkout.
        </p>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-5 bg-slate-50 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Check-in</span>
            <span>Check-out</span>
            <span>Season</span>
            <span>Base Rate</span>
            <span>Override</span>
          </div>
          {saturdays.map(sat => {
            const checkout = new Date(sat);
            checkout.setDate(checkout.getDate() + 7);
            const season = getSeasonForDate(sat);
            const key = sat.toISOString().split("T")[0];
            const formatShort = (d: Date) =>
              d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

            return (
              <div
                key={key}
                className="grid grid-cols-5 px-6 py-3 border-b border-slate-50 last:border-0 items-center hover:bg-slate-50 transition-colors"
              >
                <span className="text-slate-700 text-sm">{formatShort(sat)}</span>
                <span className="text-slate-500 text-sm">{formatShort(checkout)}</span>
                <span className="text-slate-500 text-sm">{season.label}</span>
                <span className="text-slate-600 text-sm">{formatUSD(season.weekly)}</span>
                <input
                  type="number"
                  value={overrides[key] ?? ""}
                  onChange={e => setOverrides(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={String(season.weekly)}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
