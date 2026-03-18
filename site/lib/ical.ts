import ical from "node-ical";

export interface BlockedRange {
  start: string; // ISO date string "YYYY-MM-DD"
  end: string;
}

/**
 * Fetch the VRBO iCal feed and return blocked date ranges.
 * Called server-side only; VRBO_ICAL_URL never reaches the browser.
 */
export async function getBlockedRanges(): Promise<BlockedRange[]> {
  const url = process.env.VRBO_ICAL_URL;

  if (!url) {
    // No URL configured — return empty so the calendar still renders
    return [];
  }

  try {
    const events = await ical.async.fromURL(url);
    const ranges: BlockedRange[] = [];

    for (const event of Object.values(events)) {
      if (!event || event.type !== "VEVENT") continue;
      if (!event.start || !event.end) continue;

      ranges.push({
        start: toDateString(event.start),
        end: toDateString(event.end),
      });
    }

    return ranges;
  } catch (err) {
    console.error("Failed to fetch iCal feed:", err);
    return [];
  }
}

function toDateString(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().split("T")[0];
}
