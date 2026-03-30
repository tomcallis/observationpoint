import { NextRequest, NextResponse } from "next/server";
import { getBookingByToken, updateBookingStatus, insertBookingEvent } from "@/lib/db";
import { sendGuestDenied } from "@/lib/email";
import { syncBookingToSheets } from "@/lib/sheets";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://observationpointnc.com";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/admin?error=invalid-token`);
  }

  const booking = await getBookingByToken(token);
  if (!booking) {
    return NextResponse.redirect(`${BASE_URL}/admin?error=not-found`);
  }
  if (booking.status !== "pending") {
    return NextResponse.redirect(`${BASE_URL}/admin?error=already-actioned`);
  }

  await updateBookingStatus(booking.id, "denied");
  await insertBookingEvent(booking.id, "pending", "denied", "owner");

  const updated = { ...booking, status: "denied" as const };
  await syncBookingToSheets(updated);

  try {
    await sendGuestDenied({
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
    });
  } catch (err) {
    console.error("[deny] email error:", err);
  }

  return NextResponse.redirect(`${BASE_URL}/admin?denied=${booking.id}`);
}
