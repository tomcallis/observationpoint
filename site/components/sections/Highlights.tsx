import { property } from "@/config/property";

export default function Highlights() {
  return (
    <section id="highlights" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
            Everything You Need
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            {property.description}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {property.highlights.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 hover:bg-sky-50 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
              <span className="text-slate-700 font-medium text-sm">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Quick stats */}
        <div className="mt-14 grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
          <div>
            <div className="text-3xl font-bold text-sky-600">
              {property.sleeps}
            </div>
            <div className="text-slate-500 text-sm">Guests</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-sky-600">
              {property.bedrooms}
            </div>
            <div className="text-slate-500 text-sm">Bedrooms</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-sky-600">
              {property.bathrooms}
            </div>
            <div className="text-slate-500 text-sm">Bathrooms</div>
          </div>
        </div>
      </div>
    </section>
  );
}
