import { PrismaClient } from "@prisma/client/edge";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  return (
    globalForPrisma.prisma ??
    new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] })
  );
}

export const prisma = createPrisma();

if (prisma && process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
