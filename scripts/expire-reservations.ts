import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const expired = await tx.booking.findMany({
      where: { status: "PENDING_PAYMENT", expiresAt: { lt: now } },
      select: { id: true },
    });
    const bookingIds = expired.map(({ id }) => id);
    if (!bookingIds.length) return 0;

    await tx.bookingSeat.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await tx.payment.updateMany({
      where: { bookingId: { in: bookingIds }, status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "EXPIRED" },
    });
    await tx.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status: "EXPIRED" },
    });
    return bookingIds.length;
  });
  console.log(`Expired ${result} reservation(s).`);
}

main().finally(() => prisma.$disconnect());
