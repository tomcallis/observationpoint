import { Resend } from "resend";
import { property } from "@/config/property";
import { formatUSD, formatDisplayDate } from "@/lib/pricing";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://observationpointnc.com";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "Observation Point <reservations@observationpointnc.com>";
const OWNER_EMAIL = property.contactEmail;

function d(iso: string) {
  return formatDisplayDate(new Date(iso + "T12:00:00"));
}

// ── Shared layout wrapper ───────────────────────────────────────────────────

function wrap(headerColor: string, headerText: string, headerSub: string, body: string): string {
  const logoUrl = `${BASE_URL}/images/logo.png`;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:${headerColor};padding:28px 32px;">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <tr>
              <td style="vertical-align:middle;padding-right:14px;">
                <img src="${logoUrl}" alt="Observation Point" width="52" height="52" style="display:block;border-radius:50%;background:#ffffff;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="display:block;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:2px;">Observation Point</span>
                <span style="display:block;font-size:11px;color:rgba(255,255,255,0.55);">Frisco, Hatteras Island, NC</span>
              </td>
            </tr>
          </table>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${headerText}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${headerSub}</p>
        </td></tr>
        ${body}
        <tr><td style="padding:20px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding-bottom:8px;">
                <img src="${logoUrl}" alt="" width="28" height="28" style="display:inline-block;border-radius:50%;" />
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="margin:0;font-size:11px;color:#94a3b8;">Observation Point · 50184 Treasure Ct, Frisco, NC 27936</p>
                <p style="margin:4px 0 0;font-size:11px;color:#cbd5e1;"><a href="${BASE_URL}" style="color:#94a3b8;text-decoration:none;">observationpointnc.com</a></p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function stayCard(checkIn: string, checkOut: string, numGuests: number, total: number, depositAmount: number, balanceAmount: number) {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-radius:12px;overflow:hidden;margin-bottom:4px;">
    <tr><td style="padding:14px 20px;border-bottom:1px solid #e0f2fe;">
      <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Check-in</span><br>
      <span style="font-size:15px;font-weight:600;color:#0f172a;">${d(checkIn)}</span>
      <span style="font-size:12px;color:#64748b;margin-left:8px;">at 3:30 PM</span>
    </td></tr>
    <tr><td style="padding:14px 20px;border-bottom:1px solid #e0f2fe;">
      <span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Check-out</span><br>
      <span style="font-size:15px;font-weight:600;color:#0f172a;">${d(checkOut)}</span>
      <span style="font-size:12px;color:#64748b;margin-left:8px;">at 10:00 AM</span>
    </td></tr>
    <tr><td style="padding:14px 20px;">
      <span style="font-size:13px;color:#64748b;">${numGuests} guest${numGuests !== 1 ? "s" : ""}</span>
      <span style="float:right;font-size:18px;font-weight:700;color:#0ea5e9;">${formatUSD(total)}</span><br>
      <span style="font-size:11px;color:#94a3b8;">Deposit: ${formatUSD(depositAmount)} · Balance: ${formatUSD(balanceAmount)}</span>
    </td></tr>
  </table>`;
}

function btn(href: string, label: string, color = "#0ea5e9") {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#fff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:50px;text-decoration:none;">${label}</a>`;
}

// ── 1. Owner: new booking request ────────────────────────────────────────────

export async function sendOwnerNewBooking(b: {
  bookingId: string;
  ownerToken: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numGuests: number;
  checkIn: string;
  checkOut: string;
  total: number;
  depositAmount: number;
  balanceAmount: number;
  specialRequests?: string;
  referralSource?: string;
}) {
  const confirmUrl = `${BASE_URL}/api/booking/confirm?token=${b.ownerToken}`;
  const denyUrl = `${BASE_URL}/api/booking/deny?token=${b.ownerToken}`;
  const adminUrl = `${BASE_URL}/admin`;

  const body = `
    <tr><td style="padding:24px 32px 0;">${stayCard(b.checkIn, b.checkOut, b.numGuests, b.total, b.depositAmount, b.balanceAmount)}</td></tr>
    <tr><td style="padding:20px 32px 0;">
      <h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0f172a;text-transform:uppercase;letter-spacing:.05em;">Guest</h2>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="font-size:13px;color:#64748b;padding:3px 16px 3px 0;width:120px;">Name</td><td style="font-size:13px;color:#0f172a;font-weight:500;">${b.guestName}</td></tr>
        <tr><td style="font-size:13px;color:#64748b;padding:3px 16px 3px 0;">Email</td><td style="font-size:13px;color:#0f172a;">${b.guestEmail}</td></tr>
        <tr><td style="font-size:13px;color:#64748b;padding:3px 16px 3px 0;">Phone</td><td style="font-size:13px;color:#0f172a;">${b.guestPhone || "—"}</td></tr>
        <tr><td style="font-size:13px;color:#64748b;padding:3px 16px 3px 0;">Found via</td><td style="font-size:13px;color:#0f172a;">${b.referralSource || "—"}</td></tr>
      </table>
      ${b.specialRequests ? `<div style="margin-top:12px;padding:12px 14px;background:#fef9c3;border-radius:8px;border-left:4px solid #fbbf24;font-size:13px;color:#78350f;">${b.specialRequests}</div>` : ""}
    </td></tr>
    <tr><td style="padding:24px 32px;">
      <p style="margin:0 0 16px;font-size:14px;color:#334155;">Confirm or deny this booking request:</p>
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:12px;">${btn(confirmUrl, "✓ Confirm Booking", "#16a34a")}</td>
        <td>${btn(denyUrl, "✗ Deny Request", "#dc2626")}</td>
      </tr></table>
      <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">Or manage from <a href="${adminUrl}" style="color:#0ea5e9;">the admin page</a>.</p>
    </td></tr>`;

  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: [OWNER_EMAIL],
    replyTo: b.guestEmail,
    subject: `[NEW BOOKING] ${b.guestName} · ${d(b.checkIn)} – ${d(b.checkOut)}`,
    html: wrap("#0ea5e9", "New Booking Request", "Observation Point · Frisco, NC", body),
  });
}

// ── 2. Guest: request received ───────────────────────────────────────────────

export async function sendGuestRequestReceived(b: {
  guestName: string;
  guestEmail: string;
  numGuests: number;
  checkIn: string;
  checkOut: string;
  total: number;
  depositAmount: number;
  balanceAmount: number;
}) {
  const firstName = b.guestName.split(" ")[0];
  const body = `
    <tr><td style="padding:24px 32px 0;">
      <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;">Hi ${firstName},</p>
      <p style="margin:12px 0 0;font-size:15px;color:#334155;line-height:1.6;">
        Thanks for your request to book Observation Point! Tom will review and respond within a few hours.
        Once confirmed, you'll receive a secure payment link for your 50% deposit.
      </p>
    </td></tr>
    <tr><td style="padding:20px 32px 0;">${stayCard(b.checkIn, b.checkOut, b.numGuests, b.total, b.depositAmount, b.balanceAmount)}</td></tr>
    <tr><td style="padding:20px 32px;">
      <p style="margin:0;padding:14px 16px;background:#fef9c3;border-radius:10px;font-size:12px;color:#78350f;line-height:1.5;">
        <strong>Cancellation policy:</strong> ${property.payment.cancellationPolicy}
      </p>
    </td></tr>`;

  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: [b.guestEmail],
    replyTo: OWNER_EMAIL,
    subject: `Booking Request Received — Observation Point · ${d(b.checkIn)}`,
    html: wrap("linear-gradient(135deg,#0284c7 0%,#0ea5e9 100%)", "Request Received!", "Observation Point · Frisco, Hatteras Island, NC", body),
  });
}

// ── 3. Guest: confirmed + deposit link ───────────────────────────────────────

export async function sendGuestConfirmed(b: {
  guestName: string;
  guestEmail: string;
  numGuests: number;
  checkIn: string;
  checkOut: string;
  total: number;
  depositAmount: number;
  balanceAmount: number;
  depositUrl: string;
}) {
  const firstName = b.guestName.split(" ")[0];
  const body = `
    <tr><td style="padding:24px 32px 0;">
      <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;">Hi ${firstName},</p>
      <p style="margin:12px 0 0;font-size:15px;color:#334155;line-height:1.6;">
        Great news — your booking is <strong>confirmed</strong>! Please complete your 50% deposit within 48 hours
        to secure your dates.
      </p>
    </td></tr>
    <tr><td style="padding:16px 32px 0;">${stayCard(b.checkIn, b.checkOut, b.numGuests, b.total, b.depositAmount, b.balanceAmount)}</td></tr>
    <tr><td style="padding:24px 32px;">
      <p style="margin:0 0 16px;font-size:14px;color:#334155;font-weight:600;">Pay your deposit now — ${formatUSD(b.depositAmount)}</p>
      ${btn(b.depositUrl, "Pay Deposit →")}
      <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">Secure payment via Stripe. Your balance of ${formatUSD(b.balanceAmount)} will be due 30 days before check-in.</p>
    </td></tr>`;

  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: [b.guestEmail],
    replyTo: OWNER_EMAIL,
    subject: `Booking Confirmed! — Observation Point · ${d(b.checkIn)}`,
    html: wrap("#16a34a", "Your Booking is Confirmed!", "Observation Point · Frisco, Hatteras Island, NC", body),
  });
}

// ── 4. Guest: denied ─────────────────────────────────────────────────────────

export async function sendGuestDenied(b: {
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
}) {
  const firstName = b.guestName.split(" ")[0];
  const body = `
    <tr><td style="padding:24px 32px;">
      <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;">Hi ${firstName},</p>
      <p style="margin:12px 0 0;font-size:15px;color:#334155;line-height:1.6;">
        Unfortunately, the dates you requested (${d(b.checkIn)} – ${d(b.checkOut)}) are not available.
        We're sorry we can't accommodate you this time.
      </p>
      <p style="margin:12px 0 0;font-size:15px;color:#334155;line-height:1.6;">
        Please check the calendar for other open weeks — we'd love to have you at Observation Point.
      </p>
      <p style="margin:20px 0 0;">${btn(`${BASE_URL}/#booking`, "Check Other Dates →")}</p>
    </td></tr>`;

  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: [b.guestEmail],
    replyTo: OWNER_EMAIL,
    subject: `Re: Booking Request — Observation Point · ${d(b.checkIn)}`,
    html: wrap("#64748b", "Dates Unavailable", "Observation Point · Frisco, Hatteras Island, NC", body),
  });
}

// ── 5. Guest: balance due reminder ───────────────────────────────────────────

export async function sendGuestBalanceDue(b: {
  guestName: string;
  guestEmail: string;
  numGuests: number;
  checkIn: string;
  checkOut: string;
  total: number;
  depositAmount: number;
  balanceAmount: number;
  balanceUrl: string;
}) {
  const firstName = b.guestName.split(" ")[0];
  const body = `
    <tr><td style="padding:24px 32px 0;">
      <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;">Hi ${firstName},</p>
      <p style="margin:12px 0 0;font-size:15px;color:#334155;line-height:1.6;">
        Your stay at Observation Point is coming up! Your balance payment of <strong>${formatUSD(b.balanceAmount)}</strong> is now due.
      </p>
    </td></tr>
    <tr><td style="padding:16px 32px 0;">${stayCard(b.checkIn, b.checkOut, b.numGuests, b.total, b.depositAmount, b.balanceAmount)}</td></tr>
    <tr><td style="padding:24px 32px;">
      ${btn(b.balanceUrl, `Pay Balance ${formatUSD(b.balanceAmount)} →`)}
      <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">Secure payment via Stripe.</p>
    </td></tr>`;

  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: [b.guestEmail],
    replyTo: OWNER_EMAIL,
    subject: `Balance Due — Observation Point · ${d(b.checkIn)}`,
    html: wrap("#f59e0b", "Balance Payment Due", "Observation Point · Frisco, Hatteras Island, NC", body),
  });
}

// ── 6. Guest: paid in full ───────────────────────────────────────────────────

export async function sendGuestPaidInFull(b: {
  guestName: string;
  guestEmail: string;
  numGuests: number;
  checkIn: string;
  checkOut: string;
  total: number;
}) {
  const firstName = b.guestName.split(" ")[0];
  const body = `
    <tr><td style="padding:24px 32px;">
      <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;">Hi ${firstName},</p>
      <p style="margin:12px 0 0;font-size:15px;color:#334155;line-height:1.6;">
        You're all paid up! We'll send your Guest Guidebook with check-in details, the door code,
        and local tips a few days before your arrival.
      </p>
      <p style="margin:12px 0 0;font-size:15px;color:#334155;line-height:1.6;">
        We can't wait to welcome you to the Outer Banks. See you ${d(b.checkIn)}!
      </p>
    </td></tr>`;

  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: [b.guestEmail],
    replyTo: OWNER_EMAIL,
    subject: `All Paid — See You ${d(b.checkIn)}! — Observation Point`,
    html: wrap("#16a34a", "You're All Set!", "Observation Point · Frisco, Hatteras Island, NC", body),
  });
}
