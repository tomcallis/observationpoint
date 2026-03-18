import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_FILE = join(process.cwd(), "data", "weekly-prices.json");

function readPrices(): Record<string, number> {
  try {
    return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export async function GET() {
  return NextResponse.json(readPrices());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate: all values must be positive numbers
    const validated: Record<string, number> = {};
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "number" && v > 0) {
        validated[k] = v;
      }
    }
    writeFileSync(DATA_FILE, JSON.stringify(validated, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
