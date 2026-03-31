#!/usr/bin/env npx tsx
/**
 * Observation Point — End-to-End Flow Test
 *
 * Exercises every API endpoint and triggers every email in the booking lifecycle.
 * Real emails are sent to the configured address so you can verify delivery and content.
 *
 * Usage:
 *   npm run test:flow                                    # test http://localhost:3000
 *   npm run test:flow -- --url https://observationpointnc.com
 *   npm run test:flow -- --url https://observationpointnc.com --email you@example.com
 *
 * Emails triggered:
 *   1. Owner: new booking request (with Confirm/Deny links)
 *   2. Guest: request received
 *   3. Guest: confirmed + payment instructions
 *   4. Guest: deposit received
 *   5. Guest: paid in full
 *   6. Owner: new booking request (deny test)
 *   7. Guest: request received (deny test)
 *   8. Guest: booking denied
 *   9. Guest: pre-arrival info (cron test — requires --cron-secret)
 *
 * Cleanup: Test bookings stay in DB with names "[TEST] …" — visible in admin.
 *          Cancel them manually in the admin UI when done.
 */

import { readFileSync } from "fs";
import { join } from "path";

// ── Load .env.local ───────────────────────────────────────────────────────────
function loadEnvLocal(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(join(process.cwd(), ".env.local"), "utf-8")
        .split("\n")
        .filter((l) => /^[A-Z_]+=/.test(l))
        .map((l) => {
          const eq = l.indexOf("=");
          return [l.slice(0, eq), l.slice(eq + 1).trim()];
        })
    );
  } catch {
    return {};
  }
}

const envLocal = loadEnvLocal();

function getArg(flag: string, fallback: string): string {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const BASE_URL   = getArg("--url",          "http://localhost:3000");
const TEST_EMAIL = getArg("--email",         "tom.callis@gmail.com");
const CRON_SECRET = getArg("--cron-secret", process.env.CRON_SECRET ?? envLocal.CRON_SECRET ?? "");

// ── Output helpers ────────────────────────────────────────────────────────────
const CLR = { G: "\x1b[32m", R: "\x1b[31m", B: "\x1b[36m", Y: "\x1b[33m", DIM: "\x1b[2m", BOLD: "\x1b[1m", X: "\x1b[0m" };
let passed = 0, failed = 0;
const failures: string[] = [];

function ok(label: string, note = "")   { passed++; console.log(`  ${CLR.G}✓${CLR.X} ${label}${note ? `  ${CLR.DIM}${note}${CLR.X}` : ""}`); }
function err(label: string, note = "")  { failed++; failures.push(label + (note ? `: ${note}` : "")); console.log(`  ${CLR.R}✗${CLR.X} ${label}${note ? `  ${CLR.DIM}${note}${CLR.X}` : ""}`); }
function info(msg: string)              { console.log(`     ${CLR.DIM}↳ ${msg}${CLR.X}`); }
function section(title: string)         { console.log(`\n${CLR.B}${CLR.BOLD}── ${title} ${"─".repeat(Math.max(0, 48 - title.length))}${CLR.X}`); }

// ── HTTP helpers ──────────────────────────────────────────────────────────────
async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

async function get(path: string)                  { return req("GET", path); }
async function post(path: string, body: unknown)  { return req("POST", path, body); }
async function patch(path: string, body: unknown) { return req("PATCH", path, body); }
async function del(path: string)                  { return req("DELETE", path); }

// ── Date helpers ──────────────────────────────────────────────────────────────
function saturdayFrom(weeksOut: number): string {
  const d = new Date();
  const daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat + weeksOut * 7);
  return d.toISOString().split("T")[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// Use dates far enough out to avoid conflicting with real bookings
const CHECKIN_A    = saturdayFrom(10);
const CHECKOUT_A   = saturdayFrom(11);
const CHECKIN_B    = saturdayFrom(12);
const CHECKOUT_B   = saturdayFrom(13);
const CHECKIN_PRE  = daysFromNow(7);   // exactly 7 days out — triggers pre-arrival cron
const CHECKOUT_PRE = daysFromNow(14);
const CHECKIN_BLK  = saturdayFrom(15);
const CHECKOUT_BLK = saturdayFrom(16);

const BASE_PAYLOAD = {
  guestPhone: "555-000-0000",
  numGuests: "2",
  referralSource: "Test suite",
  nights: 7,
  season: "Fall",
  baseRate: 1400,
  taxAmount: 178.5,
  total: 1578.5,
  depositAmount: 789.25,
  balanceAmount: 789.25,
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${CLR.BOLD}Observation Point — End-to-End Flow Test${CLR.X}`);
  console.log(`${CLR.DIM}Target : ${BASE_URL}${CLR.X}`);
  console.log(`${CLR.DIM}Emails → ${TEST_EMAIL}${CLR.X}`);
  console.log(`${CLR.DIM}Dates  : confirm flow ${CHECKIN_A}–${CHECKOUT_A} · deny flow ${CHECKIN_B}–${CHECKOUT_B}${CLR.X}`);

  // ── 1. Site reachability ───────────────────────────────────────────────────
  section("Site Reachability");
  try {
    const res = await fetch(BASE_URL);
    res.ok ? ok("Home page loads", `HTTP ${res.status}`) : err("Home page loads", `HTTP ${res.status}`);
  } catch (e) {
    err("Home page loads", String(e));
  }

  // ── 2. Pricing API ─────────────────────────────────────────────────────────
  section("Pricing");
  const { status: rateStatus, data: rateData } = await get("/api/admin/prices?type=seasonal");
  const seasonalPayload = rateData as { seasons?: unknown[] } | null;
  if (rateStatus === 200 && seasonalPayload && Array.isArray(seasonalPayload.seasons)) {
    ok("GET /api/admin/prices?type=seasonal", `${seasonalPayload.seasons.length} seasons`);
  } else {
    err("GET /api/admin/prices?type=seasonal", `HTTP ${rateStatus}`);
  }

  const { status: priceStatus, data: priceData } = await get("/api/admin/prices");
  priceStatus === 200 && priceData
    ? ok("GET /api/admin/prices (weekly overrides)")
    : err("GET /api/admin/prices", `HTTP ${priceStatus}`);

  // ── 3. VRBO feed ───────────────────────────────────────────────────────────
  section("VRBO Calendar Feed");
  const { status: vrboStatus, data: vrboData } = await get("/api/admin/vrbo-feed");
  const vrboPayload = vrboData as { events?: unknown[] } | null;
  if (vrboStatus === 200 && vrboPayload && Array.isArray(vrboPayload.events)) {
    ok("GET /api/admin/vrbo-feed", `${vrboPayload.events.length} events`);
  } else {
    err("GET /api/admin/vrbo-feed", `HTTP ${vrboStatus}`);
  }

  // ── 4. Submit booking (confirm flow) ──────────────────────────────────────
  section("Booking Submission — Confirm Flow");
  info(`Check-in: ${CHECKIN_A}   Check-out: ${CHECKOUT_A}`);
  const { status: s1 } = await post("/api/booking", {
    ...BASE_PAYLOAD,
    guestName: "[TEST] Confirm Flow",
    guestEmail: TEST_EMAIL,
    specialRequests: "Automated test — confirm flow. Please ignore.",
    checkin: CHECKIN_A,
    checkout: CHECKOUT_A,
  });
  if (s1 === 200) {
    ok("POST /api/booking", "booking created");
    info("Email 1/8 → Owner: new booking request (has Confirm/Deny links)");
    info("Email 2/8 → Guest: request received");
  } else {
    err("POST /api/booking", `HTTP ${s1}`);
  }

  // ── 5. Find test booking ──────────────────────────────────────────────────
  section("Admin: Retrieve Booking");
  await new Promise((r) => setTimeout(r, 400));
  const { status: listS, data: allBookings } = await get("/api/admin/bookings");
  let bookingA: Record<string, unknown> | null = null;

  if (listS === 200 && Array.isArray(allBookings)) {
    ok("GET /api/admin/bookings", `${(allBookings as unknown[]).length} total`);
    bookingA = (allBookings as Record<string, unknown>[]).find(
      (b) => b.guest_name === "[TEST] Confirm Flow" && b.check_in === CHECKIN_A
    ) ?? null;
    bookingA
      ? ok("Test booking found in DB", `id: ${String(bookingA.id).slice(0, 8)}…`)
      : err("Test booking found in DB", "not found — DB may not be connected");
  } else {
    err("GET /api/admin/bookings", `HTTP ${listS}`);
  }

  if (!bookingA) {
    console.log(`\n${CLR.Y}  ⚠ Skipping confirm/deposit/payment flow — booking not in DB.${CLR.X}`);
    console.log(`${CLR.DIM}  (DB connection may be missing from this environment)${CLR.X}`);
  } else {
    const bookingId = bookingA.id as string;
    const ownerToken = bookingA.owner_token as string;

    // ── 6. Confirm via owner token ──────────────────────────────────────────
    section("Confirm via Owner Token");
    const confirmRes = await fetch(`${BASE_URL}/api/booking/confirm?token=${ownerToken}`, { redirect: "manual" });
    if ([200, 302, 307].includes(confirmRes.status)) {
      ok("GET /api/booking/confirm?token=…", `HTTP ${confirmRes.status}`);
      info("Email 3/8 → Guest: booking confirmed + check payment instructions");
    } else {
      err("GET /api/booking/confirm?token=…", `HTTP ${confirmRes.status}`);
    }

    await new Promise((r) => setTimeout(r, 400));
    const { data: afterConfirm } = await get("/api/admin/bookings");
    const confirmed = (afterConfirm as Record<string, unknown>[])?.find((b: Record<string, unknown>) => b.id === bookingId);
    confirmed?.status === "confirmed"
      ? ok("Status updated → confirmed")
      : err("Status updated → confirmed", `got: ${confirmed?.status}`);

    // Check event log
    const events = confirmed?.events as unknown[];
    events?.length >= 2
      ? ok("Booking events logged", `${events.length} events`)
      : err("Booking events logged", `expected ≥2, got ${events?.length ?? 0}`);

    // ── 7. Mark deposit received ────────────────────────────────────────────
    section("Admin: Mark Deposit Received");
    const { status: depS } = await post("/api/admin/bookings", { action: "mark-deposit-received", bookingId });
    if (depS === 200) {
      ok("POST action=mark-deposit-received");
      info("Email 4/8 → Guest: deposit received confirmation");
    } else {
      err("POST action=mark-deposit-received", `HTTP ${depS}`);
    }

    // ── 8. Mark paid in full ────────────────────────────────────────────────
    section("Admin: Mark Paid in Full");
    const { status: paidS } = await post("/api/admin/bookings", { action: "mark-paid-in-full", bookingId });
    if (paidS === 200) {
      ok("POST action=mark-paid-in-full");
      info("Email 5/8 → Guest: paid in full + pre-arrival reminder coming");
    } else {
      err("POST action=mark-paid-in-full", `HTTP ${paidS}`);
    }

    await new Promise((r) => setTimeout(r, 300));
    const { data: afterPaid } = await get("/api/admin/bookings");
    const finalB = (afterPaid as Record<string, unknown>[])?.find((b: Record<string, unknown>) => b.id === bookingId);
    finalB?.status === "paid_in_full"
      ? ok("Final status → paid_in_full")
      : err("Final status → paid_in_full", `got: ${finalB?.status}`);

    // ── 9. Notes ────────────────────────────────────────────────────────────
    section("Booking Notes");
    const { status: notesS } = await patch(`/api/booking/${bookingId}/notes`, {
      notes: "Written by automated test suite.",
    });
    notesS === 200
      ? ok("PATCH /api/booking/:id/notes")
      : err("PATCH /api/booking/:id/notes", `HTTP ${notesS}`);
  }

  // ── 10. Deny flow ─────────────────────────────────────────────────────────
  section("Booking Submission — Deny Flow");
  info(`Check-in: ${CHECKIN_B}   Check-out: ${CHECKOUT_B}`);
  const { status: s2 } = await post("/api/booking", {
    ...BASE_PAYLOAD,
    guestName: "[TEST] Deny Flow",
    guestEmail: TEST_EMAIL,
    specialRequests: "Automated test — deny flow. Please ignore.",
    checkin: CHECKIN_B,
    checkout: CHECKOUT_B,
  });
  if (s2 === 200) {
    ok("POST /api/booking", "booking created");
    info("Email 6/8 → Owner: new booking request (has Confirm/Deny links)");
    info("Email 7/8 → Guest: request received");
  } else {
    err("POST /api/booking", `HTTP ${s2}`);
  }

  await new Promise((r) => setTimeout(r, 400));
  const { data: allB2 } = await get("/api/admin/bookings");
  const bookingB = Array.isArray(allB2)
    ? (allB2 as Record<string, unknown>[]).find((b) => b.guest_name === "[TEST] Deny Flow" && b.check_in === CHECKIN_B)
    : null;

  if (bookingB?.owner_token) {
    const denyRes = await fetch(`${BASE_URL}/api/booking/deny?token=${bookingB.owner_token as string}`, { redirect: "manual" });
    if ([200, 302, 307].includes(denyRes.status)) {
      ok("GET /api/booking/deny?token=…", `HTTP ${denyRes.status}`);
      info("Email 8/8 → Guest: booking denied");
    } else {
      err("GET /api/booking/deny?token=…", `HTTP ${denyRes.status}`);
    }

    await new Promise((r) => setTimeout(r, 300));
    const { data: afterDeny } = await get("/api/admin/bookings");
    const denied = (afterDeny as Record<string, unknown>[])?.find((b: Record<string, unknown>) => b.id === bookingB.id);
    denied?.status === "denied"
      ? ok("Status updated → denied")
      : err("Status updated → denied", `got: ${denied?.status}`);
  } else {
    console.log(`  ${CLR.Y}⚠ Deny flow: booking not in DB — email links still work via token in email${CLR.X}`);
  }

  // ── 11. Cron endpoints ────────────────────────────────────────────────────
  section("Cron Endpoints");
  if (!CRON_SECRET) {
    console.log(`  ${CLR.Y}⚠ CRON_SECRET not set — pass --cron-secret <secret> or set in .env.local${CLR.X}`);
  } else {
    const { status: balS, data: balD } = await get(`/api/cron/balance-reminders?secret=${CRON_SECRET}`);
    balS === 200
      ? ok("/api/cron/balance-reminders", `processed: ${(balD as Record<string, unknown>)?.processed ?? 0}`)
      : err("/api/cron/balance-reminders", `HTTP ${balS}`);

    const { status: preS, data: preD } = await get(`/api/cron/pre-arrival?secret=${CRON_SECRET}`);
    preS === 200
      ? ok("/api/cron/pre-arrival", `sent: ${(preD as Record<string, unknown>)?.sent ?? 0}`)
      : err("/api/cron/pre-arrival", `HTTP ${preS}`);
  }

  // ── 12. Blocked dates ─────────────────────────────────────────────────────
  section("Blocked Dates");
  const { status: blkS, data: blkD } = await post("/api/admin/block", {
    checkIn: CHECKIN_BLK,
    checkOut: CHECKOUT_BLK,
    reason: "Test block — automated test suite",
  });
  if (blkS === 200 || blkS === 201) {
    ok("POST /api/admin/block");
    const blkId = (blkD as Record<string, unknown>)?.id as string;
    if (blkId) {
      const { status: getBlkS, data: blkList } = await get("/api/admin/block");
      getBlkS === 200 && Array.isArray(blkList)
        ? ok("GET /api/admin/block", `${(blkList as unknown[]).length} blocks`)
        : err("GET /api/admin/block", `HTTP ${getBlkS}`);

      const { status: delS } = await del(`/api/admin/block?id=${blkId}`);
      delS === 200 ? ok("DELETE /api/admin/block") : err("DELETE /api/admin/block", `HTTP ${delS}`);
    }
  } else {
    err("POST /api/admin/block", `HTTP ${blkS}`);
  }

  // ── 13. CSV export ────────────────────────────────────────────────────────
  section("CSV Export");
  const exportRes = await fetch(`${BASE_URL}/api/admin/export`);
  const exportText = await exportRes.text();
  if (exportRes.status === 200 && exportText.startsWith('"ID"')) {
    const lines = exportText.trim().split("\n").length;
    ok("GET /api/admin/export", `${lines - 1} booking rows`);
  } else {
    err("GET /api/admin/export", `HTTP ${exportRes.status}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(52)}`);
  console.log(`${CLR.BOLD}Results: ${CLR.G}✓${CLR.X}${CLR.BOLD} ${passed} passed   ${CLR.R}✗${CLR.X}${CLR.BOLD} ${failed} failed${CLR.X}`);

  if (failures.length) {
    console.log(`\n${CLR.BOLD}Failed:${CLR.X}`);
    for (const f of failures) console.log(`  ${CLR.R}✗${CLR.X} ${f}`);
  }

  if (failed === 0) {
    console.log(`\n${CLR.G}${CLR.BOLD}All checks passed.${CLR.X}`);
  }

  console.log(`\n${CLR.DIM}Check ${TEST_EMAIL} for 8 test emails. Test bookings are in the admin`);
  console.log(`as "[TEST] Confirm Flow" and "[TEST] Deny Flow" — cancel them when done.${CLR.X}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("\nUnhandled error:", e);
  process.exit(1);
});
