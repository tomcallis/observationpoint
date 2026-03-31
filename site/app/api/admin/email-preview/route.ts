import { NextRequest, NextResponse } from "next/server";
import {
  renderOwnerNewBooking,
  renderGuestRequestReceived,
  renderGuestConfirmed,
  renderGuestDenied,
  renderGuestDepositReceived,
  renderGuestBalanceDue,
  renderGuestPreArrival,
  renderGuestPaidInFull,
} from "@/lib/email";

const SAMPLE = {
  bookingId: "preview-id",
  ownerToken: "preview-token",
  guestName: "Jane Smith",
  guestEmail: "jane@example.com",
  guestPhone: "252-555-0178",
  numGuests: 4,
  checkIn: "2026-07-11",
  checkOut: "2026-07-18",
  total: 1750,
  depositAmount: 875,
  balanceAmount: 875,
  balanceDueDate: "2026-05-27",
  specialRequests: "We have a shellfish allergy — please note in your records.",
  referralSource: "Google",
};

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "";

  let html: string;
  switch (type) {
    case "owner-new-booking":
      html = renderOwnerNewBooking(SAMPLE);
      break;
    case "guest-request-received":
      html = renderGuestRequestReceived(SAMPLE);
      break;
    case "guest-confirmed":
      html = renderGuestConfirmed({ ...SAMPLE, paymentType: "deposit" });
      break;
    case "guest-confirmed-full":
      html = renderGuestConfirmed({ ...SAMPLE, paymentType: "full" });
      break;
    case "guest-denied":
      html = renderGuestDenied(SAMPLE);
      break;
    case "guest-deposit-received":
      html = renderGuestDepositReceived(SAMPLE);
      break;
    case "guest-balance-due":
      html = renderGuestBalanceDue(SAMPLE);
      break;
    case "guest-pre-arrival":
      html = renderGuestPreArrival(SAMPLE);
      break;
    case "guest-paid-in-full":
      html = renderGuestPaidInFull(SAMPLE);
      break;
    default:
      return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
  }

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
