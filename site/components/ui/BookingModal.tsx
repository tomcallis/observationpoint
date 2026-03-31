"use client";

import { useState, useRef } from "react";
import { getPriceForStay, formatUSD, formatDisplayDate } from "@/lib/pricing";
import { property } from "@/config/property";
import weeklyPricesData from "@/data/weekly-prices.json";
import type { BookingPayload } from "@/app/api/booking/route";

interface Props {
  checkin: Date;
  checkout: Date;
  onClose: () => void;
}

const weeklyOverrides = weeklyPricesData as Record<string, number>;

type Step = "agreement" | "details" | "payment" | "confirm";

const REFERRAL_OPTIONS = [
  "VRBO listing",
  "Repeat guest",
  "Friend or family referral",
  "Google search",
  "Other",
];

export default function BookingModal({ checkin, checkout, onClose }: Props) {
  const pricing = getPriceForStay(checkin, checkout, weeklyOverrides);
  const { payment } = property;

  const [step, setStep] = useState<Step>("agreement");
  const [agreementScrolled, setAgreementScrolled] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Guest details
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [numGuests, setNumGuests] = useState("2");
  const [referralSource, setReferralSource] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const agreementRef = useRef<HTMLDivElement>(null);

  const depositAmount = Math.round(pricing.total * (payment.deposit.percent / 100));
  const balanceAmount = pricing.total - depositAmount;

  const handleAgreementScroll = () => {
    const el = agreementRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setAgreementScrolled(true);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");

    const payload: BookingPayload = {
      guestName,
      guestEmail,
      guestPhone,
      numGuests,
      referralSource,
      specialRequests,
      checkin: checkin.toISOString().split("T")[0],
      checkout: checkout.toISOString().split("T")[0],
      nights: pricing.nights,
      season: pricing.season,
      baseRate: pricing.baseRate,
      taxAmount: pricing.taxAmount,
      total: pricing.total,
      depositAmount,
      balanceAmount,
    };

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStep("confirm");
      } else {
        const data = await res.json().catch(() => ({}));
        // Graceful fallback: API failed, open mailto as backup
        if (res.status === 503) {
          // Email service not configured — fall back to mailto:
          openMailtoFallback();
          setStep("confirm");
        } else {
          setSubmitError(data.error || "Something went wrong. Please try again or email us directly.");
        }
      }
    } catch {
      // Network error — fall back to mailto:
      openMailtoFallback();
      setStep("confirm");
    } finally {
      setSubmitting(false);
    }
  };

  const openMailtoFallback = () => {
    const body = `BOOKING REQUEST — Observation Point\n\nGuest: ${guestName}\nEmail: ${guestEmail}\nPhone: ${guestPhone}\nGuests: ${numGuests}\nHeard about us: ${referralSource}\n\nCheck-in: ${formatDisplayDate(checkin)}\nCheck-out: ${formatDisplayDate(checkout)}\nNights: ${pricing.nights} · Total: ${formatUSD(pricing.total)}\n\nSpecial requests: ${specialRequests || "None"}\n\nGuest agreed to the Vacation Rental Agreement.`;

    const subject = encodeURIComponent(`Booking Request — Observation Point ${formatDisplayDate(checkin)}`);
    window.open(`mailto:${property.contactEmail}?subject=${subject}&body=${encodeURIComponent(body)}`);
  };

  const agreementText = `THIS IS A VACATION RENTAL AGREEMENT UNDER THE NORTH CAROLINA VACATION RENTAL ACT. THE RIGHTS AND OBLIGATIONS OF THE PARTIES TO THIS AGREEMENT ARE DEFINED BY LAW AND INCLUDE UNIQUE PROVISIONS PERMITTING THE DISBURSEMENT OF RENT PRIOR TO TENANCY AND EXPEDITED EVICTION OF TENANTS. YOUR SIGNATURE ON THIS AGREEMENT, OR PAYMENT OF MONEY OR TAKING POSSESSION OF THE PROPERTY AFTER RECEIPT OF THE AGREEMENT, IS EVIDENCE OF YOUR ACCEPTANCE OF THE AGREEMENT AND YOUR INTENT TO USE THIS PROPERTY FOR A VACATION RENTAL.

The Owner hereby rents to Traveler, and Traveler hereby rents from Owner, the vacation cottage known as Observation Point located at 50184 Treasure Court, Frisco, NC 27936 ("cottage") on the terms of this Agreement.

Owners: Tom and Miranda Callis · Phone: 252-996-0578 · Email: tom.callis@gmail.com

1. TERM AND CHARGES
Check-in: ${formatDisplayDate(checkin)} at 3:30 PM
Check-out: ${formatDisplayDate(checkout)} at 10:00 AM
Weekly rental rate: ${formatUSD(pricing.baseRate)}
NC and Dare County tax (12.75%): ${formatUSD(pricing.taxAmount)}
Total Due: ${formatUSD(pricing.total)}

2. CANCELLATION
Cancellations must be submitted in writing to tom.callis@gmail.com. Refunds are issued as follows: full refund if cancelled 60 or more days before check-in; 50% refund if cancelled 30–59 days before check-in; no refund if cancelled fewer than 30 days before check-in. Traveler shall not assign this Agreement nor sublet Observation Point. Travel insurance is strongly recommended.

3. HOUSE RULES
Pets: No pets permitted.
Smoking: No smoking or vaping inside the cottage.Parking: Do not park or drive on septic field (marked by posts and rope).
Grills: No grill use on deck.
Linens: Sheets, pillowcases, bath towels, and beach towels are NOT provided — please bring your own. Comforters, blankets, and pillows are provided.

4. CHECK-IN AND CHECK-OUT
Check-in begins at 3:30 PM. Access instructions will be provided before arrival. Report any cleaning issues within 2 hours of check-in.
Vacate by 10:00 AM. Before leaving: start the dishwasher, remove all food and drinks, return furniture to original positions, bag trash and roll the cart to the street, clean the grill if used. Report any damage or maintenance issues.

5. TRAVELER DUTIES AND OCCUPANCY
The primary renter must be at least 25 years of age and must be present for the duration of the stay. Traveler agrees to keep the cottage clean and safe and to comply with all obligations under the NC Vacation Rental Act. Maximum occupancy is 6 guests at all times. Traveler agrees not to use the cottage for any unlawful purpose. Any material breach — including holding over, failure to pay rent, or obtaining possession by fraud — may result in expedited eviction under Article 4 of the NC Vacation Rental Act (NCGS 42A).

6. MANDATORY EVACUATION
If authorities order a mandatory evacuation, Traveler must comply and is entitled to a prorated refund for nights unable to occupy the cottage. Travel interruption insurance is available through providers such as Allianz (allianztravelinsurance.com).

7. OWNER DUTIES AND INDEMNIFICATION
Owner will provide the cottage in fit and habitable condition and make good faith efforts to repair inoperative equipment promptly. Owner or agents may enter the cottage for repairs, maintenance, or other necessary purposes. If Owner cannot provide the cottage in habitable condition at the time of occupancy, all payments will be refunded. Traveler agrees to indemnify and hold harmless the Owner from liability for personal injury or property damage unless caused by the negligent or willful act of the Owner. Owner will conduct all activities without regard to race, religion, sex, national origin, handicap, or familial status.

PAYMENT
Payment is by personal check. A 50% deposit check must be mailed within 5 days of booking confirmation to secure your dates. The remaining 50% balance is due 45 days before check-in. If booking within 45 days of check-in, full payment is due at confirmation. Checks payable to Tom Callis, mailed to 296 Apple Blossom Lane, Boone, NC 28607.

By checking the box below, Traveler acknowledges having read and agreed to this Vacation Rental Agreement.`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Book Your Stay</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {formatDisplayDate(checkin)} → {formatDisplayDate(checkout)} · {pricing.nights} nights
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step progress */}
        {step !== "confirm" && (
          <div className="px-6 pt-3 pb-0 flex gap-1.5">
            {(["agreement", "details", "payment"] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= ["agreement", "details", "payment"].indexOf(step)
                    ? "bg-sky-400"
                    : "bg-slate-100"
                }`}
              />
            ))}
          </div>
        )}

        {/* Price summary — always visible */}
        <div className="px-6 py-3 bg-sky-50 border-b border-sky-100">
          <div className="flex justify-between text-sm text-slate-600">
            <span>{pricing.season} rate</span>
            <span>{formatUSD(pricing.baseRate)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500 mt-0.5">
            <span>Tax (12.75%)</span>
            <span>{formatUSD(pricing.taxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-800 text-lg mt-1.5 pt-1.5 border-t border-sky-200">
            <span>Total</span>
            <span>{formatUSD(pricing.total)}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            50% deposit ({formatUSD(depositAmount)}) due within 5 days · Balance ({formatUSD(balanceAmount)}) due 45 days before check-in
          </p>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Step 1: Agreement ── */}
          {step === "agreement" && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">Vacation Rental Agreement</h3>
              <p className="text-sm text-slate-500 mb-2">
                Please scroll through the full agreement before continuing.
              </p>
              <div
                ref={agreementRef}
                onScroll={handleAgreementScroll}
                className="bg-slate-50 rounded-xl p-4 max-h-64 overflow-y-auto text-xs text-slate-600 leading-relaxed whitespace-pre-wrap border border-slate-200 font-mono"
              >
                {agreementText}
              </div>
              {!agreementScrolled && (
                <p className="text-xs text-slate-400 mt-2 text-center animate-pulse">↓ Scroll to the bottom to continue</p>
              )}
              <label className={`flex items-start gap-3 mt-4 cursor-pointer ${!agreementScrolled ? "opacity-40 pointer-events-none" : ""}`}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-sky-500"
                />
                <span className="text-sm text-slate-700">
                  I have read and agree to the Vacation Rental Agreement above.
                </span>
              </label>
              <button
                disabled={!agreedToTerms}
                onClick={() => setStep("details")}
                className="mt-4 w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-full transition-colors"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2: Details ── */}
          {step === "details" && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Your Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Email *</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={e => setGuestEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    placeholder="(555) 555-5555"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Number of Guests *</label>
                  <select
                    value={numGuests}
                    onChange={e => setNumGuests(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">How did you hear about us?</label>
                  <select
                    value={referralSource}
                    onChange={e => setReferralSource(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <option value="">— Select one —</option>
                    {REFERRAL_OPTIONS.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">
                    Special requests <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                    placeholder="Early check-in, boat docking, accessibility needs, etc."
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
                  />
                </div>
              </div>
              <button
                disabled={!guestName || !guestEmail || !guestPhone}
                onClick={() => setStep("payment")}
                className="mt-5 w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-full transition-colors"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 3: Review & Submit ── */}
          {step === "payment" && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">Review &amp; Submit</h3>
              <p className="text-sm text-slate-500 mb-4">
                Your request will be sent to Tom for review. If confirmed, you&rsquo;ll receive an email with check payment instructions for your {formatUSD(depositAmount)} deposit.
              </p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2 mb-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-in</span>
                  <span className="font-medium">{formatDisplayDate(checkin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-out</span>
                  <span className="font-medium">{formatDisplayDate(checkout)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guests</span>
                  <span className="font-medium">{numGuests}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                  <span className="text-slate-500">Total (incl. tax)</span>
                  <span className="font-bold text-sky-600">{formatUSD(pricing.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deposit (50%)</span>
                  <span className="font-medium">{formatUSD(depositAmount)} by check · due within 5 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Balance (50%)</span>
                  <span className="font-medium">{formatUSD(balanceAmount)} · due 45 days before check-in</span>
                </div>
              </div>

              {submitError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {submitError}
                  <button
                    onClick={() => { openMailtoFallback(); setStep("confirm"); }}
                    className="block mt-2 text-sky-600 underline text-xs"
                  >
                    Send via email client instead →
                  </button>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="mt-5 w-full bg-sky-500 hover:bg-sky-400 disabled:bg-sky-300 text-white font-semibold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  "Submit Booking Request →"
                )}
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">
                You&apos;ll receive a confirmation email once Tom reviews your request.
              </p>
            </div>
          )}

          {/* ── Step 4: Confirm ── */}
          {step === "confirm" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Request Submitted!</h3>
              <p className="text-slate-500 text-sm mb-1">
                A confirmation has been sent to <strong>{guestEmail}</strong>.
              </p>
              <p className="text-slate-500 text-sm mb-6">
                Tom will review your request and email you check payment instructions for your deposit if confirmed.
              </p>
              <div className="bg-slate-50 rounded-xl p-4 text-left text-sm space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-in</span>
                  <span className="font-medium">{formatDisplayDate(checkin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Check-out</span>
                  <span className="font-medium">{formatDisplayDate(checkout)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total</span>
                  <span className="font-bold text-sky-600">{formatUSD(pricing.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deposit (if confirmed)</span>
                  <span className="font-medium">{formatUSD(depositAmount)} by check</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-3 rounded-full transition-colors"
              >
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
