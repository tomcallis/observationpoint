import { neon } from "@neondatabase/serverless";

function getSQL() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return neon(process.env.DATABASE_URL);
}

// Neon returns DATE columns as JS Date objects — normalize to ISO strings
function toDateStr(v: unknown): string {
  if (v instanceof Date) return v.toISOString().split("T")[0];
  return String(v ?? "");
}
function toTsStr(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return String(v ?? "");
}
function normalizeBooking(row: Record<string, unknown>): Booking {
  return {
    ...row,
    check_in: toDateStr(row.check_in),
    check_out: toDateStr(row.check_out),
    created_at: toTsStr(row.created_at),
    updated_at: toTsStr(row.updated_at),
    deposit_paid_at: row.deposit_paid_at ? toTsStr(row.deposit_paid_at) : null,
    balance_paid_at: row.balance_paid_at ? toTsStr(row.balance_paid_at) : null,
  } as Booking;
}
function normalizeEvent(row: Record<string, unknown>): BookingEvent {
  return { ...row, created_at: toTsStr(row.created_at) } as BookingEvent;
}
function normalizeBlock(row: Record<string, unknown>): BlockedDate {
  return {
    ...row,
    check_in: toDateStr(row.check_in),
    check_out: toDateStr(row.check_out),
  } as BlockedDate;
}

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
  stripe_payment_method_id: string | null;
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
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO bookings
      (guest_name, guest_email, guest_phone, num_guests, check_in, check_out,
       weekly_price, total_price, owner_token)
    VALUES
      (${data.guestName}, ${data.guestEmail}, ${data.guestPhone}, ${data.numGuests},
       ${data.checkIn}, ${data.checkOut}, ${data.weeklyPrice}, ${data.totalPrice},
       ${data.ownerToken})
    RETURNING *
  `;
  return normalizeBooking(rows[0] as Record<string, unknown>);
}

export async function getBookingByToken(token: string): Promise<Booking | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM bookings WHERE owner_token = ${token}`;
  return rows[0] ? normalizeBooking(rows[0] as Record<string, unknown>) : null;
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM bookings WHERE id = ${id}`;
  return rows[0] ? normalizeBooking(rows[0] as Record<string, unknown>) : null;
}

export async function getBookingByDepositSession(sessionId: string): Promise<Booking | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM bookings WHERE stripe_deposit_session_id = ${sessionId}`;
  return rows[0] ? normalizeBooking(rows[0] as Record<string, unknown>) : null;
}

export async function getBookingByBalanceSession(sessionId: string): Promise<Booking | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM bookings WHERE stripe_balance_session_id = ${sessionId}`;
  return rows[0] ? normalizeBooking(rows[0] as Record<string, unknown>) : null;
}

export async function listBookings(status?: BookingStatus): Promise<Booking[]> {
  const sql = getSQL();
  if (status) {
    const rows = await sql`SELECT * FROM bookings WHERE status = ${status} ORDER BY check_in ASC`;
    return (rows as Record<string, unknown>[]).map(normalizeBooking);
  }
  const rows = await sql`SELECT * FROM bookings ORDER BY created_at DESC`;
  return (rows as Record<string, unknown>[]).map(normalizeBooking);
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  extra: Record<string, string | null> = {}
): Promise<void> {
  const sql = getSQL();
  const fields = Object.entries(extra);
  if (fields.length === 0) {
    await sql`UPDATE bookings SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
  } else if (fields[0][0] === "stripe_deposit_session_id") {
    await sql`UPDATE bookings SET status = ${status}, stripe_deposit_session_id = ${fields[0][1]}, updated_at = NOW() WHERE id = ${id}`;
  } else if (fields[0][0] === "stripe_balance_session_id") {
    await sql`UPDATE bookings SET status = ${status}, stripe_balance_session_id = ${fields[0][1]}, updated_at = NOW() WHERE id = ${id}`;
  } else if (fields[0][0] === "deposit_paid_at") {
    await sql`UPDATE bookings SET status = ${status}, deposit_paid_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
  } else if (fields[0][0] === "balance_paid_at") {
    await sql`UPDATE bookings SET status = ${status}, balance_paid_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
  }
}

export async function saveDepositPaymentInfo(
  id: string,
  customerId: string | null,
  paymentMethodId: string | null,
): Promise<void> {
  const sql = getSQL();
  await sql`
    UPDATE bookings
    SET stripe_customer_id = ${customerId},
        stripe_payment_method_id = ${paymentMethodId},
        deposit_paid_at = NOW(),
        status = 'deposit_paid',
        updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function updateBookingNotes(id: string, notes: string): Promise<void> {
  const sql = getSQL();
  await sql`UPDATE bookings SET notes = ${notes}, updated_at = NOW() WHERE id = ${id}`;
}

// ── Events ──────────────────────────────────────────────────────────────────

export async function insertBookingEvent(
  bookingId: string,
  fromStatus: BookingStatus | null,
  toStatus: BookingStatus,
  actor: string,
  note?: string
): Promise<void> {
  const sql = getSQL();
  await sql`
    INSERT INTO booking_events (booking_id, from_status, to_status, actor, note)
    VALUES (${bookingId}, ${fromStatus}, ${toStatus}, ${actor}, ${note ?? null})
  `;
}

export async function getBookingEvents(bookingId: string): Promise<BookingEvent[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM booking_events WHERE booking_id = ${bookingId} ORDER BY created_at ASC`;
  return (rows as Record<string, unknown>[]).map(normalizeEvent);
}

// ── Blocked Dates ───────────────────────────────────────────────────────────

export async function listBlockedDates(): Promise<BlockedDate[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM blocked_dates ORDER BY check_in ASC`;
  return (rows as Record<string, unknown>[]).map(normalizeBlock);
}

export async function createBlockedDate(data: {
  checkIn: string;
  checkOut: string;
  reason: string;
}): Promise<BlockedDate> {
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO blocked_dates (check_in, check_out, reason)
    VALUES (${data.checkIn}, ${data.checkOut}, ${data.reason})
    RETURNING *
  `;
  return normalizeBlock(rows[0] as Record<string, unknown>);
}

export async function deleteBlockedDate(id: string): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM blocked_dates WHERE id = ${id}`;
}

export async function deleteBooking(id: string): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM booking_events WHERE booking_id = ${id}`;
  await sql`DELETE FROM bookings WHERE id = ${id}`;
}

// ── Settings (key/value store) ───────────────────────────────────────────────

async function ensureSettingsTable() {
  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function getSetting(key: string): Promise<unknown | null> {
  await ensureSettingsTable();
  const sql = getSQL();
  const rows = await sql`SELECT value FROM settings WHERE key = ${key}`;
  return rows[0] ? (rows[0] as Record<string, unknown>).value : null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await ensureSettingsTable();
  const sql = getSQL();
  const json = JSON.stringify(value);
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${json}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = ${json}::jsonb, updated_at = NOW()
  `;
}
