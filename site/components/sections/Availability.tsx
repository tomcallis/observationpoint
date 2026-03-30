import { Suspense } from "react";
import { getBlockedRanges } from "@/lib/ical";
import AvailabilitySection from "@/components/ui/AvailabilitySection";
import { property } from "@/config/property";

const { seasonalRates, rateTable, payment } = property;

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

  return (
    <section id="booking" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            Rates &amp; Availability
          </h2>
          <p className="text-slate-500">
            Saturday to Saturday · 7-night minimum · No VRBO service fees if booked direct.
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Syncs automatically with our VRBO listing — updated every 15 minutes.
          </p>
        </div>

        {/* Availability calendar */}
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarLoader />
        </Suspense>

        {/* Seasonal rate table */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>Season</span>
              <span className="text-right">Weekly</span>
            </div>
            {rateTable.map((row) => {
              const isCurrent = currentSeasonLabel?.startsWith(row.label) ?? false;
              return (
                <div
                  key={row.label}
                  className={`grid grid-cols-2 px-6 py-4 border-b border-slate-50 last:border-0 transition-colors ${
                    isCurrent ? "bg-sky-50" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <span>
                      {row.label}
                      {row.subtitle && (
                        <span className="block text-xs font-normal text-slate-400">
                          {row.subtitle}
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
                    {formatUSD(row.weekly)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">Plus NC and Dare County tax (12.75%)</p>
        </div>

        {/* Payment & cancellation */}
        <div className="grid sm:grid-cols-2 gap-4 mt-12">
          <div className="bg-sky-50 rounded-xl p-5 border border-sky-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Payment</h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="text-sky-500 shrink-0">&#x2713;</span>
                {payment.deposit.percent}% deposit due at booking
              </li>
              <li className="flex gap-2">
                <span className="text-sky-500 shrink-0">&#x2713;</span>
                Balance due {payment.deposit.balanceDueDays} days before check-in
              </li>
              <li className="flex gap-2">
                <span className="text-sky-500 shrink-0">&#x2713;</span>
                Pay via Venmo or check
              </li>
            </ul>
          </div>
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Cancellation Policy</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {payment.cancellationPolicy}
            </p>
          </div>
        </div>

        {/* How Direct Booking Works */}
        <div className="mt-12">
          <h3 className="text-center text-lg font-bold text-slate-800 mb-6">
            How Direct Booking Works
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
                desc: "Fill in your details and submit. Tom receives an email and confirms availability within a few hours.",
              },
              {
                n: 3,
                title: "Pay the deposit",
                desc: `Send ${payment.deposit.percent}% of the total by Venmo (@tomcallis) or check. Your dates are held for ${payment.deposit.holdHours} hours while payment clears.`,
              },
              {
                n: 4,
                title: "Pay the balance",
                desc: `The remaining balance is due ${payment.deposit.balanceDueDays} days before check-in. Tom sends a reminder.`,
              },
              {
                n: 5,
                title: "Get your check-in details",
                desc: "A few days before arrival, Tom sends a link to the guest guidebook with everything you need to know.",
              },
              {
                n: 6,
                title: "Enjoy the Outer Banks",
                desc: "Check in Saturday at 3:30 PM. Questions during your stay? Text or email Tom directly.",
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
        </div>

      </div>
    </section>
  );
}
