import { NextRequest, NextResponse } from "next/server";
import { listBookings, updateBookingStatus, insertBookingEvent } from "@/lib/db";
import { createBalanceSession } from "@/lib/stripe";
import { sendGuestBalanceDue } from "@/lib/email";
import { syncBookingToSheets } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  // Protect the endpoint with a secret
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = await listBookings("deposit_paid");
  let processed = 0;

  for (const booking of bookings) {
    const checkIn = new Date(booking.check_in + "T12:00:00");
    const daysUntil = Math.round((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil !== 30) continue;

    const balanceAmount = booking.total_price / 100 / 2;
    let balanceUrl = "";
    let sessionId: string | null = null;

    try {
      const session = await createBalanceSession({
        id: booking.id,
        guestEmail: booking.guest_email,
        guestName: booking.guest_name,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        balanceAmount,
      });
      balanceUrl = session.url;
      sessionId = session.sessionId;
    } catch (err) {
      console.error(`[cron] Stripe error for booking ${booking.id}:`, err);
      continue;
    }

    await updateBookingStatus(booking.id, "balance_due", {
      stripe_balance_session_id: sessionId,
    });
    await insertBookingEvent(booking.id, "deposit_paid", "balance_due", "cron");
    const updated = { ...booking, status: "balance_due" as const };
    await syncBookingToSheets(updated);

    try {
      await sendGuestBalanceDue({
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        numGuests: booking.num_guests,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        total: booking.total_price / 100,
        depositAmount: booking.total_price / 100 / 2,
        balanceAmount,
        balanceUrl,
      });
    } catch (err) {
      console.error(`[cron] email error for booking ${booking.id}:`, err);
    }

    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
