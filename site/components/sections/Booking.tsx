import { property } from "@/config/property";

const { seasonalRates, rates, vrboUrl, contactEmail, payment } = property;

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

export default function Booking() {
  const currentSeasonLabel = getCurrentSeasonLabel();
  const subject = encodeURIComponent(
    `Booking Inquiry — ${property.name}`
  );
  const body = encodeURIComponent(
    `Hi,\n\nI'd like to book ${property.name}.\n\nArrival date: \nDeparture date: \nNumber of guests: \n\nThank you!`
  );

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
          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-100 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span>Season</span>
            <span className="text-right">Nightly</span>
            <span className="text-right">Weekly</span>
          </div>
          {seasonalRates.map((season) => {
            const isCurrent = season.label === currentSeasonLabel;
            return (
              <div
                key={season.label}
                className={`grid grid-cols-3 px-6 py-4 border-b border-slate-50 last:border-0 transition-colors ${
                  isCurrent ? "bg-sky-50" : "hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  {season.label}
                  {isCurrent && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide bg-sky-500 text-white rounded-full px-2 py-0.5 leading-tight">
                      Now
                    </span>
                  )}
                </span>
                <span className="text-right text-slate-500 text-sm">
                  {formatUSD(Math.round(season.nightly * (1 + rates.taxRate)))}
                  <span className="text-slate-400 text-xs"> / night</span>
                </span>
                <span className="text-right text-slate-600">
                  {formatUSD(Math.round(season.weekly * (1 + rates.taxRate)))}
                  <span className="text-slate-400 text-xs"> / week</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Terms */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500 mb-8">
          <span>Saturday to Saturday</span>
          <span>7-night minimum</span>
          <span>No hidden fees</span>
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

        {/* CTAs */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          <a
            href={`mailto:${contactEmail}?subject=${subject}&body=${body}`}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 rounded-full transition-colors text-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Request to Book
          </a>
          <a
            href={vrboUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold py-4 rounded-full transition-colors text-center"
          >
            Book on VRBO
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">{rates.notes}</p>
      </div>
    </section>
  );
}
