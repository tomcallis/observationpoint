import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { getSetting } from "@/lib/db";

type WeeklyEntry = number | { price: number; label?: string };
type SeasonRate = { label: string; start: string; end: string; nightly: number; weekly: number; subtitle?: string };
interface SeasonalRatesV2 { bookingCutoffDate?: string; seasonsByYear: Record<string, SeasonRate[]> }
interface SeasonalRatesLegacy { bookingCutoffDate?: string; seasons: SeasonRate[] }

function readJSONFile(path: string) {
  try { return JSON.parse(readFileSync(path, "utf-8")); } catch { return null; }
}

function migrate(raw: SeasonalRatesV2 | SeasonalRatesLegacy | null): SeasonalRatesV2 {
  if (!raw) return { seasonsByYear: {} };
  if ("seasonsByYear" in raw && raw.seasonsByYear) return raw as SeasonalRatesV2;
  const legacy = raw as SeasonalRatesLegacy;
  const year = String(new Date().getFullYear());
  return { bookingCutoffDate: legacy.bookingCutoffDate, seasonsByYear: { [year]: legacy.seasons ?? [] } };
}

function resolveSeasons(data: SeasonalRatesV2, checkinYear?: number): SeasonRate[] {
  const years = Object.keys(data.seasonsByYear).sort();
  if (!years.length) return [];
  const target = String(checkinYear ?? new Date().getFullYear());
  if (data.seasonsByYear[target]) return data.seasonsByYear[target];
  // nearest available year
  const nearest = years.reduce((a, b) =>
    Math.abs(Number(a) - Number(target)) <= Math.abs(Number(b) - Number(target)) ? a : b
  );
  return data.seasonsByYear[nearest] ?? [];
}

export async function GET() {
  try {
    const [seasonalDB, weeklyDB] = await Promise.all([
      getSetting("seasonal-rates"),
      getSetting("weekly-prices"),
    ]);

    const raw = (seasonalDB as SeasonalRatesV2 | SeasonalRatesLegacy | null) ??
      readJSONFile(join(process.cwd(), "data", "seasonal-rates.json"));
    const seasonal = migrate(raw);

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
      seasons: resolveSeasons(seasonal),
      seasonsByYear: seasonal.seasonsByYear,
      bookingCutoffDate: seasonal.bookingCutoffDate ?? null,
      namedWeeks,
      weekly,
    });
  } catch {
    return NextResponse.json({ seasons: [], seasonsByYear: {}, bookingCutoffDate: null, namedWeeks: [], weekly: {} });
  }
}
