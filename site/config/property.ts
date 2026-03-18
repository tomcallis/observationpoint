/**
 * OWNER-EDITABLE CONFIG
 * All content, rates, links, and amenity details live here.
 * Edit this file to update the site — no code knowledge required.
 */

export const property = {
  // ── Basic Info ─────────────────────────────────────────────────────────────
  name: "Observation Point",
  tagline: "Soundfront sunsets on Hatteras Island",
  description:
    "A quiet, comfortable cottage perched on the sound in Frisco, NC. Watch pelicans glide past from the private dock, fish at sunrise, and end every day with a sky full of color. No crowds, no checkout rush — just the Outer Banks the way it used to be.",
  location: {
    address: "50184 Treasure Ct, Frisco, NC 27936",
    area: "Hatteras Island, Outer Banks",
    mapsEmbedUrl:
      "https://maps.google.com/maps?q=50184+Treasure+Ct,+Frisco,+NC+27936&z=16&output=embed",
    drivingDirections: [
      "From the north: Take US-158 to NC-12 S through Nags Head, Rodanthe, Waves, Salvo, Avon — continue to Frisco.",
      "From the south (ferry): Take the Ocracoke–Hatteras ferry (free, ~45 min) to Hatteras, then head north on NC-12 to Frisco.",
    ],
    nearbyAttractions: [
      { name: "Cape Hatteras Lighthouse", distance: "5 miles" },
      { name: "Canadian Hole (windsurfing)", distance: "6 miles" },
      { name: "Frisco Pier", distance: "1 mile" },
      { name: "Hatteras Village", distance: "8 miles" },
      { name: "Ocracoke Ferry", distance: "10 miles" },
    ],
  },

  // ── Sleeps / Bedrooms ───────────────────────────────────────────────────────
  sleeps: 6,
  bedrooms: 2,
  bathrooms: 2,

  // ── Amenities ──────────────────────────────────────────────────────────────
  highlights: [
    { label: "Soundfront" },
    { label: "Private Dock" },
    { label: "Hammock" },
    { label: "Ocean Beach 10 min" },
    { label: "Sleeps 6" },
    { label: "Fishing Off Dock" },
    { label: "High-Speed WiFi" },
    { label: "Central A/C" },
    { label: "Outdoor Shower" },
  ],

  // ── Rates ──────────────────────────────────────────────────────────────────
  // Seasonal rate table. Dates are MM-DD (month-day, no year).
  // Seasons are checked top-to-bottom; the first match wins.
  // Update once a year — no code knowledge required.
  seasonalRates: [
    {
      label: "Peak Summer",
      // Late June through Labor Day
      start: "06-21",
      end: "09-01",
      nightly: 350,
      weekly: 2100,
    },
    {
      label: "Memorial Day Week",
      start: "05-23",
      end: "06-01",
      nightly: 325,
      weekly: 1950,
    },
    {
      label: "Spring & Early Fall",
      // Spring (April–mid-June) and Fall (Sep–Oct)
      start: "04-01",
      end: "05-23",
      nightly: 275,
      weekly: 1650,
    },
    {
      label: "Fall",
      start: "09-01",
      end: "11-01",
      nightly: 250,
      weekly: 1500,
    },
    {
      label: "Off Season",
      // Everything else (winter / early spring)
      start: "01-01",
      end: "12-31",
      nightly: 200,
      weekly: 1200,
    },
  ],

  rates: {
    // Fallback / display defaults (used when no seasonal rate matches)
    cleaningFee: 0, // included in the weekly rate
    taxRate: 0.1275, // 12.75% — baked into displayed prices
    minimumStay: 7, // Saturday to Saturday only
    currency: "USD",
    notes: "Saturday to Saturday · 7-night minimum · No VRBO service fees if booked direct.",
  },

  // ── Stripe Payment Links ────────────────────────────────────────────────────
  // Tip: create one Payment Link per season in Stripe, or use a single
  // "deposit" link and invoice the balance manually.
  stripe: {
    weeklyLink: process.env.NEXT_PUBLIC_STRIPE_WEEKLY_LINK ?? "#contact",
    nightlyLink: process.env.NEXT_PUBLIC_STRIPE_NIGHTLY_LINK ?? "#contact",
  },

  // ── Payment ────────────────────────────────────────────────────────────────
  payment: {
    venmo: {
      handle: "@ObservationPointOBX",
    },
    check: {
      payableTo: "Tom Callis",
      mailingAddress: "50184 Treasure Ct, Frisco, NC 27936",
    },
    deposit: {
      percent: 50,            // % due at signing
      balanceDueDays: 30,    // days before check-in that balance is due
    },
    cancellationPolicy:
      "Full refund if cancelled 60+ days before check-in. 50% refund if cancelled 30–59 days before. No refund within 30 days of check-in.",
  },

  // ── Contact ────────────────────────────────────────────────────────────────
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "owner@observationpointobx.com",
  vrboUrl: "https://www.vrbo.com/766628",

  // ── Guest Reviews ─────────────────────────────────────────────────────────
  // Add or remove reviews here. Pull from VRBO, Google, or add manually.
  reviews: [
    {
      name: "Sarah M.",
      rating: 5,
      date: "Aug 2025",
      text: "This place is an absolute gem. The sunsets from the dock are unreal — we sat out there every single evening. The house is clean, comfortable, and has everything you need. Already booked again for next summer!",
    },
    {
      name: "David & Lisa K.",
      rating: 5,
      date: "Jul 2025",
      text: "Perfect spot for a quiet family getaway. The kids loved fishing off the dock and we loved the peace and quiet. The sound views from the deck are stunning. Way better than the big resort rentals.",
    },
    {
      name: "Mark T.",
      rating: 5,
      date: "Jun 2025",
      text: "We've been coming to Hatteras for 15 years and this is hands down our favorite rental. The location on the sound is unbeatable, the dock is great for kayaking, and the owner is incredibly responsive.",
    },
    {
      name: "Jennifer R.",
      rating: 5,
      date: "Sep 2025",
      text: "Came for a week in September and it was heavenly. No crowds, beautiful weather, and the house had everything we needed. The hammock under the deck became my favorite spot. Can't recommend enough!",
    },
    {
      name: "Chris & Amy P.",
      rating: 5,
      date: "May 2025",
      text: "We booked direct and the whole process was seamless. The house is exactly as pictured — cozy, clean, and right on the water. Waking up to the sound every morning was magical.",
    },
    {
      name: "Tom W.",
      rating: 5,
      date: "Oct 2025",
      text: "Off-season Hatteras is the best kept secret and this cottage is the perfect home base. Fished off the dock every morning, explored the lighthouse, and enjoyed the quiet evenings. Will be back.",
    },
  ],

  // ── Gallery Images ─────────────────────────────────────────────────────────
  // The first image is used as the Hero background.
  images: [
    { src: "/images/deck-sound-view.jpg", alt: "Covered deck looking over the dock and Pamlico Sound" },
    { src: "/images/dock-sound-wide.jpg", alt: "Private dock on the Pamlico Sound" },
    { src: "/images/dock-chairs.jpg", alt: "Adirondack chairs on the dock" },
    { src: "/images/hammock-sound.jpg", alt: "Hammock under the deck with sound view" },
    { src: "/images/living-room-2.jpg", alt: "Living room with sound view through sliding door" },
    { src: "/images/living-room-1.jpg", alt: "Open-plan living area" },
    { src: "/images/living-room-3.jpg", alt: "Living room seating area" },
    { src: "/images/open-plan.jpg", alt: "Dining and living area" },
    { src: "/images/dining-kitchen-1.jpg", alt: "Dining area and kitchen" },
    { src: "/images/dining-kitchen-2.jpg", alt: "Dining and kitchen from second angle" },
    { src: "/images/kitchen-1.jpg", alt: "Fully equipped kitchen" },
    { src: "/images/kitchen-2.jpg", alt: "Kitchen prep area" },
    { src: "/images/kitchen-dining-wide.jpg", alt: "Wide view of kitchen and dining" },
    { src: "/images/bedroom-soundfront.jpg", alt: "Master bedroom with soundfront views" },
    { src: "/images/bedroom-bunks.jpg", alt: "Second bedroom with queen bed and bunks" },
    { src: "/images/bathroom-1.jpg", alt: "Bathroom" },
    { src: "/images/bathroom-2.jpg", alt: "Second bathroom" },
    { src: "/images/covered-porch.jpg", alt: "Covered porch entrance" },
  ],
};
