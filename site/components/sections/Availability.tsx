import { Suspense } from "react";
import { getBlockedRanges } from "@/lib/ical";
import AvailabilitySection from "@/components/ui/AvailabilitySection";
import { property } from "@/config/property";

const { seasonalRates, rates } = property;

function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function getCurrentSeasonLabel(): string | null {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = `${mm}-${dd}`;
  for (const s of seasonalRates) {
    if (today >= s.start && today < s.end) return s.label;
  }
  return null;
}

type DisplayRate = (typeof seasonalRates)[0] & { displayMonths?: string };
function getDisplayRates(): DisplayRate[] {
  const seen = new Map<string, DisplayRate>();
  for (const s of seasonalRates) {
    if (seen.has(s.label)) {
      const existing = seen.get(s.label)!;
      if (existing.months && s.months) {
        existing.displayMonths = `${existing.months} & ${s.months}`;
      }
    } else {
      seen.set(s.label, { ...s, displayMonths: s.months });
    }
  }
  return Array.from(seen.values());
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

async function CalendarLoader() {
  const blockedRanges = await getBlockedRanges();
  return <AvailabilitySection blockedRanges={blockedRanges} />;
}

export default function Availability() {
  const currentSeasonLabel = getCurrentSeasonLabel();
  const displayRates = getDisplayRates();

  return (
    <section id="availability" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            Rates &amp; Availability
          </h2>
          <p className="text-slate-500">
            Saturday to Saturday · 7-night minimum
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Syncs automatically with our VRBO listing — updated every 15 minutes.
          </p>
        </div>
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarLoader />
        </Suspense>

        {/* Seasonal rate table */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>Season</span>
              <span className="text-right">Weekly (incl. tax)</span>
            </div>
            {displayRates.map((season) => {
              const isCurrent = season.label === currentSeasonLabel;
              return (
                <div
                  key={season.label}
                  className={`grid grid-cols-2 px-6 py-4 border-b border-slate-50 last:border-0 transition-colors ${
                    isCurrent ? "bg-sky-50" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <span>
                      {season.label}
                      {season.displayMonths && (
                        <span className="block text-xs font-normal text-slate-400">
                          {season.displayMonths}
                        </span>
                      )}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-sky-500 text-white rounded-full px-2 py-0.5 leading-tight shrink-0">
                        Now
                      </span>
                    )}
                  </span>
                  <span className="text-right text-slate-600 font-medium">
                    {formatUSD(Math.round(season.weekly * (1 + rates.taxRate)))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
