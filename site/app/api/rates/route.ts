import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { getSetting } from "@/lib/db";

type WeeklyEntry = number | { price: number; label?: string };

interface SeasonalRates {
  bookingCutoffDate?: string;
  seasons: Array<{ label: string; start: string; end: string; nightly: number; weekly: number }>;
}

function readJSONFile(path: string) {
  try { return JSON.parse(readFileSync(path, "utf-8")); } catch { return null; }
}

export async function GET() {
  try {
    const [seasonalDB, weeklyDB] = await Promise.all([
      getSetting("seasonal-rates"),
      getSetting("weekly-prices"),
    ]);

    const seasonal: SeasonalRates =
      (seasonalDB as SeasonalRates | null) ??
      readJSONFile(join(process.cwd(), "data", "seasonal-rates.json")) ?? {};

    const weekly: Record<string, WeeklyEntry> =
      (weeklyDB as Record<string, WeeklyEntry> | null) ??
      readJSONFile(join(process.cwd(), "data", "weekly-prices.json")) ?? {};

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
      weekly,
    });
  } catch {
    return NextResponse.json({ seasons: [], bookingCutoffDate: null, namedWeeks: [], weekly: {} });
  }
}
