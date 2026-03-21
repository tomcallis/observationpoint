import { Suspense } from "react";
import { getBlockedRanges } from "@/lib/ical";
import AvailabilitySection from "@/components/ui/AvailabilitySection";

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
  return (
    <section id="availability" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            Availability
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
      </div>
    </section>
  );
}
