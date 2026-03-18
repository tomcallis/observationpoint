"use client";

import { useState } from "react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import BookingModal from "./BookingModal";
import type { BlockedRange } from "@/lib/ical";

interface Props {
  blockedRanges: BlockedRange[];
}

export default function AvailabilitySection({ blockedRanges }: Props) {
  const [booking, setBooking] = useState<{ checkin: Date; checkout: Date } | null>(null);

  return (
    <>
      <AvailabilityCalendar
        blockedRanges={blockedRanges}
        onRangeSelected={(checkin, checkout) => setBooking({ checkin, checkout })}
      />
      {booking && (
        <BookingModal
          checkin={booking.checkin}
          checkout={booking.checkout}
          onClose={() => setBooking(null)}
        />
      )}
    </>
  );
}
