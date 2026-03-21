/**
 * OWNER-EDITABLE CONFIG
 * All content, rates, links, and amenity details live here.
 * Edit this file to update the site — no code knowledge required.
 */

export const property = {
  // ── Basic Info ─────────────────────────────────────────────────────────────
  name: "Observation Point",
  tagline: "Wake up on the Pamlico Sound. Watch the sun set over the water every night.",
  description:
    "A quiet, soundfront cottage on Hatteras Island with panoramic views of the Pamlico Sound from every room. Swim, fish, or launch a kayak from the private 30-foot dock. End every day watching the sky turn gold from the deck. No platform fees, no crowds — just the Outer Banks the way it used to be.",
  location: {
    address: "50184 Treasure Ct, Frisco, NC 27936",
    area: "Hatteras Island, Outer Banks",
    mapsEmbedUrl:
      "https://maps.google.com/maps?q=50184+Treasure+Ct,+Frisco,+NC+27936&z=16&output=embed",
    drivingDirections: [
      "From the north: Take US-158 to NC-12 S through Nags Head, Rodanthe, Waves, Salvo, Avon — continue south to Frisco.",
      "From the south (ferry): Take the Ocracoke–Hatteras ferry (free, ~45 min) to Hatteras, then head north on NC-12 to Frisco.",
    ],
    nearbyAttractions: [
      { name: "Cape Hatteras Lighthouse", distance: "5 miles" },
      { name: "Canadian Hole/Kite Point (windsurfing and kiteboarding)", distance: "6 miles" },
      { name: "Frisco Pier", distance: "1 mile" },
      { name: "Frisco Native American Museum", distance: "1 mile" },
      { name: "Graveyard of the Atlantic Museum", distance: "8 miles" },
      { name: "Hatteras Village", distance: "8 miles" },
      { name: "Ocracoke Ferry", distance: "10 miles" },
    ],
  },

  // ── Sleeps / Bedrooms ───────────────────────────────────────────────────────
  sleeps: 6,
  bedrooms: 2,
  bathrooms: 2,
  bedroomDetails: [
    {
      name: "Primary Bedroom",
      beds: "King bed · soundfront views · private en-suite bath",
    },
    {
      name: "Second Bedroom",
      beds: "Queen bed + twin bunks · private en-suite bath",
    },
  ],

  // ── Amenities ──────────────────────────────────────────────────────────────
  // Used in the Highlights grid and JSON-LD schema.
  highlights: [
    { label: "30-ft Private Dock" },
    { label: "Soundfront Deck" },
    { label: "Pamlico Sound Views" },
    { label: "Nightly Sunsets" },
    { label: "Sound Swimming" },
    { label: "Fishing Off Dock" },
    { label: "Hammock" },
    { label: "Open Floorplan" },
    { label: "Full Kitchen" },
    { label: "En-Suite Bathrooms" },
    { label: "High-Speed WiFi" },
    { label: "Central A/C" },
    { label: "Ocean Beach 10 min" },
  ],

  // ── Rates ──────────────────────────────────────────────────────────────────
  // Seasonal rate table. Dates are MM-DD (month-day, no year).
  // Seasons are checked top-to-bottom; the first match wins.
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

  // ── Payment ────────────────────────────────────────────────────────────────
  payment: {
    venmo: {
      handle: "@tomcallis",
    },
    check: {
      payableTo: "Tom Callis",
      mailingAddress: "50184 Treasure Ct, Frisco, NC 27936",
    },
    deposit: {
      percent: 50,
      balanceDueDays: 30,
      holdHours: 48, // hours to send deposit before dates are released
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
  vrboStats: {
    total: 101,
    excellent: 95,
  },
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

  // ── FAQ ────────────────────────────────────────────────────────────────────
  faq: [
    {
      question: "Is this the same property as VRBO listing #766628?",
      answer:
        "Yes — this is the official direct-booking site for Observation Point, the same property listed on VRBO as listing #766628. You can verify photos, reviews, and details at vrbo.com/766628. Booking direct simply means no VRBO service fee for either of us.",
    },
    {
      question: "Why book direct instead of through VRBO?",
      answer:
        "VRBO charges guests a service fee (typically 6–12% on top of the rental rate). When you book directly here, that fee disappears — same property, same host, same experience, just less money going to a platform middleman. You'll work directly with Tom, and any questions get answered faster.",
    },
    {
      question: "Is it safe to pay by Venmo or check?",
      answer:
        "Yes. This is a direct relationship between you and Tom Callis, the property owner. The process is the same as any private landlord arrangement: you request dates, Tom confirms availability, you pay a 50% deposit (via Venmo or check), and Tom sends a booking confirmation once payment clears. The property has 101 verified VRBO reviews — feel free to read them before booking.",
    },
    {
      question: "What is your cancellation policy?",
      answer:
        "Full refund if cancelled 60 or more days before check-in. 50% refund if cancelled 30–59 days before check-in. No refund within 30 days of check-in. Travel insurance is recommended for unexpected situations.",
    },
    {
      question: "Can I bring a boat?",
      answer:
        "Yes! The private dock is 30 feet long with approximately 2 feet of water depth and a sandy bottom — suitable for shallow-draft boats, kayaks, paddleboards, and small motorized craft. Guests are welcome to fish, swim, or launch from the dock. Please be aware of local boating regulations and NC Wildlife Resources Commission requirements.",
    },
    {
      question: "Is the property pet-friendly?",
      answer:
        "Pets may be allowed with prior written approval from the owner. Please reach out before booking to discuss your specific situation. Unauthorized pets may result in additional cleaning fees.",
    },
    {
      question: "What are check-in and check-out times?",
      answer:
        "Check-in is at 4:00 PM on your arrival Saturday. Check-out is at 10:00 AM on your departure Saturday. Early check-in or late check-out may be possible depending on the schedule — just ask.",
    },
    {
      question: "What amenities does the kitchen have?",
      answer:
        "The kitchen is fully equipped with new cookware, utensils, dishes, and glassware. There's a full-size refrigerator, stove, oven, microwave, dishwasher, and coffee maker. You'll have everything you need to cook real meals — most guests prefer it to eating out every night.",
    },
  ],

  // ── Guest Guidebook ────────────────────────────────────────────────────────
  // Accessible at /guidebook — shared with confirmed guests only.
  // ⚠️ UPDATE BEFORE EACH SEASON: door code, WiFi credentials.
  guidebook: {
    // Password guests use to access the guidebook page
    // Change this each season and include new password in booking confirmation email
    password: process.env.GUIDEBOOK_PASSWORD ?? "obx2025",

    checkIn: "4:00 PM",
    checkOut: "10:00 AM",

    // Fill these in before the season begins
    doorCode: process.env.GUIDEBOOK_DOOR_CODE ?? "", // e.g. "1234"
    wifiName: process.env.GUIDEBOOK_WIFI_NAME ?? "", // e.g. "ObsPoint_5G"
    wifiPassword: process.env.GUIDEBOOK_WIFI_PASSWORD ?? "", // e.g. "hatteras2025"

    houseRules: [
      "No smoking indoors or on enclosed portions of the deck.",
      "Pets by prior approval only — please contact Tom before bringing a pet.",
      "Maximum 6 guests at all times.",
      "Quiet hours: 10:00 PM – 8:00 AM. Please be mindful of neighbors.",
      "No parties or commercial events without written approval.",
      "Children must be supervised near the water and on the dock at all times.",
      "Please report any damage or maintenance issues promptly.",
      "Leave the property as you found it — dishes clean, trash bagged.",
    ],

    checkoutReminders: [
      "Dishes washed and put away (or in the dishwasher running).",
      "All trash in outdoor bins.",
      "Towels and linens left in the laundry room.",
      "All windows and doors locked.",
      "Thermostat set to 78°F (summer) or 65°F (off-season).",
      "Kayaks, paddleboards, and dock equipment secured.",
    ],

    emergencyContacts: [
      { label: "Emergency / 911", value: "911" },
      { label: "Dare County Non-Emergency", value: "(252) 473-3444" },
      { label: "Tom (owner)", value: "Contact via email" },
      { label: "Nearest hospital: The Outer Banks Hospital (Nags Head)", value: "(252) 449-4500" },
    ],

    localRecs: {
      eat: [
        { name: "Buxton Seafood", note: "Local institution — fresh catch, no frills" },
        { name: "Hatteras Sol Waterside Grill", note: "Outdoor dining with water views" },
        { name: "Sonny's Restaurant", note: "Classic OBX breakfast & lunch, Waves" },
        { name: "Orange Blossom Bakery", note: "Famous apple uglies — worth the detour, Buxton" },
        { name: "The Froggy Dog", note: "Casual bar & grill, Avon" },
      ],
      see: [
        { name: "Cape Hatteras Lighthouse", note: "Tallest brick lighthouse in the US · 5 miles" },
        { name: "Frisco Native American Museum", note: "Unique local history · 1 mile" },
        { name: "Graveyard of the Atlantic Museum", note: "Shipwreck history · Hatteras Village · 8 miles" },
        { name: "Pea Island National Wildlife Refuge", note: "Birding & beach access · 25 miles north" },
        { name: "Ocracoke Island", note: "Take the free ferry from Hatteras · ferry is 45 min" },
      ],
      doAndPlay: [
        { name: "Kiteboarding at Canadian Hole", note: "World-famous spot, 6 miles north" },
        { name: "Surfing", note: "Multiple breaks between Frisco and Buxton" },
        { name: "Frisco Mini Golf & Go Karts", note: "Great for families · 1 mile" },
        { name: "Fishing", note: "Off the dock, or surf fishing along the National Seashore" },
        { name: "Birdwatching", note: "Brown pelicans, ospreys, herons are regulars" },
      ],
    },
  },
};
