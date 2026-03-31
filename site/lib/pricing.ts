import { property } from "@/config/property";

export interface PriceBreakdown {
  season: string;
  baseRate: number;
  taxAmount: number;
  total: number;
  nights: number;
}

type WeeklyOverride = number | { price: number; label?: string };

export function getPriceForStay(
  checkin: Date,
  checkout: Date,
  weeklyOverrides: Record<string, WeeklyOverride> = {}
): PriceBreakdown {
  const nights = Math.round(
    (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)
  );
  const checkinKey = formatDateKey(checkin);

  // Manual override for this specific check-in date (weekly stays only)
  if (nights === 7 && weeklyOverrides[checkinKey] !== undefined) {
    const override = weeklyOverrides[checkinKey];
    const baseRate = typeof override === "number" ? override : override.price;
    const season = typeof override === "object" && override.label ? override.label : "Custom Rate";
    const taxAmount = Math.round(baseRate * property.rates.taxRate);
    return { season, baseRate, taxAmount, total: baseRate + taxAmount, nights };
  }

  // Find matching seasonal rate
  const mmdd = checkinKey.slice(5); // "MM-DD"
  let matched = property.seasonalRates[property.seasonalRates.length - 1];
  for (const s of property.seasonalRates) {
    if (mmdd >= s.start && mmdd < s.end) { matched = s; break; }
  }

  const baseRate = nights === 7 ? matched.weekly : matched.nightly * nights;
  const taxAmount = Math.round(baseRate * property.rates.taxRate);
  return { season: matched.label, baseRate, taxAmount, total: baseRate + taxAmount, nights };
}

export function formatDateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function buildAgreementText(b: {
  checkIn: string; // ISO date
  checkOut: string;
  baseRate: number;
  taxAmount: number;
  total: number;
}): string {
  const checkinDisplay = formatDisplayDate(new Date(b.checkIn + "T12:00:00"));
  const checkoutDisplay = formatDisplayDate(new Date(b.checkOut + "T12:00:00"));
  return `THIS IS A VACATION RENTAL AGREEMENT UNDER THE NORTH CAROLINA VACATION RENTAL ACT. THE RIGHTS AND OBLIGATIONS OF THE PARTIES TO THIS AGREEMENT ARE DEFINED BY LAW AND INCLUDE UNIQUE PROVISIONS PERMITTING THE DISBURSEMENT OF RENT PRIOR TO TENANCY AND EXPEDITED EVICTION OF TENANTS. YOUR SIGNATURE ON THIS AGREEMENT, OR PAYMENT OF MONEY OR TAKING POSSESSION OF THE PROPERTY AFTER RECEIPT OF THE AGREEMENT, IS EVIDENCE OF YOUR ACCEPTANCE OF THE AGREEMENT AND YOUR INTENT TO USE THIS PROPERTY FOR A VACATION RENTAL.

The Owner hereby rents to Traveler, and Traveler hereby rents from Owner, the vacation cottage known as Observation Point located at 50184 Treasure Court, Frisco, NC 27936 ("cottage") on the terms of this Agreement.

Owners: Tom and Miranda Callis · Phone: 252-996-0578 · Email: tom.callis@gmail.com

1. TERM AND CHARGES
Check-in: ${checkinDisplay} at 3:30 PM
Check-out: ${checkoutDisplay} at 10:00 AM
Weekly rental rate: ${formatUSD(b.baseRate)}
NC and Dare County tax (12.75%): ${formatUSD(b.taxAmount)}
Total Due: ${formatUSD(b.total)}

2. CANCELLATION
Any cancellations must be submitted in writing (email is acceptable) and are subject to a $50 cancellation fee. No refund will be made unless the property is re-rented for the same price and time period. If re-rented for a lesser amount, you will receive a refund for the difference. We cannot offer credits or refunds for emergencies including weather events, illness, or job loss — travel insurance is strongly recommended.

3. HOUSE RULES
Pets: No pets permitted.
Smoking: No smoking or vaping inside the cottage.
Parking: Do not park or drive on septic field (marked by posts and rope).
Grills: No grill use on deck.
Linens: Sheets, pillowcases, bath towels, and beach towels are NOT provided — please bring your own. Comforters, blankets, and pillows are provided.

4. CHECK-IN AND CHECK-OUT
Check-in begins at 3:30 PM. Access instructions will be provided before arrival. Report any cleaning issues within 2 hours of check-in.
Vacate by 10:00 AM. Before leaving: start the dishwasher, remove all food and drinks, return furniture to original positions, bag trash and roll the cart to the street, clean the grill if used. Report any damage or maintenance issues.

5. TRAVELER DUTIES AND OCCUPANCY
The primary renter must be at least 25 years of age and must be present for the duration of the stay. Traveler agrees to keep the cottage clean and safe and to comply with all obligations under the NC Vacation Rental Act. Maximum occupancy is 6 guests at all times. Traveler agrees not to use the cottage for any unlawful purpose. Any material breach — including holding over, failure to pay rent, or obtaining possession by fraud — may result in expedited eviction under Article 4 of the NC Vacation Rental Act (NCGS 42A).

6. MANDATORY EVACUATION
If authorities order a mandatory evacuation, Traveler must comply and is entitled to a prorated refund for nights unable to occupy the cottage. Travel interruption insurance is available through providers such as Allianz (allianztravelinsurance.com).

7. OWNER DUTIES AND INDEMNIFICATION
Owner will provide the cottage in fit and habitable condition and make good faith efforts to repair inoperative equipment promptly. Owner or agents may enter the cottage for repairs, maintenance, or other necessary purposes. If Owner cannot provide the cottage in habitable condition at the time of occupancy, all payments will be refunded. Traveler agrees to indemnify and hold harmless the Owner from liability for personal injury or property damage unless caused by the negligent or willful act of the Owner. Owner will conduct all activities without regard to race, religion, sex, national origin, handicap, or familial status.

PAYMENT
Payment is by personal check. A 50% deposit check must be mailed within 5 days of booking confirmation to secure your dates. The remaining 50% balance is due 45 days before check-in. If booking within 45 days of check-in, full payment is due at confirmation. Checks payable to Tom Callis, mailed to 296 Apple Blossom Lane, Boone, NC 28607.

By checking the box below, Traveler acknowledges having read and agreed to this Vacation Rental Agreement.`;
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
