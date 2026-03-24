"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface Bedroom {
  name: string;
  beds: string;
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

function FloorPlanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M3 9h18" />
      <path d="M9 9v12" />
      <path d="M9 15h6" />
    </svg>
  );
}

export default function BedroomDetails({ rooms }: { rooms: Bedroom[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-10 grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
        {rooms.map((room) => (
          <div
            key={room.name}
            className="flex items-center gap-4 bg-slate-50 rounded-xl px-5 py-4"
          >
            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
              <BedIcon className="text-sky-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-slate-800 font-semibold text-sm">{room.name}</div>
              <div className="text-slate-500 text-sm">{room.beds}</div>
            </div>
            <button
              onClick={() => setOpen(true)}
              title="View floor plan"
              className="shrink-0 text-slate-300 hover:text-sky-500 transition-colors p-1 rounded"
            >
              <FloorPlanIcon />
            </button>
          </div>
        ))}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: "/images/floor-plan.png", alt: "Observation Point floor plan" }]}
        carousel={{ finite: true }}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
      />
    </>
  );
}
