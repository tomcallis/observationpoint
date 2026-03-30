import { NextResponse } from "next/server";
import ical from "node-ical";

export interface VrboEvent {
  uid: string;
  summary: string;
  start: string;
  end: string;
}

export async function GET() {
  const url = process.env.VRBO_ICAL_URL;
  if (!url) {
    return NextResponse.json({ events: [], error: "VRBO_ICAL_URL not configured" });
  }

  try {
    const data = await ical.fromURL(url);
    const events: VrboEvent[] = [];

    for (const key of Object.keys(data)) {
      const event = data[key];
      if (!event || event.type !== "VEVENT") continue;
      events.push({
        uid: String(event.uid ?? key),
        summary: String(event.summary ?? "VRBO Booking"),
        start: event.start instanceof Date ? event.start.toISOString().split("T")[0] : String(event.start),
        end: event.end instanceof Date ? event.end.toISOString().split("T")[0] : String(event.end),
      });
    }

    // Sort by start date
    events.sort((a, b) => a.start.localeCompare(b.start));
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[vrbo-feed]", err);
    return NextResponse.json({ events: [], error: "Failed to fetch VRBO feed" });
  }
}
