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

  // Create a Stripe Customer so the card can be saved for the automatic balance charge
  const customer = await stripe.customers.create({
    email: booking.guestEmail,
    name: booking.guestName,
    metadata: { booking_id: booking.id },
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customer.id,
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
    payment_intent_data: {
      setup_future_usage: "off_session", // saves card for automatic balance charge
    },
    metadata: { booking_id: booking.id, payment_type: "deposit" },
    success_url: `${BASE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/#booking`,
  });

  if (!session.url) throw new Error("Stripe returned a deposit session with no URL");
  return { url: session.url, sessionId: session.id };
}

// Automatically charges the saved card — no guest action required
export async function chargeBalanceOffSession(booking: {
  id: string;
  customerId: string;
  paymentMethodId: string;
  balanceAmount: number; // dollars
  checkIn: string;
  checkOut: string;
  guestName: string;
}): Promise<{ paymentIntentId: string }> {
  const stripe = getStripe();

  const pi = await stripe.paymentIntents.create({
    amount: Math.round(booking.balanceAmount * 100),
    currency: "usd",
    customer: booking.customerId,
    payment_method: booking.paymentMethodId,
    confirm: true,
    off_session: true,
    description: `Observation Point — Balance Payment · ${booking.checkIn} → ${booking.checkOut}`,
    metadata: { booking_id: booking.id, payment_type: "balance" },
  });

  return { paymentIntentId: pi.id };
}

// Fallback: send a Checkout link if the off-session charge fails (e.g. card declined)
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

  if (!session.url) throw new Error("Stripe returned a balance session with no URL");
  return { url: session.url, sessionId: session.id };
}

export async function retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
  return getStripe().paymentIntents.retrieve(id);
}

export function constructWebhookEvent(body: string, signature: string): Stripe.Event {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
