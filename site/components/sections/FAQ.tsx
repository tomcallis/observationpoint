"use client";

import { useState } from "react";
import { property } from "@/config/property";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (i: number) => setOpen(open === i ? null : i);

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
            Common Questions
          </h2>
          <p className="text-slate-500 text-lg">
            Everything you need to know about booking direct.
          </p>
        </div>

        <div className="space-y-2">
          {property.faq.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`rounded-xl border transition-colors ${
                  isOpen ? "border-sky-200 bg-sky-50" : "border-slate-100 bg-slate-50"
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`font-medium text-sm sm:text-base ${
                      isOpen ? "text-sky-700" : "text-slate-800"
                    }`}
                  >
                    {item.question}
                  </span>
                  <ChevronIcon open={isOpen} />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <p className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                    {item.answer}
                    {/* Special case: link to VRBO for the first FAQ */}
                    {i === 0 && (
                      <>
                        {" "}
                        <a
                          href={property.vrboUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 hover:text-sky-500 font-medium underline underline-offset-2"
                        >
                          View listing on VRBO →
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-500 text-sm">
            Still have questions?{" "}
            <a
              href="#contact"
              className="text-sky-600 hover:text-sky-500 font-medium"
            >
              Send us a message
            </a>{" "}
            — Tom typically responds within a few hours.
          </p>
        </div>
      </div>
    </section>
  );
}
