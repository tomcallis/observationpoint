import ical from "node-ical";
import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.VRBO_ICAL_URL;

  if (!url) {
    return NextResponse.json({ error: "VRBO_ICAL_URL is not set" }, { status: 500 });
  }

  try {
    const events = await ical.async.fromURL(url);
    const summary = Object.values(events).map((e: any) => ({
      type: e?.type,
      summary: e?.summary,
      start: e?.start,
      end: e?.end,
    }));
    return NextResponse.json({ count: summary.length, events: summary });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
