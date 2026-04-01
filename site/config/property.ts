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
    "A quiet, soundfront cottage on Hatteras Island with panoramic views of the Pamlico Sound. Swim, fish, or launch a kayak from the private 30-foot dock. End every day watching the sky turn gold from the deck. Just the way the Outer Banks should be.",
  location: {
    address: "50184 Treasure Ct, Frisco, NC 27936",
    area: "Hatteras Island, Outer Banks",
    mapsEmbedUrl:
      "https://maps.google.com/maps?q=50184+Treasure+Ct,+Frisco,+NC+27936&z=16&output=embed",
    drivingDirections: [
      "From the north: Head south on NC 12 through Nags Head, Rodanthe, Waves, Salvo, Avon — continue south to Frisco.",
      "From the south (ferry): Take the Ocracoke–Hatteras ferry (free, ~70 min) to Hatteras, then head north on NC-12 to Frisco. [Ferry schedule →](https://www.ncdot.gov/travel-maps/ferry-tickets-services/routes/Pages/default.aspx)",
    ],
    nearbyAttractions: [
      { name: "Buxton Seafood Market", distance: "2 miles" },
      { name: "Conner's Supermarket", distance: "4 miles" },
      { name: "Frisco Rod and Gun", distance: "4 miles" },
      { name: "Orange Blossom Bakery", distance: "4 miles" },
      { name: "Beach Access Ramp 49", distance: "5 miles" },
      { name: "Frisco Beach", distance: "5 miles" },
      { name: "Cape Hatteras Lighthouse", distance: "6 miles" },
      { name: "Haulover Day Use Area (Canadian Hole)", distance: "7 miles" },
      { name: "Graveyard of the Atlantic Museum", distance: "9 miles" },
      { name: "Hatteras Ferry Terminal", distance: "9 miles" },
      { name: "Food Lion", distance: "10 miles" },
      { name: "Avon Pier Fishing Pier", distance: "11 miles" },
    ],
  },

  // ── Sleeps / Bedrooms ───────────────────────────────────────────────────────
  sleeps: 6,
  bedrooms: 2,
  bathrooms: 2,
  bedroomDetails: [
    {
      name: "Primary Bedroom",
      beds: "King bed · soundfront views · en-suite bath",
      images: [
        { src: "/images/front-bedroom_king_2.jpeg", alt: "Primary bedroom with king bed" },
      ],
    },
    {
      name: "Second Bedroom",
      beds: "Queen bed + twin bunks · en-suite bath",
      images: [
        { src: "/images/bedroom-bunks.jpg", alt: "Second bedroom with queen bed and bunks" },
      ],
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
    { label: "Full Kitchen" },
    { label: "En-Suite Bathrooms" },
    { label: "High-Speed WiFi" },
    { label: "Central A/C" },
    { label: "Beach Access 10 min" },
  ],

  // ── Rates ──────────────────────────────────────────────────────────────────
  // Seasonal rate table. Dates are MM-DD (month-day, no year).
  // Seasons are checked top-to-bottom; the first match wins.
  // Holiday week overrides are stored in data/weekly-prices.json.
  seasonalRates: [
    {
      label: "Summer",
      start: "06-01",
      end: "09-01",
      nightly: 364,
      weekly: 2550,
    },
    {
      label: "Spring",
      start: "04-01",
      end: "06-01",
      nightly: 225,
      weekly: 1575,
    },
    {
      label: "Fall",
      start: "09-01",
      end: "11-01",
      nightly: 200,
      weekly: 1400,
    },
    {
      label: "Winter",
      start: "11-01",
      end: "04-01",
      nightly: 150,
      weekly: 1050,
    },
  ],

  // Display-only rate table (shown on the website). Order controls row order.
  // All rates are pre-tax. NC sales & occupancy tax (~12.75%) is added at checkout.
  rateTable: [
    { label: "Winter", subtitle: "Jan–Mar, Nov–Dec", weekly: 1050 },
    { label: "Spring", subtitle: "Apr–May", weekly: 1575 },
    { label: "Memorial Day Week", subtitle: null as null, weekly: 2075 },
    { label: "Summer", subtitle: "Jun–Aug", weekly: 2550 },
    { label: "July 4th Week", subtitle: null as null, weekly: 2750 },
    { label: "Fall", subtitle: "Sep–Oct", weekly: 1400 },
    { label: "Labor Day Week", subtitle: null as null, weekly: 2075 },
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
      mailingAddress: "296 Apple Blossom Lane, Boone, NC 28607",
    },
    deposit: {
      percent: 50,
      balanceDueDays: 45,
      fullPaymentThresholdDays: 45, // if check-in is this many days away or less, full payment is due upfront
      holdDays: 5, // days guest has to mail deposit check before dates are released
    },
    cancellationPolicy:
      "Any cancellations must be submitted in writing (email is acceptable) and are subject to a $50 cancellation fee. No refund will be made unless the property is re-rented for the same price and time period. If re-rented for a lesser amount, you will receive a refund for the difference. We cannot offer credits or refunds for emergencies including weather events, illness, or job loss — travel insurance is strongly recommended.",
  },

  // ── Contact ────────────────────────────────────────────────────────────────
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "tom.callis@gmail.com",
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

  // ── Hero Image ─────────────────────────────────────────────────────────────
  heroImage: { src: "/images/dock-chairs.jpg", alt: "Adirondack chairs on the dock" },

  // ── Gallery Images ─────────────────────────────────────────────────────────
  images: [
    { src: "/images/living-room-2.jpg", alt: "Living room with sound view through sliding door" },
    { src: "/images/dock-chairs.jpg", alt: "Adirondack chairs on the dock" },
    { src: "/images/deck-sound-view.jpg", alt: "Covered deck looking over the dock and Pamlico Sound" },
    { src: "/images/dock-sound-wide.jpg", alt: "Private dock on the Pamlico Sound" },
    { src: "/images/hammock-sound.jpg", alt: "Hammock under the deck with sound view" },
    { src: "/images/living-room-1.jpg", alt: "Open-plan living area" },
    { src: "/images/living-room-3.jpg", alt: "Living room seating area" },
    { src: "/images/open-plan.jpg", alt: "Dining and living area" },
    { src: "/images/dining-kitchen-1.jpg", alt: "Dining area and kitchen" },
    { src: "/images/dining-kitchen-2.jpg", alt: "Dining and kitchen from second angle" },
    { src: "/images/kitchen-1.jpg", alt: "Fully equipped kitchen" },
    { src: "/images/kitchen-2.jpg", alt: "Kitchen prep area" },
    { src: "/images/kitchen-dining-wide.jpg", alt: "Wide view of kitchen and dining" },
    { src: "/images/front-bedroom_king_1.jpeg", alt: "Primary bedroom with king bed" },
    { src: "/images/front-bedroom_king_2.jpeg", alt: "Primary bedroom, second view" },
    { src: "/images/bedroom-bunks.jpg", alt: "Second bedroom with queen bed and bunks" },
    { src: "/images/bathroom-1.jpg", alt: "Bathroom" },
    { src: "/images/bathroom-2.jpg", alt: "Second bathroom" },
    { src: "/images/covered-porch.jpg", alt: "Covered porch entrance" },
    { src: "/images/floor-plan.png", alt: "Observation Point floor plan" },
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
        "VRBO charges guests a service fee (typically 6–12% on top of the rental rate). When you book directly here, that fee disappears — same property, same host, same experience, just less money going to a platform middleman. You'll work directly with Tom and Miranda, the owners.",
    },
    {
      question: "How does payment work?",
      answer:
        "We accept personal checks. Once Tom confirms your booking, you'll receive an email with instructions to mail a 50% deposit check to secure your dates. The remaining 50% balance is due 45 days before check-in — you'll receive a reminder. If you're booking within 45 days of check-in, full payment is due upfront. Checks are made payable to Tom Callis, 296 Apple Blossom Lane, Boone, NC 28607.",
    },
    {
      question: "Are linens included?",
      answer:
        "Linens are not provided — please bring your own sheets, pillowcases, bath towels, and beach towels. Comforters, blankets, and pillows are provided. The property has one king bed, one queen bed, and two twin beds. You can also rent linens with delivery and pickup from Money$Worth Linen Rentals:",
      links: [
        { text: "Money$Worth Linen Rentals", url: "https://www.rentbeachequipment.com/?destination=OBX" },
      ],
    },
    {
      question: "Is there an age requirement?",
      answer:
        "Yes. The primary renter must be at least 25 years of age and must be present for the duration of the stay.",
    },
    {
      question: "What is your cancellation policy?",
      answer:
        "Any cancellations must be submitted in writing (email is acceptable) and are subject to a $50 cancellation fee. No refund will be made unless the property is re-rented for the same price and time period. If re-rented for a lesser amount, you will receive a refund for the difference. We cannot offer credits or refunds for emergencies including weather events, illness, or job loss — travel insurance is strongly recommended.",
    },
    {
      question: "Can I bring a boat?",
      answer:
        "Yes! The private dock is 30 feet long with approximately 2 feet of water depth and a sandy bottom — suitable for shallow-draft boats, kayaks, paddleboards, and small motorized craft. Guests are welcome to fish, swim, or launch from the dock.",
    },
    {
      question: "Can I rent kayaks or paddleboards?",
      answer:
        "The property doesn't include water sports equipment, but Ocean Atlantic Rentals delivers right to the property — kayaks, paddleboards, bikes, beach chairs, umbrellas, and more, with pickup included:",
      links: [
        { text: "Ocean Atlantic Rentals", url: "https://www.oceanatlanticrentals.com/" },
      ],
    },
    {
      question: "Is the property pet-friendly?",
      answer:
        "No, pets are not permitted at Observation Point.",
    },
    {
      question: "What are check-in and check-out times?",
      answer:
        "Check-in is at 3:30 PM on your arrival Saturday. Check-out is at 10:00 AM on your departure Saturday. The key is in a lockbox under the house — it's mounted to a piling between the stairs and the outdoor shower. Early check-in or late check-out may be possible depending on the schedule — just ask.",
    },
    {
      question: "What should I bring?",
      answer:
        "Observation Point does not provide linens or consumables, so please plan to bring: sheets (one king bed, one queen bed, and two twin beds), pillowcases, bath towels, beach towels, garbage bags, toilet paper, paper towels, dish detergent, laundry detergent, all-purpose cleaner, and bath soap and toiletries. Linens can be rented with delivery and pickup from Money$Worth Linen Rentals:",
      links: [
        { text: "Money$Worth Linen Rentals", url: "https://www.rentbeachequipment.com/?destination=OBX" },
      ],
    },
    {
      question: "How do I reach the owners?",
      answer:
        "You can reach Tom at tom.callis@gmail.com or Miranda at 252-996-0578.",
    },
    {
      question: "What amenities does the kitchen have?",
      answer:
        "The kitchen is fully equipped with cookware, utensils, dishes, and glassware. There's a full-size refrigerator, stove, oven, microwave, dishwasher, and coffee maker (basket-style and a Keurig).",
    },
  ],

  // ── Guest Guidebook ────────────────────────────────────────────────────────
  // ⚠️ UPDATE BEFORE EACH SEASON: lockboxCode, wifiName, wifiPassword.
  guidebook: {
    // Lockbox is mounted to a piling between the stairs and the outdoor shower
    lockboxCode: process.env.LOCKBOX_CODE ?? "1870",

    wifiName: process.env.WIFI_NAME ?? "ObservationPoint",
    wifiPassword: process.env.WIFI_PASSWORD ?? "XXXXXXXXXX",

    checkIn: "3:30 PM",
    checkOut: "10:00 AM",

    whatToBring: [
      "Sheets (one king bed, one queen bed, and two twin beds)",
      "Pillow cases",
      "Bath towels",
      "Beach towels",
      "Garbage bags",
      "Toilet paper",
      "Paper towels",
      "Dish detergent",
      "Laundry detergent",
      "All-purpose cleaner",
      "Bath soap and toiletries",
    ],

    caretakerName: "Jennie",
    caretakerPhone: "252-305-2415",
    ownerPhone: "252-996-0578",

    houseRules: [
      "No smoking indoors or on enclosed portions of the deck.",
      "No pets permitted.",
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
