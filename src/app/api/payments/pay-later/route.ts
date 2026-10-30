import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { bookingReference } = await request.json().catch(() => ({}));
  if (typeof bookingReference !== "string") return NextResponse.json({ error: "Booking reference is required." }, { status: 400 });
  const booking = await prisma.booking.findUnique({ where: { reference: bookingReference }, include: { payment: true } });
  if (!booking?.payment || booking.status !== "PENDING_PAYMENT" || !booking.expiresAt || booking.expiresAt <= new Date()) {
    return NextResponse.json({ error: "This reservation can no longer be saved for later payment." }, { status: 409 });
  }
  const dueAt = new Date(Date.now() + 24 * 60 * 60_000);
  await prisma.$transaction([
    prisma.booking.update({ where: { id: booking.id }, data: { expiresAt: dueAt } }),
    prisma.payment.update({ where: { id: booking.payment.id }, data: { status: "PENDING" } }),
  ]);
  return NextResponse.json({ dueAt, message: "Your seats are saved for 24 hours. KelvJessia Transport can send a payment reminder." });
}
