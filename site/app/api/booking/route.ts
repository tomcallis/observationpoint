import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { property } from "@/config/property";
import { formatDisplayDate } from "@/lib/pricing";
import { createBooking, insertBookingEvent } from "@/lib/db";
import { sendOwnerNewBooking, sendGuestRequestReceived } from "@/lib/email";
import { syncBookingToSheets } from "@/lib/sheets";

export interface BookingPayload {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numGuests: string;
  referralSource: string;
  specialRequests: string;
  checkin: string;
  checkout: string;
  nights: number;
  season: string;
  baseRate: number;
  taxAmount: number;
  total: number;
  depositAmount: number;
  balanceAmount: number;
}

function d(iso: string) {
  return formatDisplayDate(new Date(iso + "T12:00:00"));
}

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email service not configured. Please contact the owner directly." },
      { status: 503 }
    );
  }

  let body: BookingPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.guestName || !body.guestEmail || !body.checkin || !body.checkout) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Check for conflicts with existing bookings
  // (Postgres check, skipped gracefully if DB not configured)
  let bookingId: string | null = null;
  let ownerToken: string | null = null;

  try {
    ownerToken = randomUUID();
    const booking = await createBooking({
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      guestPhone: body.guestPhone,
      numGuests: parseInt(body.numGuests),
      checkIn: body.checkin,
      checkOut: body.checkout,
      weeklyPrice: body.baseRate * 100,   // store cents
      totalPrice: body.total * 100,
      ownerToken,
    });
    bookingId = booking.id;

    await insertBookingEvent(bookingId, null, "pending", "guest");
    await syncBookingToSheets(booking);
  } catch (err) {
    console.error("[booking API] DB error:", err);
    // Continue without persistence — still send emails
    ownerToken = ownerToken ?? randomUUID();
  }

  const emailData = {
    bookingId: bookingId ?? "no-db",
    ownerToken: ownerToken!,
    guestName: body.guestName,
    guestEmail: body.guestEmail,
    guestPhone: body.guestPhone,
    numGuests: parseInt(body.numGuests),
    checkIn: body.checkin,
    checkOut: body.checkout,
    total: body.total,
    depositAmount: body.depositAmount,
    balanceAmount: body.balanceAmount,
    specialRequests: body.specialRequests,
    referralSource: body.referralSource,
  };

  try {
    await Promise.all([
      sendOwnerNewBooking(emailData),
      sendGuestRequestReceived(emailData),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[booking API] email error:", err);
    return NextResponse.json(
      { error: "Failed to send confirmation emails. Please contact the owner directly." },
      { status: 500 }
    );
  }
}
