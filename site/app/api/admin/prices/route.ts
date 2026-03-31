import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { getSetting, setSetting } from "@/lib/db";

function readJSON(path: string) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  if (type === "seasonal") {
    const fromDB = await getSetting("seasonal-rates");
    if (fromDB !== null) return NextResponse.json(fromDB);
    return NextResponse.json(readJSON(join(process.cwd(), "data", "seasonal-rates.json")) ?? {});
  }

  // Default: weekly overrides
  const fromDB = await getSetting("weekly-prices");
  if (fromDB !== null) return NextResponse.json(fromDB);
  return NextResponse.json(readJSON(join(process.cwd(), "data", "weekly-prices.json")) ?? {});
}

export async function POST(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const body = await req.json();

  try {
    if (type === "seasonal") {
      if (typeof body !== "object" || body === null || !Array.isArray(body.seasons)) {
        return NextResponse.json({ error: "Expected { bookingCutoffDate, seasons }" }, { status: 400 });
      }
      await setSetting("seasonal-rates", body);
      return NextResponse.json({ ok: true });
    }

    // Default: weekly overrides — values can be numbers or { price, label } objects
    const validated: Record<string, number | { price: number; label: string }> = {};
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "number" && v > 0) {
        validated[k] = v;
      } else if (typeof v === "object" && v !== null) {
        const entry = v as { price?: unknown; label?: unknown };
        const price = typeof entry.price === "number" ? entry.price : 0;
        const label = typeof entry.label === "string" ? entry.label.trim() : "";
        if (price > 0) {
          validated[k] = label ? { price, label } : price;
        }
      }
    }
    await setSetting("weekly-prices", validated);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
