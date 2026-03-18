"use client";

import { useState, useRef } from "react";
import { getPriceForStay, formatUSD, formatDisplayDate } from "@/lib/pricing";
import { property } from "@/config/property";
import weeklyPricesData from "@/data/weekly-prices.json";

interface Props {
  checkin: Date;
  checkout: Date;
  onClose: () => void;
}

const weeklyOverrides = weeklyPricesData as Record<string, number>;

type PaymentMethod = "venmo" | "check";
type Step = "agreement" | "details" | "payment" | "confirm";

export default function BookingModal({ checkin, checkout, onClose }: Props) {
  const pricing = getPriceForStay(checkin, checkout, weeklyOverrides);
  const { payment } = property;

  const [step, setStep] = useState<Step>("agreement");
  const [agreementScrolled, setAgreementScrolled] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [numGuests, setNumGuests] = useState("2");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("venmo");

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

  const handleSubmit = () => {
    const paymentDetails =
      paymentMethod === "venmo"
        ? `Payment method: Venmo to ${payment.venmo.handle}\nDeposit due now: ${formatUSD(depositAmount)}\nBalance due 30 days before check-in: ${formatUSD(balanceAmount)}`
        : `Payment method: Check payable to "${payment.check.payableTo}"\nMail to: ${payment.check.mailingAddress}\nDeposit due now: ${formatUSD(depositAmount)}\nBalance due 30 days before check-in: ${formatUSD(balanceAmount)}`;

    const body = `BOOKING REQUEST — Observation Point

Guest: ${guestName}
Email: ${guestEmail}
Phone: ${guestPhone}
Number of guests: ${numGuests}

Check-in: ${formatDisplayDate(checkin)}
Check-out: ${formatDisplayDate(checkout)}
Nights: ${pricing.nights}

Season: ${pricing.season}
Base rate: ${formatUSD(pricing.baseRate)}
Tax (12.75%): ${formatUSD(pricing.taxAmount)}
TOTAL: ${formatUSD(pricing.total)}

${paymentDetails}

Guest has agreed to the Vacation Rental Agreement.`;

    const subject = encodeURIComponent(`Booking Request — Observation Point ${formatDisplayDate(checkin)}`);
    const mailtoUrl = `mailto:${property.contactEmail}?subject=${subject}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setStep("confirm");
  };

  const agreementText = `VACATION RENTAL AGREEMENT

This Vacation Rental Agreement ("Agreement") is entered into between the property owner ("Owner") and the guest ("Guest") identified in this booking request.

PROPERTY
Observation Point · 50184 Treasure Ct, Frisco, NC 27936

RENTAL PERIOD
Check-in: ${formatDisplayDate(checkin)} at 4:00 PM
Check-out: ${formatDisplayDate(checkout)} at 10:00 AM
Duration: ${pricing.nights} nights

TOTAL RENTAL AMOUNT
${formatUSD(pricing.total)} (includes all applicable taxes)

PAYMENT TERMS
A deposit of 50% (${formatUSD(depositAmount)}) is due upon signing this Agreement. The remaining balance of ${formatUSD(balanceAmount)} is due no later than 30 days before the check-in date. Payment may be made via Venmo (${payment.venmo.handle}) or by personal check payable to "${payment.check.payableTo}" mailed to ${payment.check.mailingAddress}.

CANCELLATION POLICY
${payment.cancellationPolicy}

OCCUPANCY
Maximum occupancy is 6 guests. Guest must be at least 25 years of age or accompanied by a parent or guardian. Only registered guests may occupy the property.

CHECK-IN / CHECK-OUT
Check-in is at 4:00 PM on the arrival date. Check-out is at 10:00 AM on the departure date. Early check-in or late check-out may be arranged in advance subject to availability.

HOUSE RULES
• No smoking inside the property or on enclosed decks.
• No pets without prior written approval from the Owner.
• Quiet hours: 10:00 PM – 8:00 AM daily.
• No commercial activities, events, or parties without prior written approval.
• Maximum occupancy must not be exceeded at any time.
• Please treat the property with respect and report any damage promptly.

DOCK AND WATER SAFETY
Use of the private dock and any watercraft or water equipment is entirely at Guest's own risk. Owner is not responsible for accidents, injuries, or losses on or near the water. Children must be supervised by an adult at all times near the water. Guests should be aware of local boating and fishing regulations.

PROPERTY CARE
Guest agrees to return the property in the same condition as received, normal wear excepted. Guest is responsible for the cost of repairing any damage caused during the rental period, beyond normal wear and tear. Owner reserves the right to charge Guest's payment method on file for documented damages.

INDEMNIFICATION
Guest agrees to indemnify and hold harmless the Owner and property managers from any and all claims, damages, losses, or expenses (including reasonable attorneys' fees) arising from Guest's use of the property or breach of this Agreement, except where directly caused by Owner's negligence or willful misconduct.

RIGHT OF ENTRY
Owner or Owner's agents reserve the right to enter the property for emergency repairs or safety inspections with reasonable notice to Guest, except in cases of emergency where immediate entry is required.

ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between Owner and Guest regarding the rental of the property and supersedes all prior communications. This Agreement shall be governed by the laws of the State of North Carolina.

By checking the box below, Guest acknowledges having read, understood, and agreed to all terms and conditions of this Vacation Rental Agreement.`;

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

        {/* Price summary — always visible */}
        <div className="px-6 py-4 bg-sky-50 border-b border-sky-100">
          <div className="flex justify-between text-sm text-slate-600">
            <span>{pricing.season} rate</span>
            <span>{formatUSD(pricing.baseRate)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500 mt-1">
            <span>Tax (12.75%)</span>
            <span>{formatUSD(pricing.taxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-800 text-lg mt-2 pt-2 border-t border-sky-200">
            <span>Total</span>
            <span>{formatUSD(pricing.total)}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            50% deposit ({formatUSD(depositAmount)}) due now · Balance ({formatUSD(balanceAmount)}) due 30 days before check-in
          </p>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === "agreement" && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">Vacation Rental Agreement</h3>
              <p className="text-sm text-slate-500 mb-2">
                Please read the entire agreement before agreeing.
              </p>
              <div
                ref={agreementRef}
                onScroll={handleAgreementScroll}
                className="bg-slate-50 rounded-xl p-4 max-h-64 overflow-y-auto text-xs text-slate-600 leading-relaxed whitespace-pre-wrap border border-slate-200 font-mono"
              >
                {agreementText}
              </div>
              {!agreementScrolled && (
                <p className="text-xs text-slate-400 mt-2 text-center">Scroll to the bottom to continue</p>
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
                    {[1,2,3,4,5,6].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                disabled={!guestName || !guestEmail || !guestPhone}
                onClick={() => setStep("payment")}
                className="mt-6 w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-full transition-colors"
              >
                Continue →
              </button>
            </div>
          )}

          {step === "payment" && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Payment Method</h3>
              <p className="text-sm text-slate-500 mb-4">
                Deposit of {formatUSD(depositAmount)} is due within 48 hours of booking confirmation.
              </p>
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === "venmo" ? "border-sky-400 bg-sky-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="venmo"
                    checked={paymentMethod === "venmo"}
                    onChange={() => setPaymentMethod("venmo")}
                    className="mt-0.5 accent-sky-500"
                  />
                  <div>
                    <div className="font-medium text-slate-800">Pay by Venmo</div>
                    <div className="text-sm text-slate-500 mt-0.5">
                      Send payment to <span className="font-mono font-semibold text-slate-700">{payment.venmo.handle}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Include your name and check-in date in the note</div>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === "check" ? "border-sky-400 bg-sky-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="check"
                    checked={paymentMethod === "check"}
                    onChange={() => setPaymentMethod("check")}
                    className="mt-0.5 accent-sky-500"
                  />
                  <div>
                    <div className="font-medium text-slate-800">Mail a Check</div>
                    <div className="text-sm text-slate-500 mt-0.5">
                      Payable to <span className="font-semibold text-slate-700">&quot;{payment.check.payableTo}&quot;</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{payment.check.mailingAddress}</div>
                    <div className="text-xs text-slate-400">Check must be received within 5 business days</div>
                  </div>
                </label>
              </div>
              <button
                onClick={handleSubmit}
                className="mt-6 w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold py-3 rounded-full transition-colors"
              >
                Submit Booking Request →
              </button>
              <p className="text-xs text-slate-400 text-center mt-3">
                This will open your email client to send your request to the owner.
              </p>
            </div>
          )}

          {step === "confirm" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Request Sent!</h3>
              <p className="text-slate-500 text-sm mb-4">
                Your booking request has been sent to the owner. You&apos;ll receive a confirmation email within 24 hours.
              </p>
              <div className="bg-slate-50 rounded-xl p-4 text-left text-sm space-y-1 mb-6">
                <div className="flex justify-between"><span className="text-slate-500">Check-in</span><span className="font-medium">{formatDisplayDate(checkin)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Check-out</span><span className="font-medium">{formatDisplayDate(checkout)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-bold text-sky-600">{formatUSD(pricing.total)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Payment</span><span className="font-medium capitalize">{paymentMethod === "venmo" ? `Venmo (${payment.venmo.handle})` : "Check by mail"}</span></div>
              </div>
              <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-3 rounded-full transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
