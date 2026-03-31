import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { getSetting, setSetting } from "@/lib/db";

function readGuidebookFile() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", "guidebook.json"), "utf-8"));
  } catch {
    return null;
  }
}

export async function GET() {
  const fromDB = await getSetting("guidebook");
  if (fromDB !== null) return NextResponse.json(fromDB);
  return NextResponse.json(readGuidebookFile() ?? {});
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    await setSetting("guidebook", body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
