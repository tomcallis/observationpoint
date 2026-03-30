import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const WEEKLY_FILE = join(process.cwd(), "data", "weekly-prices.json");
const SEASONAL_FILE = join(process.cwd(), "data", "seasonal-rates.json");

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
    return NextResponse.json(readJSON(SEASONAL_FILE) ?? []);
  }

  // Default: weekly overrides
  return NextResponse.json(readJSON(WEEKLY_FILE) ?? {});
}

export async function POST(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const body = await req.json();

  try {
    if (type === "seasonal") {
      // Validate: array of season objects
      if (!Array.isArray(body)) {
        return NextResponse.json({ error: "Expected array" }, { status: 400 });
      }
      writeFileSync(SEASONAL_FILE, JSON.stringify(body, null, 2));
      return NextResponse.json({ ok: true });
    }

    // Default: weekly overrides — validate all values are positive numbers
    const validated: Record<string, number> = {};
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "number" && v > 0) {
        validated[k] = v;
      }
    }
    writeFileSync(WEEKLY_FILE, JSON.stringify(validated, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
