import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { constructWebhookEvent } from "@/lib/stripe";
import {
  getBookingByDepositSession,
  getBookingByBalanceSession,
  updateBookingStatus,
  insertBookingEvent,
} from "@/lib/db";
import { sendGuestPaidInFull } from "@/lib/email";
import { syncBookingToSheets } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, sig);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentType = session.metadata?.payment_type;

    if (paymentType === "deposit") {
      const booking = await getBookingByDepositSession(session.id);
      if (booking) {
        await updateBookingStatus(booking.id, "deposit_paid", { deposit_paid_at: "now" });
        await insertBookingEvent(booking.id, "confirmed", "deposit_paid", "stripe", session.id);
        const updated = { ...booking, status: "deposit_paid" as const };
        await syncBookingToSheets(updated);
      }
    } else if (paymentType === "balance") {
      const booking = await getBookingByBalanceSession(session.id);
      if (booking) {
        await updateBookingStatus(booking.id, "paid_in_full", { balance_paid_at: "now" });
        await insertBookingEvent(booking.id, "balance_due", "paid_in_full", "stripe", session.id);
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
          console.error("[stripe webhook] paid-in-full email error:", err);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
