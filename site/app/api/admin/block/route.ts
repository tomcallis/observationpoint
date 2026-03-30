import { NextRequest, NextResponse } from "next/server";
import { listBlockedDates, createBlockedDate, deleteBlockedDate } from "@/lib/db";

export async function GET() {
  const blocks = await listBlockedDates();
  return NextResponse.json(blocks);
}

export async function POST(req: NextRequest) {
  const { checkIn, checkOut, reason } = await req.json();
  if (!checkIn || !checkOut) {
    return NextResponse.json({ error: "checkIn and checkOut required" }, { status: 400 });
  }
  const block = await createBlockedDate({ checkIn, checkOut, reason: reason ?? "" });
  return NextResponse.json(block);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteBlockedDate(id);
  return NextResponse.json({ ok: true });
}
