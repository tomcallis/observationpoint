"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface Bedroom {
  name: string;
  beds: string;
  images?: { src: string; alt: string }[];
}

function BedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4v16" />
      <path d="M22 4v16" />
      <path d="M2 8h20" />
      <path d="M2 16h20" />
      <path d="M6 8v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <path d="M2 12h20v4H2z" />
    </svg>
  );
}

export default function BedroomDetails({ rooms }: { rooms: Bedroom[] }) {
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);
  const [bedroomImages, setBedroomImages] = useState<{ src: string; alt: string }[] | null>(null);

  return (
    <>
      <div className="mt-10 grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
        {rooms.map((room) => {
          const hasPhotos = room.images && room.images.length > 0;
          return (
            <button
              key={room.name}
              onClick={() => hasPhotos && setBedroomImages(room.images!)}
              className={`flex items-center gap-4 bg-slate-50 rounded-xl px-5 py-4 text-left w-full transition-colors ${hasPhotos ? "hover:bg-sky-50 cursor-pointer group" : "cursor-default"}`}
            >
              <div className={`w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center shrink-0 ${hasPhotos ? "group-hover:bg-sky-200 transition-colors" : ""}`}>
                <BedIcon className="text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-800 font-semibold text-sm flex items-center gap-1.5">
                  {room.name}
                  {hasPhotos && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400 group-hover:text-sky-500 transition-colors shrink-0">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                </div>
                <div className="text-slate-500 text-sm">{room.beds}</div>
              </div>
            </button>
          );
        })}

        {/* Floor plan card */}
        <button
          onClick={() => setFloorPlanOpen(true)}
          className="sm:col-span-2 flex items-center justify-center gap-3 bg-slate-50 hover:bg-sky-50 border border-dashed border-slate-200 hover:border-sky-300 rounded-xl px-5 py-4 transition-colors group"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-sky-500 transition-colors shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="1" />
            <path d="M3 9h18" />
            <path d="M9 9v12" />
            <path d="M9 15h6" />
          </svg>
          <span className="text-slate-500 group-hover:text-sky-600 text-sm font-medium transition-colors">
            View Floor Plan
          </span>
        </button>
      </div>

      {/* Bedroom photo lightbox */}
      <Lightbox
        open={!!bedroomImages}
        close={() => setBedroomImages(null)}
        slides={bedroomImages ?? []}
        carousel={{ finite: (bedroomImages?.length ?? 0) <= 1 }}
        render={bedroomImages?.length === 1 ? { buttonPrev: () => null, buttonNext: () => null } : undefined}
      />

      {/* Floor plan lightbox */}
      <Lightbox
        open={floorPlanOpen}
        close={() => setFloorPlanOpen(false)}
        slides={[{ src: "/images/floor-plan.png", alt: "Observation Point floor plan" }]}
        carousel={{ finite: true }}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
      />
    </>
  );
}
