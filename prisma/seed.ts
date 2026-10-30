import { PrismaClient, UserRole } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const route = await prisma.route.upsert({ where: { origin_destination: { origin: "Lagos", destination: "Ibadan" } }, update: {}, create: { origin: "Lagos", destination: "Ibadan", durationMinutes: 150 } });
  const pickup = await prisma.pickupLocation.upsert({ where: { id: "cm0kelvjjpickup000000000001" }, update: {}, create: { id: "cm0kelvjjpickup000000000001", name: "Augustine University", address: "Ilara, Epe, Lagos" } });
  const vehicle = await prisma.vehicle.upsert({ where: { registrationNumber: "KJ-DEMO-001" }, update: {}, create: { registrationNumber: "KJ-DEMO-001", name: "Demo Coach", seatCapacity: 14 } });
  const user = await prisma.user.upsert({ where: { email: "admin@example.test" }, update: {}, create: { email: "admin@example.test", name: "Demo Administrator", passwordHash: "Replace-with-a-hash-before-use", role: UserRole.ADMIN } });
  const departure = new Date(); departure.setDate(departure.getDate() + 1); departure.setHours(8, 0, 0, 0);
  const trip = await prisma.trip.create({ data: { routeId: route.id, vehicleId: vehicle.id, departureAt: departure, priceKobo: 1250000, pickups: { create: { pickupLocationId: pickup.id, pickupAt: departure, estimatedDropoffAt: new Date(departure.getTime() + 150 * 60_000) } } } });
  await prisma.seat.createMany({ data: Array.from({ length: 14 }, (_, i) => ({ tripId: trip.id, number: String(i + 1) })) });
  console.log({ route: route.id, trip: trip.id, admin: user.email });
}
main().finally(() => prisma.$disconnect());
