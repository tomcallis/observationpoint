import { property } from "@/config/property";

const { location } = property;

export default function Location() {
  return (
    <section id="location" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            Location
          </h2>
          <p className="text-slate-500">
            {location.address} · {location.area}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Map */}
          <div className="rounded-2xl overflow-hidden shadow-md aspect-video">
            <iframe
              src={location.mapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Property location map"
            />
          </div>

          {/* Info */}
          <div className="space-y-8">
            {/* Directions */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">
                Getting Here
              </h3>
              <ul className="space-y-2">
                {location.drivingDirections.map((d, i) => (
                  <li key={i} className="flex gap-2 text-slate-600 text-sm">
                    <span className="text-sky-500 mt-0.5">→</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Nearby */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">
                Nearby Attractions
              </h3>
              <ul className="space-y-2">
                {location.nearbyAttractions.map((a) => (
                  <li
                    key={a.name}
                    className="flex justify-between text-sm border-b border-slate-100 pb-2"
                  >
                    <span className="text-slate-700">{a.name}</span>
                    <span className="text-slate-400">{a.distance}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
