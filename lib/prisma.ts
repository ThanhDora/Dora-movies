import { PrismaClient } from "@prisma/client";

const g = globalThis as typeof globalThis & { __prisma?: PrismaClient };

export function getPrisma(): PrismaClient | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const existing = g.__prisma;
  if (existing) {
    try {
      const hasModels = typeof (existing as PrismaClient).userFavorite !== "undefined";
      if (hasModels) return existing;
    } catch {
      //
    }
    try {
      (existing as { $disconnect?: () => Promise<void> }).$disconnect?.();
    } catch {
      //
    }
    g.__prisma = undefined;
  }
  g.__prisma = new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
  return g.__prisma;
}
