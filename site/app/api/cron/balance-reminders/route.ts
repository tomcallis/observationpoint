import { NextRequest, NextResponse } from "next/server";
import { listBookings, updateBookingStatus, insertBookingEvent } from "@/lib/db";
import { chargeBalanceOffSession, createBalanceSession } from "@/lib/stripe";
import { sendGuestBalanceDue, sendGuestPaidInFull } from "@/lib/email";
import { syncBookingToSheets } from "@/lib/sheets";

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

    if (daysUntil !== 30) continue;

    const balanceAmount = booking.total_price / 100 / 2;

    // ── Try automatic off-session charge first ──────────────────────────────
    if (booking.stripe_customer_id && booking.stripe_payment_method_id) {
      try {
        const { paymentIntentId } = await chargeBalanceOffSession({
          id: booking.id,
          customerId: booking.stripe_customer_id,
          paymentMethodId: booking.stripe_payment_method_id,
          balanceAmount,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          guestName: booking.guest_name,
        });

        await updateBookingStatus(booking.id, "paid_in_full", { balance_paid_at: "now" });
        await insertBookingEvent(booking.id, "deposit_paid", "paid_in_full", "cron", paymentIntentId);
        const updated = { ...booking, status: "paid_in_full" as const };
        await syncBookingToSheets(updated);

        try {
          await sendGuestPaidInFull({
            guestName: booking.guest_name,
            guestEmail: booking.guest_email,
            numGuests: booking.num_guests,
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            total: booking.total_price / 100,
          });
        } catch (err) {
          console.error(`[cron] paid-in-full email error for booking ${booking.id}:`, err);
        }

        console.log(`[cron] auto-charged balance for booking ${booking.id}`);
        processed++;
        continue;
      } catch (err) {
        // Card declined or other Stripe error — fall through to send a payment link
        console.error(`[cron] off-session charge failed for booking ${booking.id}:`, err);
      }
    }

    // ── Fallback: send a Checkout link (card not saved or charge declined) ──
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
      console.error(`[cron] Stripe fallback session error for booking ${booking.id}:`, err);
      continue;
    }

    await updateBookingStatus(booking.id, "balance_due", { stripe_balance_session_id: sessionId });
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
      console.error(`[cron] balance-due email error for booking ${booking.id}:`, err);
    }

    processed++;
  }

  return NextResponse.json({ ok: true, processed });
}
