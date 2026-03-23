import { property } from "@/config/property";

const { seasonalRates, rates, payment } = property;

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

// Deduplicate seasonal rates for display: collapse same-label entries,
// merging their `months` values (e.g. "May" + "September" → "May & September").
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

export default function Booking() {
  const currentSeasonLabel = getCurrentSeasonLabel();
  const displayRates = getDisplayRates();

  return (
    <section id="booking" className="py-20 bg-sky-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            Rates &amp; Booking
          </h2>
          <p className="text-slate-500">
            No VRBO service fees if booked direct.
          </p>
        </div>

        {/* Seasonal rate table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
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

        {/* Deposit & cancellation info */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white rounded-xl p-5 border border-slate-100">
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
          <div className="bg-white rounded-xl p-5 border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Cancellation Policy</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {payment.cancellationPolicy}
            </p>
          </div>
        </div>

        {/* How Direct Booking Works */}
        <div className="mb-10">
          <h3 className="text-center text-lg font-bold text-slate-800 mb-6">
            How Direct Booking Works
          </h3>
          <ol className="grid sm:grid-cols-2 gap-4">
            {[
              {
                n: 1,
                title: "Pick your dates",
                desc: "Use the availability calendar below to select your check-in and checkout Saturday.",
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
                desc: "A few days before arrival, Tom sends the door code, WiFi credentials, and a link to the guest guidebook.",
              },
              {
                n: 6,
                title: "Enjoy the Outer Banks",
                desc: "Check in Saturday at 4 PM. Questions during your stay? Text or email Tom directly.",
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
