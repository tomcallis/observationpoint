import Stripe from "stripe";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://observationpointnc.com";

export async function createDepositSession(booking: {
  id: string;
  guestEmail: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  depositAmount: number; // dollars (not cents)
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: booking.guestEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(booking.depositAmount * 100),
          product_data: {
            name: "Observation Point — 50% Deposit",
            description: `${booking.checkIn} → ${booking.checkOut} · ${booking.guestName}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { booking_id: booking.id, payment_type: "deposit" },
    success_url: `${BASE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/#booking`,
  });

  return { url: session.url!, sessionId: session.id };
}

export async function createBalanceSession(booking: {
  id: string;
  guestEmail: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  balanceAmount: number; // dollars
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: booking.guestEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(booking.balanceAmount * 100),
          product_data: {
            name: "Observation Point — Balance Payment",
            description: `${booking.checkIn} → ${booking.checkOut} · ${booking.guestName}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { booking_id: booking.id, payment_type: "balance" },
    success_url: `${BASE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/#booking`,
  });

  return { url: session.url!, sessionId: session.id };
}

export function constructWebhookEvent(body: string, signature: string): Stripe.Event {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
