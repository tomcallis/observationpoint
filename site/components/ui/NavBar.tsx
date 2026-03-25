"use client";

import { useState, useEffect } from "react";
import { property } from "@/config/property";

const links = [
  { label: "The Property", href: "#highlights" },
  { label: "Gallery", href: "#gallery" },
  { label: "Rates & Availability", href: "#booking" },
  { label: "FAQ", href: "#faq" },
  { label: "Location", href: "#location" },
];

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const sectionIds = links.map((l) => l.href.slice(1));

    const onScroll = () => {
      setScrolled(window.scrollY > 40);

      const offset = window.scrollY + 120;
      let current = "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= offset) current = id;
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "bg-slate-900/95 backdrop-blur shadow-lg"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Property name — fades in after scrolling past hero */}
        <a
          href="#top"
          className={`text-white font-semibold text-sm tracking-wide transition-opacity duration-300 ${
            scrolled ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {property.name}
        </a>
        <ul className="hidden md:flex items-center gap-6">
          {links.map((l) => {
            const isActive = activeSection === l.href.slice(1);
            return (
              <li key={l.href}>
                <a
                  href={l.href}
                  className={`text-sm transition-colors ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {l.label}
                </a>
              </li>
            );
          })}
          <li>
            <a
              href="#booking"
              className="ml-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
            >
              Book Now
            </a>
          </li>
        </ul>

        <button
          className="md:hidden text-white relative w-11 h-11 flex items-center justify-center"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="relative w-5 h-4 flex flex-col justify-between">
            <span
              className={`block w-full h-0.5 bg-white transition-all duration-300 origin-center ${
                menuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block w-full h-0.5 bg-white transition-opacity duration-300 ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block w-full h-0.5 bg-white transition-all duration-300 origin-center ${
                menuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-96 bg-slate-900/98" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-5 pt-1">
          {links.map((l) => {
            const isActive = activeSection === l.href.slice(1);
            return (
              <a
                key={l.href}
                href={l.href}
                className={`block py-3 text-base transition-colors border-b border-white/10 last:border-0 ${
                  isActive ? "text-white font-semibold" : "text-white/70 hover:text-white"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            );
          })}
          <a
            href="#booking"
            className="block mt-4 bg-sky-500 hover:bg-sky-400 text-white text-base font-medium px-4 py-3 rounded-full text-center transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Book Now
          </a>
        </div>
      </div>
    </header>
  );
}
