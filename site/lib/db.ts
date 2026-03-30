import { sql } from "@vercel/postgres";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "denied"
  | "deposit_paid"
  | "balance_due"
  | "paid_in_full"
  | "cancelled";

export interface Booking {
  id: string;
  created_at: string;
  updated_at: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  num_guests: number;
  check_in: string;
  check_out: string;
  weekly_price: number;
  total_price: number;
  status: BookingStatus;
  notes: string | null;
  owner_token: string;
  stripe_deposit_session_id: string | null;
  stripe_balance_session_id: string | null;
  stripe_customer_id: string | null;
  deposit_paid_at: string | null;
  balance_paid_at: string | null;
}

export interface BookingEvent {
  id: string;
  booking_id: string;
  created_at: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  actor: string;
  note: string | null;
}

export interface BlockedDate {
  id: string;
  check_in: string;
  check_out: string;
  reason: string | null;
}

// ── Schema ─────────────────────────────────────────────────────────────────

export async function runMigration() {
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE booking_status AS ENUM (
          'pending','confirmed','denied',
          'deposit_paid','balance_due','paid_in_full','cancelled'
        );
      END IF;
    END $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT,
      num_guests INTEGER NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      weekly_price INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      status booking_status DEFAULT 'pending',
      notes TEXT,
      owner_token TEXT UNIQUE NOT NULL,
      stripe_deposit_session_id TEXT,
      stripe_balance_session_id TEXT,
      stripe_customer_id TEXT,
      deposit_paid_at TIMESTAMPTZ,
      balance_paid_at TIMESTAMPTZ
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS booking_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id UUID NOT NULL REFERENCES bookings(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      from_status booking_status,
      to_status booking_status NOT NULL,
      actor TEXT NOT NULL,
      note TEXT
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS blocked_dates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      reason TEXT
    );
  `;
}

// ── Bookings ────────────────────────────────────────────────────────────────

export async function createBooking(data: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numGuests: number;
  checkIn: string;
  checkOut: string;
  weeklyPrice: number;
  totalPrice: number;
  ownerToken: string;
}): Promise<Booking> {
  const { rows } = await sql<Booking>`
    INSERT INTO bookings
      (guest_name, guest_email, guest_phone, num_guests, check_in, check_out,
       weekly_price, total_price, owner_token)
    VALUES
      (${data.guestName}, ${data.guestEmail}, ${data.guestPhone}, ${data.numGuests},
       ${data.checkIn}, ${data.checkOut}, ${data.weeklyPrice}, ${data.totalPrice},
       ${data.ownerToken})
    RETURNING *
  `;
  return rows[0];
}

export async function getBookingByToken(token: string): Promise<Booking | null> {
  const { rows } = await sql<Booking>`
    SELECT * FROM bookings WHERE owner_token = ${token}
  `;
  return rows[0] ?? null;
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const { rows } = await sql<Booking>`
    SELECT * FROM bookings WHERE id = ${id}
  `;
  return rows[0] ?? null;
}

export async function getBookingByDepositSession(sessionId: string): Promise<Booking | null> {
  const { rows } = await sql<Booking>`
    SELECT * FROM bookings WHERE stripe_deposit_session_id = ${sessionId}
  `;
  return rows[0] ?? null;
}

export async function getBookingByBalanceSession(sessionId: string): Promise<Booking | null> {
  const { rows } = await sql<Booking>`
    SELECT * FROM bookings WHERE stripe_balance_session_id = ${sessionId}
  `;
  return rows[0] ?? null;
}

export async function listBookings(status?: BookingStatus): Promise<Booking[]> {
  if (status) {
    const { rows } = await sql<Booking>`
      SELECT * FROM bookings WHERE status = ${status} ORDER BY check_in ASC
    `;
    return rows;
  }
  const { rows } = await sql<Booking>`
    SELECT * FROM bookings ORDER BY created_at DESC
  `;
  return rows;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  extra: Record<string, string | null> = {}
): Promise<void> {
  const fields = Object.entries(extra);
  if (fields.length === 0) {
    await sql`
      UPDATE bookings SET status = ${status}, updated_at = NOW() WHERE id = ${id}
    `;
  } else if (fields.length === 1 && fields[0][0] === "stripe_deposit_session_id") {
    await sql`
      UPDATE bookings SET status = ${status}, stripe_deposit_session_id = ${fields[0][1]}, updated_at = NOW() WHERE id = ${id}
    `;
  } else if (fields.length === 1 && fields[0][0] === "stripe_balance_session_id") {
    await sql`
      UPDATE bookings SET status = ${status}, stripe_balance_session_id = ${fields[0][1]}, updated_at = NOW() WHERE id = ${id}
    `;
  } else if (fields.length === 1 && fields[0][0] === "deposit_paid_at") {
    await sql`
      UPDATE bookings SET status = ${status}, deposit_paid_at = NOW(), updated_at = NOW() WHERE id = ${id}
    `;
  } else if (fields.length === 1 && fields[0][0] === "balance_paid_at") {
    await sql`
      UPDATE bookings SET status = ${status}, balance_paid_at = NOW(), updated_at = NOW() WHERE id = ${id}
    `;
  }
}

export async function updateBookingNotes(id: string, notes: string): Promise<void> {
  await sql`
    UPDATE bookings SET notes = ${notes}, updated_at = NOW() WHERE id = ${id}
  `;
}

// ── Events ──────────────────────────────────────────────────────────────────

export async function insertBookingEvent(
  bookingId: string,
  fromStatus: BookingStatus | null,
  toStatus: BookingStatus,
  actor: string,
  note?: string
): Promise<void> {
  await sql`
    INSERT INTO booking_events (booking_id, from_status, to_status, actor, note)
    VALUES (${bookingId}, ${fromStatus}, ${toStatus}, ${actor}, ${note ?? null})
  `;
}

export async function getBookingEvents(bookingId: string): Promise<BookingEvent[]> {
  const { rows } = await sql<BookingEvent>`
    SELECT * FROM booking_events WHERE booking_id = ${bookingId} ORDER BY created_at ASC
  `;
  return rows;
}

// ── Blocked Dates ───────────────────────────────────────────────────────────

export async function listBlockedDates(): Promise<BlockedDate[]> {
  const { rows } = await sql<BlockedDate>`
    SELECT * FROM blocked_dates ORDER BY check_in ASC
  `;
  return rows;
}

export async function createBlockedDate(data: {
  checkIn: string;
  checkOut: string;
  reason: string;
}): Promise<BlockedDate> {
  const { rows } = await sql<BlockedDate>`
    INSERT INTO blocked_dates (check_in, check_out, reason)
    VALUES (${data.checkIn}, ${data.checkOut}, ${data.reason})
    RETURNING *
  `;
  return rows[0];
}

export async function deleteBlockedDate(id: string): Promise<void> {
  await sql`DELETE FROM blocked_dates WHERE id = ${id}`;
}
