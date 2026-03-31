import { NextRequest, NextResponse } from "next/server";
import {
  getBookingByToken,
  updateBookingStatus,
  insertBookingEvent,
} from "@/lib/db";
import { sendGuestConfirmed } from "@/lib/email";
import { syncBookingToSheets } from "@/lib/sheets";
import { property } from "@/config/property";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://observationpointnc.com";
const { fullPaymentThresholdDays, balanceDueDays } = property.payment.deposit;

function daysUntil(checkIn: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(checkIn + "T12:00:00");
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function subtractDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

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

  const days = daysUntil(booking.check_in);
  const paymentType = days <= fullPaymentThresholdDays ? "full" : "deposit";
  const depositAmount = booking.total_price / 100 / 2;
  const balanceDueDate = paymentType === "deposit" ? subtractDays(booking.check_in, balanceDueDays) : undefined;

  await updateBookingStatus(booking.id, "confirmed");
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
      paymentType,
      balanceDueDate,
    });
  } catch (err) {
    console.error("[confirm] email error:", err);
  }

  return NextResponse.redirect(`${BASE_URL}/admin?confirmed=${booking.id}`);
}
