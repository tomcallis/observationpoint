import { NextResponse } from "next/server";
import { Resend } from "resend";
import { property } from "@/config/property";
import { formatUSD, formatDisplayDate } from "@/lib/pricing";

export interface BookingPayload {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numGuests: string;
  referralSource: string;
  specialRequests: string;
  checkin: string; // ISO date string
  checkout: string; // ISO date string
  nights: number;
  season: string;
  baseRate: number;
  taxAmount: number;
  total: number;
  depositAmount: number;
  balanceAmount: number;
  paymentMethod: "venmo" | "check";
}

function ownerEmailHtml(b: BookingPayload): string {
  const checkinDate = new Date(b.checkin + "T12:00:00");
  const checkoutDate = new Date(b.checkout + "T12:00:00");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#0ea5e9;padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">New Booking Request</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Observation Point · Frisco, NC</p>
        </td></tr>

        <!-- Stay summary -->
        <tr><td style="padding:28px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-radius:12px;padding:0;overflow:hidden;">
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #e0f2fe;">
                <span style="display:block;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Check-in</span>
                <span style="font-size:16px;font-weight:600;color:#0f172a;">${formatDisplayDate(checkinDate)}</span>
                <span style="font-size:13px;color:#64748b;margin-left:8px;">at 4:00 PM</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #e0f2fe;">
                <span style="display:block;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Check-out</span>
                <span style="font-size:16px;font-weight:600;color:#0f172a;">${formatDisplayDate(checkoutDate)}</span>
                <span style="font-size:13px;color:#64748b;margin-left:8px;">at 10:00 AM</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:13px;color:#64748b;">${b.nights} nights · ${b.season}</td>
                    <td align="right" style="font-size:18px;font-weight:700;color:#0ea5e9;">${formatUSD(b.total)}</td>
                  </tr>
                </table>
                <p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">Deposit due: ${formatUSD(b.depositAmount)} · Balance: ${formatUSD(b.balanceAmount)}</p>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Guest details -->
        <tr><td style="padding:24px 32px 0;">
          <h2 style="margin:0 0 16px;font-size:15px;font-weight:600;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;">Guest Details</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ["Name", b.guestName],
              ["Email", b.guestEmail],
              ["Phone", b.guestPhone],
              ["Party size", `${b.numGuests} guests`],
              ["Found us via", b.referralSource || "Not specified"],
              ["Payment method", b.paymentMethod === "venmo" ? `Venmo (${property.payment.venmo.handle})` : "Check by mail"],
            ]
              .map(
                ([label, value]) => `
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748b;width:140px;">${label}</td>
              <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:500;">${value}</td>
            </tr>`
              )
              .join("")}
          </table>
          ${
            b.specialRequests
              ? `<div style="margin-top:16px;padding:14px 16px;background:#fef9c3;border-radius:10px;border-left:4px solid #fbbf24;">
              <span style="font-size:12px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">Special Requests</span>
              <p style="margin:6px 0 0;font-size:13px;color:#78350f;">${b.specialRequests}</p>
            </div>`
              : ""
          }
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:28px 32px;">
          <a href="mailto:${b.guestEmail}?subject=Re: Your Observation Point Booking Request&body=Hi ${b.guestName.split(" ")[0]},%0A%0AThank you for your booking request!%0A%0A"
            style="display:inline-block;background:#0ea5e9;color:#ffffff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:50px;text-decoration:none;">
            Reply to ${b.guestName.split(" ")[0]} →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f1f5f9;background:#f8fafc;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">This request was submitted via observationpointobx.com · ${new Date().toLocaleString()}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function guestConfirmationHtml(b: BookingPayload): string {
  const checkinDate = new Date(b.checkin + "T12:00:00");
  const checkoutDate = new Date(b.checkout + "T12:00:00");
  const firstName = b.guestName.split(" ")[0];

  const paymentBlock =
    b.paymentMethod === "venmo"
      ? `
    <tr><td style="padding:20px;background:#f0f9ff;border-radius:12px;">
      <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#0f172a;">Pay via Venmo</p>
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#0ea5e9;font-family:monospace;">${property.payment.venmo.handle}</p>
      <p style="margin:0;font-size:13px;color:#64748b;">Send <strong>${formatUSD(b.depositAmount)}</strong> within 48 hours.<br>
      In the Venmo note, include: <em>"${b.guestName} – ${b.checkin}"</em></p>
    </td></tr>`
      : `
    <tr><td style="padding:20px;background:#f0f9ff;border-radius:12px;">
      <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#0f172a;">Mail a Check</p>
      <p style="margin:0 0 6px;font-size:13px;color:#64748b;">Payable to: <strong>${property.payment.check.payableTo}</strong></p>
      <p style="margin:0 0 12px;font-size:13px;color:#64748b;">Mail to:<br><strong>${property.payment.check.mailingAddress}</strong></p>
      <p style="margin:0;font-size:13px;color:#64748b;">Amount: <strong>${formatUSD(b.depositAmount)}</strong><br>
      Check must be received within 5 business days to hold your dates.</p>
    </td></tr>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0284c7 0%,#0ea5e9 100%);padding:36px 32px;text-align:center;">
          <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:700;">Booking Request Received!</h1>
          <p style="margin:0;color:rgba(255,255,255,0.9);font-size:15px;">Observation Point · Frisco, Hatteras Island, NC</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:28px 32px 0;">
          <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;">
            Hi ${firstName},
          </p>
          <p style="margin:14px 0 0;font-size:15px;color:#334155;line-height:1.6;">
            Thanks for requesting to book Observation Point! Your dates are <strong>not yet confirmed</strong> —
            please send your deposit within 48 hours to hold them. Tom will send a confirmation email once payment is received.
          </p>
        </td></tr>

        <!-- Stay summary -->
        <tr><td style="padding:24px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Your Stay</td>
            </tr>
            ${[
              ["Check-in", `${formatDisplayDate(checkinDate)} at 4:00 PM`],
              ["Check-out", `${formatDisplayDate(checkoutDate)} at 10:00 AM`],
              ["Duration", `${b.nights} nights`],
              ["Guests", b.numGuests],
            ]
              .map(
                ([label, value]) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 16px;font-size:13px;color:#64748b;">${label}</td>
              <td style="padding:12px 16px;font-size:13px;color:#0f172a;font-weight:500;text-align:right;">${value}</td>
            </tr>`
              )
              .join("")}
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 16px;font-size:13px;color:#64748b;">Total (incl. 12.75% tax)</td>
              <td style="padding:12px 16px;font-size:16px;font-weight:700;color:#0ea5e9;text-align:right;">${formatUSD(b.total)}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:12px;color:#94a3b8;" colspan="2">
                Deposit (50%): <strong>${formatUSD(b.depositAmount)}</strong> due within 48 hours ·
                Balance: <strong>${formatUSD(b.balanceAmount)}</strong> due 30 days before check-in
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Payment instructions -->
        <tr><td style="padding:24px 32px 0;">
          <h2 style="margin:0 0 14px;font-size:15px;font-weight:600;color:#0f172a;">How to Send Your Deposit</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${paymentBlock}
          </table>
        </td></tr>

        <!-- What happens next -->
        <tr><td style="padding:24px 32px 0;">
          <h2 style="margin:0 0 14px;font-size:15px;font-weight:600;color:#0f172a;">What Happens Next</h2>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ["1", "Send your deposit within 48 hours (see above)."],
              ["2", "Tom will confirm your booking by email once payment is received."],
              ["3", `Your balance of ${formatUSD(b.balanceAmount)} is due 30 days before check-in.`],
              ["4", "You'll receive the Guest Guidebook (check-in details, door code, local tips) closer to your arrival."],
            ]
              .map(
                ([num, text]) => `
            <tr>
              <td style="padding:6px 12px 6px 0;vertical-align:top;width:28px;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:#e0f2fe;border-radius:50%;font-size:11px;font-weight:700;color:#0284c7;">${num}</span>
              </td>
              <td style="padding:6px 0;font-size:13px;color:#334155;vertical-align:top;line-height:1.5;">${text}</td>
            </tr>`
              )
              .join("")}
          </table>
        </td></tr>

        <!-- Cancellation reminder -->
        <tr><td style="padding:20px 32px 0;">
          <p style="margin:0;padding:14px 16px;background:#fef9c3;border-radius:10px;font-size:12px;color:#78350f;line-height:1.5;">
            <strong>Cancellation policy:</strong> ${property.payment.cancellationPolicy}
          </p>
        </td></tr>

        <!-- Closing -->
        <tr><td style="padding:28px 32px 0;">
          <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;">
            Questions? Just reply to this email — Tom typically responds within a few hours.
            <br><br>
            We can&rsquo;t wait to welcome you to the Outer Banks.
          </p>
          <p style="margin:20px 0 0;font-size:14px;color:#64748b;">
            <strong>Tom Callis</strong><br>
            Observation Point · Frisco, NC<br>
            <a href="${property.vrboUrl}" style="color:#0ea5e9;text-decoration:none;">View on VRBO</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;margin-top:20px;border-top:1px solid #f1f5f9;background:#f8fafc;">
          <p style="margin:0;font-size:11px;color:#94a3b8;text-align:center;">
            Observation Point · 50184 Treasure Ct, Frisco, NC 27936
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email service not configured. Please contact the owner directly." },
      { status: 503 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  let body: BookingPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Basic validation
  if (!body.guestName || !body.guestEmail || !body.checkin || !body.checkout) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ?? "Observation Point <noreply@observationpointobx.com>";
  const ownerEmail = property.contactEmail;

  const checkinDate = new Date(body.checkin + "T12:00:00");
  const checkoutDate = new Date(body.checkout + "T12:00:00");
  const subject = `Booking Request — Observation Point · ${formatDisplayDate(checkinDate)}`;

  try {
    // Send both emails concurrently
    await Promise.all([
      // 1. Owner notification
      resend.emails.send({
        from: fromEmail,
        to: [ownerEmail],
        replyTo: body.guestEmail,
        subject: `[NEW BOOKING] ${body.guestName} · ${formatDisplayDate(checkinDate)} – ${formatDisplayDate(checkoutDate)}`,
        html: ownerEmailHtml(body),
      }),

      // 2. Guest confirmation
      resend.emails.send({
        from: fromEmail,
        to: [body.guestEmail],
        replyTo: ownerEmail,
        subject,
        html: guestConfirmationHtml(body),
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[booking API] Resend error:", err);
    return NextResponse.json(
      { error: "Failed to send confirmation emails. Please contact the owner directly." },
      { status: 500 }
    );
  }
}
