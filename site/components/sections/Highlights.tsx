import { property } from "@/config/property";
import BedroomDetails from "@/components/ui/BedroomDetails";

// ── Icon definitions ───────────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  // Water & dock
  "30-ft Private Dock": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="22" x2="12" y2="8" />
      <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    </svg>
  ),
  "Soundfront Deck": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  "Pamlico Sound Views": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  "Nightly Sunsets": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M4.93 4.93l2.83 2.83M2 12h4M4.93 19.07l2.83-2.83" />
      <path d="M3 18h18" />
      <path d="M6 14a6 6 0 0 1 12 0" />
    </svg>
  ),
  "Sound Swimming": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
      <path d="M2 18c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
      <circle cx="12" cy="6" r="2" />
      <path d="M12 8v2l2 2" />
    </svg>
  ),
  "Kayak & Paddleboard": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h20" />
      <path d="M2 12l5-7 5 7 5-7 5 7" />
    </svg>
  ),
  "Fishing Off Dock": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16.5c0 2.5-2.5 4-6 4s-6-1.5-6-4" />
      <path d="M3 8c1 0 3 .5 4 2" />
      <path d="M3 8V5l3 1.5" />
      <path d="M7 10c.6 2 2.4 5 5 5 3.5 0 5-2 5-5 0-2-1-4-3-5-1.5-.7-3-.7-4 0" />
    </svg>
  ),
  "Hammock": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6c0 7 4 12 9 12s9-5 9-12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="4" x2="3" y2="8" />
      <line x1="21" y1="4" x2="21" y2="8" />
    </svg>
  ),
  // Indoor
  "Open Floorplan": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  "Full Kitchen": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2" />
      <path d="M6 20v-9" />
      <path d="M18 20v-9" />
      <path d="M4 20h16" />
    </svg>
  ),
  "En-Suite Bathrooms": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6 L9 2 L4 2 L4 12" />
      <path d="M4 12 Q4 16 8 16 L20 16 Q20 12 20 12" />
      <path d="M2 12 L22 12" />
      <path d="M10 16 L10 20" />
      <path d="M14 16 L14 20" />
    </svg>
  ),
  "High-Speed WiFi": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  "Central A/C": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="8" rx="2" />
      <path d="M2 7h20" />
      <path d="M7 19v-8" />
      <path d="M12 19v-8" />
      <path d="M17 19v-8" />
      <path d="M5 19h14" />
    </svg>
  ),
  "Beach Access 10 min": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="4" />
      <path d="M12 2v2M12 18v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
};

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function Highlights() {
  return (
    <section id="highlights" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
            The Property
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            {property.description}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {property.highlights.map((item) => {
            const icon = ICONS[item.label] ?? <CheckIcon />;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 hover:bg-sky-50 transition-colors"
              >
                <span className="text-sky-500 shrink-0">{icon}</span>
                <span className="text-slate-700 font-medium text-sm">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="mt-14 grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
          <div>
            <div className="text-3xl font-bold text-sky-600">{property.sleeps}</div>
            <div className="text-slate-500 text-sm">Guests</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-sky-600">{property.bedrooms}</div>
            <div className="text-slate-500 text-sm">Bedrooms</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-sky-600">{property.bathrooms}</div>
            <div className="text-slate-500 text-sm">Bathrooms</div>
          </div>
        </div>

        {/* Bedroom details */}
        {property.bedroomDetails && (
          <BedroomDetails rooms={property.bedroomDetails} />
        )}
      </div>
    </section>
  );
}
