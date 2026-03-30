import { google } from "googleapis";
import type { Booking } from "./db";

const SPREADSHEET_ID = "1Hqq9WOHaPW2yc4KXNZAzsMsthcGZwrIVgrO_kzqnkAw";
const SHEET_NAME = "Website Bookings";

function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) return null;
  const key = JSON.parse(json);
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

const HEADERS = [
  "ID", "Submitted", "Name", "Email", "Phone",
  "Guests", "Check-in", "Check-out", "Total", "Status", "Updated", "Notes",
];

async function ensureSheet(sheets: ReturnType<typeof google.sheets>) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = meta.data.sheets?.some(
    (s) => s.properties?.title === SHEET_NAME
  );
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: SHEET_NAME } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] },
    });
  }
}

function bookingToRow(b: Booking): string[] {
  return [
    b.id,
    b.created_at ? new Date(b.created_at).toLocaleDateString() : "",
    b.guest_name,
    b.guest_email,
    b.guest_phone ?? "",
    String(b.num_guests),
    b.check_in,
    b.check_out,
    `$${(b.total_price / 100).toFixed(2)}`,
    b.status,
    b.updated_at ? new Date(b.updated_at).toLocaleDateString() : "",
    b.notes ?? "",
  ];
}

export async function syncBookingToSheets(booking: Booking): Promise<void> {
  const auth = getAuth();
  if (!auth) return; // Sheets not configured — skip silently

  try {
    const sheets = google.sheets({ version: "v4", auth });
    await ensureSheet(sheets);

    // Find existing row by booking ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const rows = response.data.values ?? [];
    const rowIndex = rows.findIndex((r) => r[0] === booking.id);

    const rowData = bookingToRow(booking);

    if (rowIndex === -1) {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [rowData] },
      });
    } else {
      // Update existing row (1-indexed, +1 for header)
      const sheetRow = rowIndex + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A${sheetRow}`,
        valueInputOption: "RAW",
        requestBody: { values: [rowData] },
      });
    }
  } catch (err) {
    console.error("[sheets] sync error:", err);
    // Never throw — Sheets sync failure should not break the booking flow
  }
}
