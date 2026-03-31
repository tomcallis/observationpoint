import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { constructWebhookEvent, retrievePaymentIntent } from "@/lib/stripe";
import {
  getBookingByDepositSession,
  getBookingByBalanceSession,
  saveDepositPaymentInfo,
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
        // Extract the saved payment method so we can auto-charge the balance later
        const customerId = typeof session.customer === "string" ? session.customer : null;
        let paymentMethodId: string | null = null;

        if (typeof session.payment_intent === "string") {
          try {
            const pi = await retrievePaymentIntent(session.payment_intent);
            paymentMethodId = typeof pi.payment_method === "string" ? pi.payment_method : null;
          } catch (err) {
            console.error("[stripe webhook] failed to retrieve payment intent:", err);
          }
        }

        await saveDepositPaymentInfo(booking.id, customerId, paymentMethodId);
        await insertBookingEvent(booking.id, "confirmed", "deposit_paid", "stripe", session.id);
        const updated = { ...booking, status: "deposit_paid" as const };
        await syncBookingToSheets(updated);

        console.log(`[stripe webhook] deposit paid for booking ${booking.id}, customer=${customerId}, pm=${paymentMethodId}`);
      }
    } else if (paymentType === "balance") {
      // Fallback path: guest paid via a Checkout link (card-on-file charge failed)
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
