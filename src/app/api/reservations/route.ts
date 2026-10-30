import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bookingReference } from "@/lib/references";
import { reservationSchema } from "@/lib/validation";
export async function POST(request: NextRequest) {
  const parsed = reservationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid reservation details." }, { status: 400 });
  const data = parsed.data; const expiresAt = new Date(Date.now() + 15 * 60_000);
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const expiredBookings = await tx.booking.findMany({ where: { status: "PENDING_PAYMENT", expiresAt: { lt: new Date() } }, select: { id: true } });
      const expiredIds = expiredBookings.map(({ id }) => id);
      if (expiredIds.length) {
        await tx.bookingSeat.deleteMany({ where: { bookingId: { in: expiredIds } } });
        await tx.payment.updateMany({ where: { bookingId: { in: expiredIds }, status: { in: ["PENDING", "PROCESSING"] } }, data: { status: "EXPIRED" } });
        await tx.booking.updateMany({ where: { id: { in: expiredIds } }, data: { status: "EXPIRED" } });
      }
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Seat" WHERE "id" IN (${Prisma.join(data.seatIds)}) FOR UPDATE`);
      const seats = await tx.seat.findMany({ where: { id: { in: data.seatIds }, tripId: data.tripId }, include: { bookingSeats: true } });
      if (seats.length !== data.seatIds.length || seats.some((seat) => seat.bookingSeats.length)) throw new Error("One or more selected seats are no longer available.");
      const trip = await tx.trip.findUnique({ where: { id: data.tripId } }); if (!trip) throw new Error("Trip not found.");
      const customer = await tx.customer.upsert({ where: { email: data.email }, update: { fullName: data.fullName, phone: data.phone }, create: { fullName: data.fullName, email: data.email, phone: data.phone } });
      return tx.booking.create({ data: { reference: bookingReference(), customerId: customer.id, tripId: trip.id, pickupLocationId: data.pickupLocationId, expiresAt, totalKobo: trip.priceKobo * data.seatIds.length, passengers: { create: data.passengerNames.map((fullName, index) => ({ fullName, isPrimary: index === 0 })) }, seats: { create: data.seatIds.map((seatId) => ({ seatId })) }, payment: { create: { reference: `PAY-${bookingReference()}`, amountKobo: trip.priceKobo * data.seatIds.length } } } });
    });
    return NextResponse.json({ reference: booking.reference, expiresAt: booking.expiresAt }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not reserve seats." }, { status: 409 }); }
}
