import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const SEASONAL_FILE = join(process.cwd(), "data", "seasonal-rates.json");
const WEEKLY_FILE = join(process.cwd(), "data", "weekly-prices.json");

export const revalidate = 900;

type WeeklyEntry = number | { price: number; label?: string };

interface SeasonalRates {
  bookingCutoffDate?: string;
  seasons: Array<{ label: string; start: string; end: string; nightly: number; weekly: number }>;
}

export async function GET() {
  try {
    const seasonal: SeasonalRates = JSON.parse(readFileSync(SEASONAL_FILE, "utf-8"));
    const weekly: Record<string, WeeklyEntry> = JSON.parse(readFileSync(WEEKLY_FILE, "utf-8"));

    const namedWeeks = Object.entries(weekly)
      .filter(([, v]) => typeof v === "object" && v !== null && (v as { label?: string }).label)
      .map(([date, v]) => ({
        date,
        label: (v as { price: number; label: string }).label,
        price: (v as { price: number; label: string }).price,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      seasons: seasonal.seasons ?? [],
      bookingCutoffDate: seasonal.bookingCutoffDate ?? null,
      namedWeeks,
    });
  } catch {
    return NextResponse.json({ seasons: [], bookingCutoffDate: null, namedWeeks: [] });
  }
}
