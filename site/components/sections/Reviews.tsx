import { property } from "@/config/property";

export default function Reviews() {
  const { reviews, vrboStats } = property;
  if (!reviews?.length) return null;

  return (
    <section id="reviews" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
            What Guests Say
          </h2>

          {/* VRBO rating stats */}
          {vrboStats && (
            <div className="inline-flex items-center gap-3 bg-white border border-amber-200 rounded-full px-5 py-2.5 shadow-sm">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-800">
                {vrboStats.excellent} of {vrboStats.total} reviews rated Excellent
              </span>
              <span className="text-slate-300">·</span>
              <a
                href={property.vrboUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-600 hover:text-sky-500 font-medium transition-colors"
              >
                Verified on VRBO
              </a>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col"
            >
              {/* Quote mark */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="#e0f2fe"
                className="mb-3 shrink-0"
              >
                <path d="M11 7H6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h3l-1 3h3l1-3V9a2 2 0 0 0-2-2zM21 7h-5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h3l-1 3h3l1-3V9a2 2 0 0 0-2-2z" />
              </svg>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, s) => (
                  <svg
                    key={s}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={s < review.rating ? "#f59e0b" : "#e2e8f0"}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed flex-1">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-sm font-semibold text-slate-800">{review.name}</span>
                {review.date && (
                  <span className="text-xs text-slate-400 ml-2">{review.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {property.vrboUrl && (
          <div className="text-center mt-10">
            <a
              href={property.vrboUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-500 text-sm font-medium transition-colors"
            >
              Read all {vrboStats?.total ?? ""} reviews on VRBO
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
