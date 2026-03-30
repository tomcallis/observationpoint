import { NextResponse } from "next/server";
import { listBookings } from "@/lib/db";

export async function GET() {
  const bookings = await listBookings();

  const headers = [
    "ID", "Submitted", "Name", "Email", "Phone", "Guests",
    "Check-in", "Check-out", "Weekly Rate", "Total", "Status",
    "Deposit Paid", "Balance Paid", "Notes",
  ];

  const rows = bookings.map((b) => [
    b.id,
    b.created_at ? new Date(b.created_at).toLocaleDateString() : "",
    b.guest_name,
    b.guest_email,
    b.guest_phone ?? "",
    String(b.num_guests),
    b.check_in,
    b.check_out,
    `$${(b.weekly_price / 100).toFixed(2)}`,
    `$${(b.total_price / 100).toFixed(2)}`,
    b.status,
    b.deposit_paid_at ? new Date(b.deposit_paid_at).toLocaleDateString() : "",
    b.balance_paid_at ? new Date(b.balance_paid_at).toLocaleDateString() : "",
    (b.notes ?? "").replace(/"/g, '""'),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
