import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.$transaction(async (tx) => tx.booking.updateMany({ where: { status: "PENDING_PAYMENT", expiresAt: { lt: new Date() } }, data: { status: "EXPIRED" } }));
  console.log(`Expired ${result.count} reservation(s).`);
}
main().finally(() => prisma.$disconnect());
