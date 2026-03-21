"use client";

import { useState, useEffect } from "react";
import { property } from "@/config/property";

const { guidebook } = property;

function LockIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
      {children}
    </h2>
  );
}

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 sm:w-44 shrink-0">
        {label}
      </span>
      <span className={`font-medium text-slate-800 ${mono ? "font-mono text-sky-700 text-lg" : "text-sm"}`}>
        {value || <span className="text-slate-400 italic">See booking confirmation</span>}
      </span>
    </div>
  );
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  const attempt = () => {
    if (pw === guidebook.password) {
      sessionStorage.setItem("op-guidebook-unlocked", "true");
      onUnlock();
    } else {
      setError("Incorrect password. Check your booking confirmation email.");
      setPw("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6 text-sky-500">
          <LockIcon />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Guest Guidebook</h1>
        <p className="text-slate-500 text-sm mb-8">
          Enter the password from your booking confirmation to access check-in details
          and local recommendations.
        </p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          placeholder="Guidebook password"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-300 mb-3"
          autoFocus
        />
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button
          onClick={attempt}
          disabled={!pw}
          className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Unlock Guidebook
        </button>
        <p className="mt-6 text-xs text-slate-400">
          Questions?{" "}
          <a
            href={`mailto:${property.contactEmail}`}
            className="text-sky-600 hover:underline"
          >
            Contact Tom
          </a>
        </p>
      </div>
    </div>
  );
}

function GuidebookContent() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-sky-400 text-xs font-semibold uppercase tracking-widest mb-1">
            Guest Guidebook
          </p>
          <h1 className="text-2xl font-bold">{property.name}</h1>
          <p className="text-white/60 text-sm mt-1">{property.location.address}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* Check-in & Check-out */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader>Check-in & Check-out</SectionHeader>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-sky-50 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 mb-1">Check-in</p>
              <p className="text-3xl font-bold text-slate-800">{guidebook.checkIn}</p>
              <p className="text-sm text-slate-500 mt-1">Saturday</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Check-out</p>
              <p className="text-3xl font-bold text-slate-800">{guidebook.checkOut}</p>
              <p className="text-sm text-slate-500 mt-1">Saturday</p>
            </div>
          </div>
          <div>
            <InfoItem label="Door Code" value={guidebook.doorCode} mono />
            <InfoItem label="WiFi Network" value={guidebook.wifiName} mono />
            <InfoItem label="WiFi Password" value={guidebook.wifiPassword} mono />
          </div>
        </section>

        {/* House Rules */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader>House Rules</SectionHeader>
          <ul className="space-y-3">
            {guidebook.houseRules.map((rule, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600">
                <span className="text-sky-500 shrink-0 mt-0.5">→</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Checkout Reminders */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader>Before You Leave</SectionHeader>
          <p className="text-sm text-slate-500 mb-4">
            Please take care of these items before your 10 AM checkout:
          </p>
          <ul className="space-y-2.5">
            {guidebook.checkoutReminders.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-5 h-5 border-2 border-slate-300 rounded mt-0.5 shrink-0 flex items-center justify-center">
                  <span className="sr-only">checkbox</span>
                </span>
                <span className="text-sm text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Emergency Contacts */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader>Emergency Contacts</SectionHeader>
          <div>
            {guidebook.emergencyContacts.map((c, i) => (
              <InfoItem key={i} label={c.label} value={c.value} />
            ))}
          </div>
        </section>

        {/* Local Recs */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <SectionHeader>Local Recommendations</SectionHeader>

          <div className="space-y-8">
            {/* Eat */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                🍽 Where to Eat
              </h3>
              <ul className="space-y-3">
                {guidebook.localRecs.eat.map((r, i) => (
                  <li key={i} className="flex flex-col">
                    <span className="font-semibold text-sm text-slate-800">{r.name}</span>
                    <span className="text-xs text-slate-500">{r.note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* See */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                🗺 What to See
              </h3>
              <ul className="space-y-3">
                {guidebook.localRecs.see.map((r, i) => (
                  <li key={i} className="flex flex-col">
                    <span className="font-semibold text-sm text-slate-800">{r.name}</span>
                    <span className="text-xs text-slate-500">{r.note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Do */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                🏄 Things to Do
              </h3>
              <ul className="space-y-3">
                {guidebook.localRecs.doAndPlay.map((r, i) => (
                  <li key={i} className="flex flex-col">
                    <span className="font-semibold text-sm text-slate-800">{r.name}</span>
                    <span className="text-xs text-slate-500">{r.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-sky-50 border border-sky-100 rounded-2xl p-6 text-center">
          <p className="text-slate-700 font-medium mb-2">Questions during your stay?</p>
          <p className="text-slate-500 text-sm mb-4">
            Tom is the best resource for anything about the property or the area.
          </p>
          <a
            href={`mailto:${property.contactEmail}`}
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
          >
            Email Tom
          </a>
        </section>

      </main>

      <footer className="text-center py-8 text-slate-400 text-xs">
        {property.name} · {property.location.address}
      </footer>
    </div>
  );
}

export default function GuidebookPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("op-guidebook-unlocked") === "true") {
      setUnlocked(true);
    }
    setChecking(false);
  }, []);

  if (checking) return null; // avoid flash

  return unlocked ? (
    <GuidebookContent />
  ) : (
    <PasswordGate onUnlock={() => setUnlocked(true)} />
  );
}
