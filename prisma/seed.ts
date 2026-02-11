import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.vipPlan.count();
  if (count > 0) return;
  await prisma.vipPlan.createMany({
    data: [
      { name: "1 tháng", durationDays: 30, amount: 50000, active: true },
      { name: "1 tháng (Premium)", durationDays: 30, amount: 100000, active: true },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
