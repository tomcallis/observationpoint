import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const GUIDEBOOK_FILE = join(process.cwd(), "data", "guidebook.json");

function readGuidebook() {
  try {
    return JSON.parse(readFileSync(GUIDEBOOK_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export async function GET() {
  return NextResponse.json(readGuidebook() ?? {});
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    writeFileSync(GUIDEBOOK_FILE, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
