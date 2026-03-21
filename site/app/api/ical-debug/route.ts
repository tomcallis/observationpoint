import { getBlockedRanges } from "@/lib/ical";
import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.VRBO_ICAL_URL;

  if (!url) {
    return NextResponse.json({ error: "VRBO_ICAL_URL is not set" }, { status: 500 });
  }

  try {
    const ranges = await getBlockedRanges();
    return NextResponse.json({ url_configured: true, blocked_ranges: ranges, count: ranges.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
