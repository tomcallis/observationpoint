import { NextRequest, NextResponse } from "next/server";
import {
  getBookingByToken,
  updateBookingStatus,
  insertBookingEvent,
} from "@/lib/db";
import { sendGuestConfirmed } from "@/lib/email";
import { createDepositSession } from "@/lib/stripe";
import { syncBookingToSheets } from "@/lib/sheets";
import { formatUSD } from "@/lib/pricing";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://observationpointnc.com";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  console.log("[confirm] called, token present:", !!token);

  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/admin?error=invalid-token`);
  }

  let booking;
  try {
    booking = await getBookingByToken(token);
  } catch (err) {
    console.error("[confirm] DB lookup failed:", err);
    return NextResponse.redirect(`${BASE_URL}/admin?error=db-error`);
  }

  if (!booking) {
    console.log("[confirm] token not found in DB:", token.slice(0, 8) + "...");
    return NextResponse.redirect(`${BASE_URL}/admin?error=not-found`);
  }
  if (booking.status !== "pending") {
    console.log("[confirm] booking already actioned:", booking.status);
    return NextResponse.redirect(`${BASE_URL}/admin?error=already-actioned`);
  }

  // Create Stripe deposit session
  const depositAmount = booking.total_price / 100 / 2; // dollars
  let depositUrl = `${BASE_URL}/admin`;
  let sessionId: string | null = null;

  try {
    const session = await createDepositSession({
      id: booking.id,
      guestEmail: booking.guest_email,
      guestName: booking.guest_name,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      depositAmount,
    });
    depositUrl = session.url;
    sessionId = session.sessionId;
  } catch (err) {
    console.error("[confirm] Stripe session creation failed:", err);
    // depositUrl stays as admin fallback — email will show broken link
    // Check STRIPE_SECRET_KEY env var if this keeps happening
  }

  // Update DB
  await updateBookingStatus(booking.id, "confirmed", {
    stripe_deposit_session_id: sessionId,
  });
  await insertBookingEvent(booking.id, "pending", "confirmed", "owner");

  // Sync to Sheets
  const updated = { ...booking, status: "confirmed" as const };
  await syncBookingToSheets(updated);

  // Email guest
  try {
    await sendGuestConfirmed({
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      numGuests: booking.num_guests,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      total: booking.total_price / 100,
      depositAmount,
      balanceAmount: booking.total_price / 100 - depositAmount,
      depositUrl,
    });
  } catch (err) {
    console.error("[confirm] email error:", err);
  }

  return NextResponse.redirect(`${BASE_URL}/admin?confirmed=${booking.id}`);
}
