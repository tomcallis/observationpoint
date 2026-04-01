import { Suspense } from "react";
import { readFileSync } from "fs";
import { join } from "path";
import { getBlockedRanges } from "@/lib/ical";
import { getSetting } from "@/lib/db";
import AvailabilitySection from "@/components/ui/AvailabilitySection";
import { property } from "@/config/property";

const { payment } = property;

type WeeklyEntry = number | { price: number; label?: string };

interface SeasonData {
  label: string;
  start: string;
  end: string;
  nightly: number;
  weekly: number;
  subtitle?: string;
}

interface SeasonalRatesV2 {
  bookingCutoffDate?: string;
  seasonsByYear: Record<string, SeasonData[]>;
}
interface SeasonalRatesLegacy {
  bookingCutoffDate?: string;
  seasons: SeasonData[];
}

interface NamedWeek {
  date: string;
  label: string;
  price: number;
}

function readJSONFile(path: string) {
  try { return JSON.parse(readFileSync(path, "utf-8")); } catch { return null; }
}

function resolveDisplayYear(data: SeasonalRatesV2): number {
  const keys = Object.keys(data.seasonsByYear).sort();
  if (!keys.length) return new Date().getFullYear();
  const target = String(new Date().getFullYear());
  if (data.seasonsByYear[target]) return Number(target);
  return Number(keys.reduce((a, b) =>
    Math.abs(Number(a) - Number(target)) <= Math.abs(Number(b) - Number(target)) ? a : b
  ));
}

async function loadRateData(): Promise<{ seasons: SeasonData[]; displayYear: number; bookingCutoffDate: string | null; namedWeeks: NamedWeek[] }> {
  const [seasonalDB, weeklyDB] = await Promise.all([
    getSetting("seasonal-rates"),
    getSetting("weekly-prices"),
  ]);

  const raw = (seasonalDB as SeasonalRatesV2 | SeasonalRatesLegacy | null) ??
    readJSONFile(join(process.cwd(), "data", "seasonal-rates.json"));

  let seasons: SeasonData[];
  let displayYear: number;

  if (raw && "seasonsByYear" in raw && raw.seasonsByYear) {
    const v2 = raw as SeasonalRatesV2;
    displayYear = resolveDisplayYear(v2);
    seasons = v2.seasonsByYear[String(displayYear)] ?? property.seasonalRates;
  } else {
    const legacy = raw as SeasonalRatesLegacy | null;
    seasons = legacy?.seasons ?? property.seasonalRates;
    displayYear = new Date().getFullYear();
  }

  const weekly: Record<string, WeeklyEntry> =
    (weeklyDB as Record<string, WeeklyEntry> | null) ??
    readJSONFile(join(process.cwd(), "data", "weekly-prices.json")) ?? {};

  const namedWeeks: NamedWeek[] = Object.entries(weekly)
    .filter(([, v]) => typeof v === "object" && v !== null && (v as { label?: string }).label)
    .map(([date, v]) => ({
      date,
      label: (v as { price: number; label: string }).label,
      price: (v as { price: number; label: string }).price,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    seasons,
    displayYear,
    bookingCutoffDate: raw?.bookingCutoffDate ?? null,
    namedWeeks,
  };
}

function matchesSeason(mmdd: string, start: string, end: string): boolean {
  if (start <= end) return mmdd >= start && mmdd < end;
  // Wraparound (e.g. Nov–Apr): matches if date is >= start OR < end
  return mmdd >= start || mmdd < end;
}

function getCurrentSeasonLabel(seasons: SeasonData[]): string | null {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${mm}-${dd}`;
  for (const s of seasons) {
    if (matchesSeason(today, s.start, s.end)) return s.label;
  }
  return null;
}

export const revalidate = 900;

function CalendarSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-48 bg-slate-200 rounded mx-auto" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-8 bg-slate-100 rounded" />
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, j) => (
                <div key={j} className="h-8 bg-slate-100 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 mt-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-20 bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  );
}

async function CalendarLoader({
  bookingCutoffDate,
  seasons,
  namedWeeks,
  displayYear,
  currentSeasonLabel,
}: {
  bookingCutoffDate: string | null;
  seasons: SeasonData[];
  namedWeeks: NamedWeek[];
  displayYear: number;
  currentSeasonLabel: string | null;
}) {
  const blockedRanges = await getBlockedRanges();
  return (
    <AvailabilitySection
      blockedRanges={blockedRanges}
      bookingCutoffDate={bookingCutoffDate ?? undefined}
      seasons={seasons}
      namedWeeks={namedWeeks}
      displayYear={displayYear}
      currentSeasonLabel={currentSeasonLabel}
    />
  );
}

export default async function Availability() {
  const { seasons, displayYear, bookingCutoffDate, namedWeeks } = await loadRateData();
  const currentSeasonLabel = getCurrentSeasonLabel(seasons);

  // Only show upcoming named weeks (within next 18 months)
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() + 18);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];
  const upcomingNamedWeeks = namedWeeks.filter(w => w.date >= new Date().toISOString().split("T")[0] && w.date <= cutoffStr);

  return (
    <section id="booking" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            Rates &amp; Availability
          </h2>
          <p className="text-slate-500">
            Saturday to Saturday · 7-night minimum
          </p>
        </div>

        {/* Availability calendar + interactive rate table */}
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarLoader
            bookingCutoffDate={bookingCutoffDate}
            seasons={seasons}
            namedWeeks={upcomingNamedWeeks}
            displayYear={displayYear}
            currentSeasonLabel={currentSeasonLabel}
          />
        </Suspense>

        {/* How Direct Booking Works */}
        <div className="mt-12">
          <h3 className="text-center text-lg font-bold text-slate-800 mb-6">
            How to Book
          </h3>
          <ol className="grid sm:grid-cols-2 gap-4">
            {[
              {
                n: 1,
                title: "Pick your dates",
                desc: "Use the availability calendar above to select your check-in and checkout Saturday.",
              },
              {
                n: 2,
                title: "Submit a request",
                desc: "Fill in your details and submit. Tom and Miranda will confirm by email within 24 hours, typically within minutes.",
              },
              {
                n: 3,
                title: "Pay your deposit",
                desc: `Once confirmed, you'll receive check payment instructions for your ${payment.deposit.percent}% deposit. Mail your check within 5 days to secure your dates. Your balance is due ${payment.deposit.balanceDueDays} days before check-in — you'll get a reminder.`,
              },
              {
                n: 4,
                title: "Arrive & enjoy",
                desc: "One week before arrival you'll receive an email with the lockbox code, WiFi, and check-in instructions. Check in Saturday at 3:30 PM.",
              },
            ].map(({ n, title, desc }) => (
              <li key={n} className="bg-white rounded-xl p-5 border border-slate-100 flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-500 text-white text-sm font-bold flex items-center justify-center">
                  {n}
                </span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm mb-1">{title}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="text-center mt-8">
            <a
              href="#booking"
              className="inline-block bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-3 rounded-full transition-colors shadow-sm"
            >
              Check Availability
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
