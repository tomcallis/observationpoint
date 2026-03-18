import Image from "next/image";
import { property } from "@/config/property";

export default function Hero() {
  const heroImage = property.images[0];

  return (
    <section
      id="top"
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-4"
    >
      <Image
        src={heroImage.src}
        alt={heroImage.alt}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/30 to-slate-900/70" />

      <div className="relative z-10 max-w-3xl flex flex-col items-center">
        <Image
          src="/Original Logo.png"
          alt={property.name}
          width={320}
          height={136}
          priority
          className="w-auto h-28 sm:h-40 mb-6 drop-shadow-2xl rounded"
        />
        <p className="text-sky-300 text-sm font-medium uppercase tracking-widest mb-3">
          {property.location.area}
        </p>
        <h1 className="text-white text-5xl sm:text-7xl font-bold leading-tight mb-4 drop-shadow-lg">
          {property.name}
        </h1>
        <p className="text-white/90 text-xl sm:text-2xl mb-10 drop-shadow">
          {property.tagline}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#availability"
            className="bg-white/20 hover:bg-white/30 backdrop-blur border border-white/40 text-white font-semibold px-8 py-3 rounded-full transition-all text-lg"
          >
            Check Availability
          </a>
          <a
            href="#booking"
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-3 rounded-full transition-colors text-lg shadow-lg"
          >
            Book Now
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
