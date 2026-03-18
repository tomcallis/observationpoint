import { property } from "@/config/property";

export interface PriceBreakdown {
  season: string;
  baseRate: number;
  taxAmount: number;
  total: number;
  nights: number;
}

export function getPriceForStay(
  checkin: Date,
  checkout: Date,
  weeklyOverrides: Record<string, number> = {}
): PriceBreakdown {
  const nights = Math.round(
    (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)
  );
  const checkinKey = formatDateKey(checkin);

  // Manual override for this specific check-in date (weekly stays only)
  if (nights === 7 && weeklyOverrides[checkinKey] !== undefined) {
    const baseRate = weeklyOverrides[checkinKey];
    const taxAmount = Math.round(baseRate * property.rates.taxRate);
    return { season: "Custom Rate", baseRate, taxAmount, total: baseRate + taxAmount, nights };
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

export function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
