import { PrismaClient } from "@prisma/client/edge";

const g = globalThis as typeof globalThis & { __prisma?: PrismaClient };

export function getPrisma(): PrismaClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (g.__prisma) return g.__prisma;
  g.__prisma = new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  return g.__prisma;
}
