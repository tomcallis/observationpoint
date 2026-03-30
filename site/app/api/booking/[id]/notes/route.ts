import { NextRequest, NextResponse } from "next/server";
import { updateBookingNotes } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { notes } = await req.json();
  await updateBookingNotes(id, notes ?? "");
  return NextResponse.json({ ok: true });
}
