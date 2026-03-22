"use client";

import { useState, useMemo, useEffect } from "react";
import Calendar from "react-calendar";
import type { BlockedRange } from "@/lib/ical";
import "react-calendar/dist/Calendar.css";

interface Props {
  blockedRanges: BlockedRange[];
  onRangeSelected?: (checkin: Date, checkout: Date) => void;
}

export default function AvailabilityCalendar({ blockedRanges, onRangeSelected }: Props) {
  const [pendingCheckin, setPendingCheckin] = useState<Date | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { bookedInterior, checkinDates, checkoutDates } = useMemo(() => {
    const bookedInterior = new Set<string>();
    const checkinDates = new Set<string>();
    const checkoutDates = new Set<string>();
    for (const range of blockedRanges) {
      const start = new Date(range.start + "T12:00:00");
      const end = new Date(range.end + "T12:00:00");
      checkinDates.add(range.start);
      checkoutDates.add(range.end);
      const cur = new Date(start);
      while (cur < end) {
        bookedInterior.add(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return { bookedInterior, checkinDates, checkoutDates };
  }, [blockedRanges]);

  const today = new Date(new Date().setHours(0, 0, 0, 0));

  const isSaturday = (date: Date) => date.getDay() === 6;

  const isDateUnavailable = (date: Date) => {
    if (date < today) return true;
    if (!isSaturday(date)) return true;
    const key = date.toISOString().split("T")[0];
    // Back-to-back: same Saturday is checkout of one booking AND check-in of next → block
    if (checkinDates.has(key) && checkoutDates.has(key)) return true;
    // Purely interior dates (not a boundary): block
    if (bookedInterior.has(key) && !checkoutDates.has(key) && !checkinDates.has(key)) return true;
    return false;
  };

  const tileDisabled = ({ date }: { date: Date }) => isDateUnavailable(date);

  const tileClassName = ({ date }: { date: Date }) => {
    if (date < today) return "past-tile";

    const key = date.toISOString().split("T")[0];
    const isCheckout = checkoutDates.has(key);
    const isCheckin = checkinDates.has(key);
    const isInterior = bookedInterior.has(key);

    // Check selection state
    if (pendingCheckin) {
      const checkinKey = pendingCheckin.toISOString().split("T")[0];
      if (key === checkinKey) return "selected-checkin-tile";
      if (date > pendingCheckin) {
        if (isCheckin && isCheckout) return "booked-tile"; // back-to-back: fully blocked
        if (isCheckin) return "checkin-tile"; // another booking starts here — can checkout, not check-in
        if (isCheckout) return "checkout-tile";
        if (isInterior) return "booked-tile";
        return null;
      }
    }

    if (isCheckin && isCheckout) return "booked-tile"; // back-to-back: fully blocked
    if (isCheckin) return "checkin-tile"; // another booking starts here — can checkout, not check-in
    if (isCheckout) return "checkout-tile";
    if (isInterior) return "booked-tile";
    return null;
  };

  const handleDayClick = (date: Date) => {
    if (isDateUnavailable(date)) return;
    setRangeError(null);

    if (!pendingCheckin) {
      // First click — set check-in
      const key = date.toISOString().split("T")[0];
      // Back-to-back date (checkout of one booking, check-in of next): can only be used as checkout
      if (checkinDates.has(key)) {
        setRangeError("Another booking starts on that date — you can only check out here, not in. Select an earlier check-in date.");
        return;
      }
      setPendingCheckin(date);
      return;
    }

    // Second click — set checkout
    const diffDays = Math.round((date.getTime() - pendingCheckin.getTime()) / (1000 * 60 * 60 * 24));

    if (date <= pendingCheckin) {
      // Clicked before or same as checkin — restart selection
      setPendingCheckin(date);
      return;
    }

    if (diffDays < 7) {
      setRangeError("Minimum stay is 7 nights (Saturday to Saturday). Please select a later checkout date.");
      return;
    }

    // Check if any date in the range is booked
    const cur = new Date(pendingCheckin);
    cur.setDate(cur.getDate() + 1);
    let hasConflict = false;
    while (cur < date) {
      const key = cur.toISOString().split("T")[0];
      if (bookedInterior.has(key) && !checkoutDates.has(key)) {
        hasConflict = true;
        break;
      }
      cur.setDate(cur.getDate() + 1);
    }

    if (hasConflict) {
      setRangeError("Those dates include a booked night. Please choose a different range.");
      setPendingCheckin(null);
      return;
    }

    // Valid range!
    onRangeSelected?.(pendingCheckin, date);
    setPendingCheckin(null);
  };

  const instruction = pendingCheckin
    ? `Check-in: ${pendingCheckin.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · Now select your check-out Saturday`
    : "Check-in and check-out are Saturdays only · Select your check-in date";

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Instruction bar */}
      <div className="w-full text-center mb-2">
        <p className={`text-sm font-medium ${pendingCheckin ? "text-sky-600" : "text-slate-500"}`}>
          {instruction}
        </p>
        {rangeError && (
          <p className="text-red-500 text-sm mt-1">{rangeError}</p>
        )}
        {pendingCheckin && (
          <button
            onClick={() => { setPendingCheckin(null); setRangeError(null); }}
            className="text-xs text-slate-400 underline mt-1"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="availability-calendar w-full">
        <Calendar
          showDoubleView={!isMobile}
          showNeighboringMonth={false}
          tileDisabled={tileDisabled}
          tileClassName={tileClassName}
          onClickDay={handleDayClick}
          minDate={today}
          minDetail="month"
          calendarType="gregory"
          className="!border-0 !font-sans"
          defaultActiveStartDate={new Date(today.getFullYear(), today.getMonth(), 1)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm bg-white border border-slate-300 inline-block" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm inline-block" style={{ backgroundColor: "#bfdbfe" }} />
          Unavailable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm inline-block border border-slate-200"
            style={{ background: "linear-gradient(135deg, #bfdbfe 50%, #ffffff 50%)" }} />
          Check-in only
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm inline-block border border-slate-200"
            style={{ background: "linear-gradient(135deg, #ffffff 50%, #bfdbfe 50%)" }} />
          Check-out
        </span>
      </div>
    </div>
  );
}
