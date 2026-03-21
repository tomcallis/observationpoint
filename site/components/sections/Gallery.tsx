"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { property } from "@/config/property";

const PREVIEW_COUNT = 5;

export default function Gallery() {
  const [index, setIndex] = useState(-1);

  const slides = property.images.map((img) => ({
    src: img.src,
    alt: img.alt,
  }));

  const previews = property.images.slice(0, PREVIEW_COUNT);
  const remaining = property.images.length - PREVIEW_COUNT;

  return (
    <section id="gallery" className="py-10 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-72 sm:h-96">
          {/* Large first image */}
          <button
            onClick={() => setIndex(0)}
            className="col-span-2 row-span-2 relative overflow-hidden rounded-xl group"
          >
            <Image
              src={previews[0].src}
              alt={previews[0].alt}
              fill
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
          </button>

          {/* Remaining 4 smaller images */}
          {previews.slice(1).map((img, i) => {
            const isLast = i === previews.slice(1).length - 1;
            return (
              <button
                key={img.src}
                onClick={() => setIndex(i + 1)}
                className="relative overflow-hidden rounded-xl group"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 25vw, 16vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />

                {/* "See all" overlay on last thumbnail */}
                {isLast && remaining > 0 && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <span className="text-white font-bold text-lg sm:text-xl leading-none">
                      +{remaining}
                    </span>
                    <span className="text-white/80 text-xs mt-1">See all photos</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-right">
          <button
            onClick={() => setIndex(0)}
            className="text-sm text-sky-600 hover:text-sky-500 font-medium transition-colors"
          >
            View all {property.images.length} photos →
          </button>
        </div>
      </div>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={slides}
      />
    </section>
  );
}
