import { NextRequest, NextResponse } from "next/server";
import { listBookings, getBookingEvents, getBookingById, updateBookingStatus, insertBookingEvent, deleteBooking } from "@/lib/db";
import { syncBookingToSheets } from "@/lib/sheets";
import { sendGuestConfirmed, sendGuestDenied, sendGuestDepositReceived, sendGuestPaidInFull } from "@/lib/email";
import { property } from "@/config/property";
import type { BookingStatus } from "@/lib/db";

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
  const status = req.nextUrl.searchParams.get("status") as BookingStatus | null;
  const bookings = await listBookings(status ?? undefined);

  const withEvents = await Promise.all(
    bookings.map(async (b) => ({
      ...b,
      events: await getBookingEvents(b.id),
    }))
  );

  return NextResponse.json(withEvents);
}

export async function POST(req: NextRequest) {
  const { action, bookingId } = await req.json();

  const booking = await getBookingById(bookingId);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Confirm ───────────────────────────────────────────────────────────────
  if (action === "confirm") {
    if (booking.status !== "pending") return NextResponse.json({ error: "Already actioned" }, { status: 409 });

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
      await insertBookingEvent(booking.id, "confirmed", "confirmed", "email", "Guest: Booking Confirmed");
    } catch (err) {
      console.error("[admin confirm] email error:", err);
    }

    return NextResponse.json({ ok: true, action: "confirmed" });
  }

  // ── Deny ──────────────────────────────────────────────────────────────────
  if (action === "deny") {
    if (booking.status !== "pending") return NextResponse.json({ error: "Already actioned" }, { status: 409 });

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
      await insertBookingEvent(booking.id, "denied", "denied", "email", "Guest: Booking Denied");
    } catch (err) {
      console.error("[admin deny] email error:", err);
    }

    return NextResponse.json({ ok: true, action: "denied" });
  }

  // ── Mark deposit received ─────────────────────────────────────────────────
  if (action === "mark-deposit-received") {
    if (booking.status !== "confirmed") return NextResponse.json({ error: "Booking is not in confirmed status" }, { status: 409 });

    const depositAmount = booking.total_price / 100 / 2;
    const balanceDueDate = subtractDays(booking.check_in, balanceDueDays);

    await updateBookingStatus(booking.id, "deposit_paid", { deposit_paid_at: "now" });
    await insertBookingEvent(booking.id, "confirmed", "deposit_paid", "owner");
    await syncBookingToSheets({ ...booking, status: "deposit_paid" });

    try {
      await sendGuestDepositReceived({
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        numGuests: booking.num_guests,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        total: booking.total_price / 100,
        depositAmount,
        balanceAmount: booking.total_price / 100 - depositAmount,
        balanceDueDate,
      });
      await insertBookingEvent(booking.id, "deposit_paid", "deposit_paid", "email", "Guest: Deposit Received");
    } catch (err) {
      console.error("[admin mark-deposit-received] email error:", err);
    }

    return NextResponse.json({ ok: true, action: "deposit_received" });
  }

  // ── Mark paid in full ─────────────────────────────────────────────────────
  if (action === "mark-paid-in-full") {
    const allowed: BookingStatus[] = ["confirmed", "deposit_paid", "balance_due"];
    if (!allowed.includes(booking.status)) return NextResponse.json({ error: "Cannot mark paid from current status" }, { status: 409 });

    const fromStatus = booking.status;
    await updateBookingStatus(booking.id, "paid_in_full", { balance_paid_at: "now" });
    await insertBookingEvent(booking.id, fromStatus, "paid_in_full", "owner");
    await syncBookingToSheets({ ...booking, status: "paid_in_full" });

    try {
      await sendGuestPaidInFull({
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        numGuests: booking.num_guests,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        total: booking.total_price / 100,
      });
      await insertBookingEvent(booking.id, "paid_in_full", "paid_in_full", "email", "Guest: Paid in Full");
    } catch (err) {
      console.error("[admin mark-paid-in-full] email error:", err);
    }

    return NextResponse.json({ ok: true, action: "paid_in_full" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteBooking(id);
  return NextResponse.json({ ok: true });
}
