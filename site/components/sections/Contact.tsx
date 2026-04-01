import { property } from "@/config/property";

export default function Contact() {
  const email = property.contactEmail;
  const subject = encodeURIComponent(
    `Inquiry about ${property.name} - Frisco OBX`
  );
  const body = encodeURIComponent(
    `Hi,\n\nI'm interested in booking ${property.name}.\n\nDates: \nNumber of guests: \nQuestions: \n\nThank you!`
  );

  return (
    <section id="contact" className="py-20 bg-slate-800 text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3">Get in Touch</h2>
        <p className="text-white/70 text-lg mb-8">
          Questions about the property, custom stays, or anything else — we'd
          love to hear from you.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`mailto:${email}?subject=${subject}&body=${body}`}
            className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors shadow-lg"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Email the Owners
          </a>

          {property.payment.venmo?.handle && (
            <a
              href={`https://venmo.com/${property.payment.venmo.handle.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-full text-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M8 9l2 6 2-4 2 4 2-6" />
              </svg>
              Venmo {property.payment.venmo.handle}
            </a>
          )}
        </div>

        <div className="mt-6 text-white/50 text-sm">
          We typically respond within a few hours.
        </div>

        {/* Guidebook link for confirmed guests */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-white/40 text-sm mb-2">Already booked?</p>
          <a
            href="/guidebook"
            className="text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
          >
            Access the Guest Guidebook →
          </a>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-sm">
          <span>
            © {new Date().getFullYear()} {property.name} · {property.location.address}
          </span>
          <a
            href={property.vrboUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70 transition-colors"
          >
            Also on VRBO →
          </a>
        </div>
      </div>
    </section>
  );
}
