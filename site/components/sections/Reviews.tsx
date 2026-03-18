import { property } from "@/config/property";

export default function Reviews() {
  const { reviews } = property;
  if (!reviews?.length) return null;

  return (
    <section id="reviews" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            What Guests Say
          </h2>
          <p className="text-slate-500">
            Real reviews from past visitors
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, s) => (
                  <svg
                    key={s}
                    width="18"
                    height="18"
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
                <span className="text-sm font-medium text-slate-800">{review.name}</span>
                {review.date && (
                  <span className="text-xs text-slate-400 ml-2">{review.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {property.vrboUrl && (
          <div className="text-center mt-8">
            <a
              href={property.vrboUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-500 text-sm font-medium transition-colors"
            >
              See all reviews on VRBO &rarr;
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
