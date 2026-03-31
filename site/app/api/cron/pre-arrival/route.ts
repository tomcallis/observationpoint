import { NextRequest, NextResponse } from "next/server";
import { listBookings } from "@/lib/db";
import { sendGuestPreArrival } from "@/lib/email";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Send to any booking that's paid in full and checks in exactly 7 days from now
  const bookings = await listBookings("paid_in_full");
  let processed = 0;

  for (const booking of bookings) {
    const checkIn = new Date(booking.check_in + "T12:00:00");
    const daysUntil = Math.round((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil !== 7) continue;

    try {
      await sendGuestPreArrival({
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        numGuests: booking.num_guests,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
      });
      processed++;
    } catch (err) {
      console.error(`[cron pre-arrival] email error for booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, processed });
}
