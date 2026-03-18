"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { property } from "@/config/property";

export default function Gallery() {
  const [index, setIndex] = useState(-1);

  const slides = property.images.map((img) => ({
    src: img.src,
    alt: img.alt,
  }));

  return (
    <section id="gallery" className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            Photo Gallery
          </h2>
          <p className="text-slate-500">Click any photo to enlarge</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {property.images.map((img, i) => (
            <button
              key={img.src}
              onClick={() => setIndex(i)}
              className={`relative overflow-hidden rounded-xl cursor-pointer group ${
                i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
              }`}
              style={i === 0 ? { aspectRatio: "1/1" } : {}}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
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
