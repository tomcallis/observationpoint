import { NextRequest, NextResponse } from "next/server";
import { listBookings, updateBookingStatus, insertBookingEvent } from "@/lib/db";
import { sendGuestBalanceDue } from "@/lib/email";
import { syncBookingToSheets } from "@/lib/sheets";
import { property } from "@/config/property";

const { balanceDueDays } = property.payment.deposit;

export async function GET(req: NextRequest) {
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

    if (daysUntil !== balanceDueDays) continue;

    const balanceAmount = booking.total_price / 100 / 2;

    await updateBookingStatus(booking.id, "balance_due");
    await insertBookingEvent(booking.id, "deposit_paid", "balance_due", "cron");
    await syncBookingToSheets({ ...booking, status: "balance_due" });

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
      });
      await insertBookingEvent(booking.id, "balance_due", "balance_due", "email", "Guest: Balance Due Reminder");
    } catch (err) {
      console.error(`[cron] email error for booking ${booking.id}:`, err);
    }

    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
