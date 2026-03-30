import { NextRequest, NextResponse } from "next/server";
import { listBookings, getBookingEvents, updateBookingStatus, insertBookingEvent } from "@/lib/db";
import { syncBookingToSheets } from "@/lib/sheets";
import { sendGuestConfirmed, sendGuestDenied } from "@/lib/email";
import { createDepositSession } from "@/lib/stripe";
import type { BookingStatus } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://observationpointnc.com";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") as BookingStatus | null;
  const bookings = await listBookings(status ?? undefined);

  // Attach events to each booking
  const withEvents = await Promise.all(
    bookings.map(async (b) => ({
      ...b,
      events: await getBookingEvents(b.id),
    }))
  );

  return NextResponse.json(withEvents);
}

// Admin confirm/deny via POST (same logic as token links, for use from admin UI)
export async function POST(req: NextRequest) {
  const { action, bookingId } = await req.json();

  const bookings = await listBookings();
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (booking.status !== "pending") return NextResponse.json({ error: "Already actioned" }, { status: 409 });

  if (action === "confirm") {
    const depositAmount = booking.total_price / 100 / 2;
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
      console.error("[admin confirm] Stripe error:", err);
    }

    await updateBookingStatus(booking.id, "confirmed", { stripe_deposit_session_id: sessionId });
    await insertBookingEvent(booking.id, "pending", "confirmed", "owner");
    await syncBookingToSheets({ ...booking, status: "confirmed" });

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
      console.error("[admin confirm] email error:", err);
    }

    return NextResponse.json({ ok: true, action: "confirmed" });
  }

  if (action === "deny") {
    await updateBookingStatus(booking.id, "denied");
    await insertBookingEvent(booking.id, "pending", "denied", "owner");
    await syncBookingToSheets({ ...booking, status: "denied" });

    try {
      await sendGuestDenied({
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
      });
    } catch (err) {
      console.error("[admin deny] email error:", err);
    }

    return NextResponse.json({ ok: true, action: "denied" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
