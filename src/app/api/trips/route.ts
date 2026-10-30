import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const trip = await prisma.trip.findFirst({
    where: { departureAt: { gt: new Date() }, status: "SCHEDULED" },
    orderBy: { departureAt: "asc" },
    include: {
      route: true,
      pickups: { include: { pickupLocation: true }, orderBy: { pickupAt: "asc" } },
      seats: { include: { bookingSeats: true }, orderBy: { number: "asc" } },
    },
  });
  if (!trip) return NextResponse.json({ error: "No scheduled trips are available." }, { status: 404 });
  const pickup = trip.pickups[0];
  if (!pickup) return NextResponse.json({ error: "This trip has no pickup point." }, { status: 409 });
  return NextResponse.json({
    id: trip.id,
    route: `${trip.route.origin} → ${trip.route.destination}`,
    departureAt: trip.departureAt,
    priceKobo: trip.priceKobo,
    pickup: { id: pickup.pickupLocation.id, name: pickup.pickupLocation.name, pickupAt: pickup.pickupAt, estimatedDropoffAt: pickup.estimatedDropoffAt },
    seats: trip.seats.filter((seat) => seat.bookingSeats.length === 0).map((seat) => ({ id: seat.id, number: seat.number })),
  });
}
