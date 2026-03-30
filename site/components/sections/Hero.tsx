import Image from "next/image";
import { property } from "@/config/property";

export default function Hero() {
  const heroImage = property.heroImage;

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
        className="object-cover object-left sm:object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/30 to-slate-900/75" />

      <div className="relative z-10 max-w-3xl flex flex-col items-center">
        <Image
          src="/images/logo.png"
          alt={property.name}
          width={600}
          height={600}
          priority
          className="w-40 sm:w-48 lg:w-56 h-auto mb-6 drop-shadow-2xl"
        />
        <h1 className="text-white text-2xl sm:text-3xl font-light uppercase tracking-widest mb-2 drop-shadow">
          Observation Point
        </h1>
        <p className="text-sky-300 text-sm font-semibold uppercase tracking-widest mb-3">
          Frisco, NC · {property.location.area}
        </p>
        <p className="text-white/90 text-xl sm:text-2xl mb-3 drop-shadow leading-snug max-w-xl">
          {property.tagline}
        </p>
        <p className="text-white/60 text-sm mb-10 drop-shadow">
          Soundfront cottage · Private dock · Sleeps 6
        </p>

        {/* Direct booking value prop */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5">
          <a
            href="#booking"
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-lg shadow-lg"
          >
            Book Direct with Owners
          </a>
        </div>

        {/* Trust micro-copy */}
        <p className="text-white/50 text-xs">
          {property.vrboStats.excellent} of {property.vrboStats.total} VRBO guests rated their stay Excellent ·{" "}
          <a
            href={property.vrboUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/70 transition-colors"
          >
            See reviews
          </a>
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
