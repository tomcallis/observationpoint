"use client";

import { useState } from "react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import BookingModal from "./BookingModal";
import type { BlockedRange } from "@/lib/ical";

interface SeasonData {
  label: string;
  start: string;
  end: string;
  nightly: number;
  weekly: number;
  subtitle?: string;
}

interface NamedWeek {
  date: string;
  label: string;
  price: number;
}

interface Props {
  blockedRanges: BlockedRange[];
  bookingCutoffDate?: string;
  seasons: SeasonData[];
  namedWeeks: NamedWeek[];
  displayYear: number;
  currentSeasonLabel: string | null;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatMonthRange(start: string, end: string): string {
  const startMonth = MONTHS[parseInt(start.split("-")[0]) - 1];
  const endMonth = MONTHS[parseInt(end.split("-")[0]) - 1];
  return startMonth === endMonth ? startMonth : `${startMonth} – ${endMonth}`;
}

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function seasonInitialMonth(season: SeasonData): Date {
  const mm = parseInt(season.start.split("-")[0]);
  const now = new Date();
  let year = now.getFullYear();
  // If start month is already past for this year, use next year
  if (mm < now.getMonth() + 1 || (mm === now.getMonth() + 1 && now.getDate() > 15)) {
    year += 1;
  }
  return new Date(year, mm - 1, 1);
}

export default function AvailabilitySection({
  blockedRanges,
  bookingCutoffDate,
  seasons,
  namedWeeks,
  displayYear,
  currentSeasonLabel,
}: Props) {
  const [booking, setBooking] = useState<{ checkin: Date; checkout: Date } | null>(null);
  const [seasonPicker, setSeasonPicker] = useState<SeasonData | null>(null);

  const bookedCheckins = new Set(blockedRanges.map((r) => r.start));
  const availableNamedWeeks = namedWeeks.filter((w) => !bookedCheckins.has(w.date));

  return (
    <>
      <AvailabilityCalendar
        blockedRanges={blockedRanges}
        bookingCutoffDate={bookingCutoffDate}
        onRangeSelected={(checkin, checkout) => setBooking({ checkin, checkout })}
      />

      {/* Seasonal rate table */}
      <div className="mt-12 max-w-md mx-auto">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          {displayYear} Season
        </p>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Season</span>
            <span className="text-right">Weekly</span>
          </div>
          {seasons.map((row) => {
            const isCurrent = currentSeasonLabel?.startsWith(row.label) ?? false;
            return (
              <div
                key={row.label}
                role="button"
                tabIndex={0}
                onClick={() => setSeasonPicker(row)}
                onKeyDown={(e) => e.key === "Enter" && setSeasonPicker(row)}
                className={`group grid grid-cols-2 px-6 py-4 border-b border-slate-50 last:border-0 transition-colors cursor-pointer select-none ${
                  isCurrent ? "bg-sky-50 hover:bg-sky-100" : "hover:bg-slate-50 active:bg-slate-100"
                }`}
              >
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <span>
                    {row.label}
                    <span className="block text-xs font-normal text-slate-400">
                      {row.subtitle ?? formatMonthRange(row.start, row.end)}
                    </span>
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-sky-500 text-white rounded-full px-2 py-0.5 leading-tight shrink-0">
                      Now
                    </span>
                  )}
                </span>
                <span className="flex items-center justify-end gap-2">
                  <span className="text-slate-600 font-medium">{formatUSD(row.weekly)}</span>
                  <span className="text-slate-300 group-hover:text-sky-400 transition-colors text-base leading-none">›</span>
                </span>
              </div>
            );
          })}

          {/* Named holiday weeks */}
          {availableNamedWeeks.length > 0 && (
            <>
              <div className="px-6 py-2 bg-amber-50 border-t border-amber-100">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Special Weeks Available</span>
              </div>
              {availableNamedWeeks.map((week) => {
                const checkin = new Date(week.date + "T12:00:00");
                const checkout = new Date(checkin);
                checkout.setDate(checkout.getDate() + 7);
                const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <div
                    key={week.date}
                    role="button"
                    tabIndex={0}
                    onClick={() => setBooking({ checkin, checkout })}
                    onKeyDown={(e) => e.key === "Enter" && setBooking({ checkin, checkout })}
                    className="group grid grid-cols-2 px-6 py-3 border-b border-slate-50 last:border-0 hover:bg-amber-50 active:bg-amber-100 transition-colors cursor-pointer select-none"
                  >
                    <span className="text-slate-700 font-medium">
                      {week.label}
                      <span className="block text-xs font-normal text-slate-400">
                        {fmtDate(checkin)} – {fmtDate(checkout)}
                      </span>
                    </span>
                    <span className="flex items-center justify-end gap-2">
                      <span className="text-slate-600 font-medium self-center">{formatUSD(week.price)}</span>
                      <span className="text-xs font-semibold text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 leading-tight self-center">
                        Book
                      </span>
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">Plus NC and Dare County tax (12.75%)</p>
      </div>

      {/* Season date picker modal */}
      {seasonPicker && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto p-4 py-8"
          onClick={(e) => { if (e.target === e.currentTarget) setSeasonPicker(null); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Pick your {seasonPicker.label} dates
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {seasonPicker.subtitle ?? formatMonthRange(seasonPicker.start, seasonPicker.end)} · {formatUSD(seasonPicker.weekly)}/week
                </p>
              </div>
              <button
                onClick={() => setSeasonPicker(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none px-1"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <AvailabilityCalendar
                blockedRanges={blockedRanges}
                bookingCutoffDate={bookingCutoffDate}
                initialMonth={seasonInitialMonth(seasonPicker)}
                onRangeSelected={(checkin, checkout) => {
                  setSeasonPicker(null);
                  setBooking({ checkin, checkout });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {booking && (
        <BookingModal
          checkin={booking.checkin}
          checkout={booking.checkout}
          onClose={() => setBooking(null)}
        />
      )}
    </>
  );
}
