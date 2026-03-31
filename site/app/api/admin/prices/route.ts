import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { getSetting, setSetting } from "@/lib/db";

const WEEKLY_FILE = join(process.cwd(), "data", "weekly-prices.json");
const SEASONAL_FILE = join(process.cwd(), "data", "seasonal-rates.json");

type SeasonRate = { label: string; start: string; end: string; nightly: number; weekly: number; subtitle?: string };
interface SeasonalRatesV2 { bookingCutoffDate?: string; seasonsByYear: Record<string, SeasonRate[]> }
interface SeasonalRatesLegacy { bookingCutoffDate?: string; seasons: SeasonRate[] }

function migrate(raw: SeasonalRatesV2 | SeasonalRatesLegacy | null): SeasonalRatesV2 {
  if (!raw) return { seasonsByYear: {} };
  if ("seasonsByYear" in raw && raw.seasonsByYear) return raw as SeasonalRatesV2;
  const legacy = raw as SeasonalRatesLegacy;
  const year = String(new Date().getFullYear());
  return { bookingCutoffDate: legacy.bookingCutoffDate, seasonsByYear: { [year]: legacy.seasons ?? [] } };
}

function readJSON(path: string) {
  try { return JSON.parse(readFileSync(path, "utf-8")); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  if (type === "seasonal") {
    const fromDB = await getSetting("seasonal-rates");
    if (fromDB !== null) return NextResponse.json(migrate(fromDB as SeasonalRatesV2 | SeasonalRatesLegacy));
    return NextResponse.json(migrate(readJSON(SEASONAL_FILE)));
  }

  const fromDB = await getSetting("weekly-prices");
  if (fromDB !== null) return NextResponse.json(fromDB);
  return NextResponse.json(readJSON(WEEKLY_FILE) ?? {});
}

export async function POST(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const body = await req.json();

  try {
    if (type === "seasonal") {
      if (typeof body !== "object" || body === null || typeof body.seasonsByYear !== "object" || body.seasonsByYear === null) {
        return NextResponse.json({ error: "Expected { bookingCutoffDate, seasonsByYear }" }, { status: 400 });
      }
      await setSetting("seasonal-rates", body);
      return NextResponse.json({ ok: true });
    }

    const validated: Record<string, number | { price: number; label: string }> = {};
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "number" && v > 0) {
        validated[k] = v;
      } else if (typeof v === "object" && v !== null) {
        const entry = v as { price?: unknown; label?: unknown };
        const price = typeof entry.price === "number" ? entry.price : 0;
        const label = typeof entry.label === "string" ? entry.label.trim() : "";
        if (price > 0) validated[k] = label ? { price, label } : price;
      }
    }
    await setSetting("weekly-prices", validated);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
