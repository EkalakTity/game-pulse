import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  prismaReplica: PrismaClient;
};

const logConfig =
  process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : (["error"] as const);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: logConfig as ["error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Read replica client — falls back to the primary if DATABASE_REPLICA_URL is not set.
 * Use for read-heavy, analytics, and trending queries to reduce OLTP load.
 */
export const prismaRead: PrismaClient =
  globalForPrisma.prismaReplica ??
  (process.env["DATABASE_REPLICA_URL"]
    ? new PrismaClient({
        datasources: { db: { url: process.env["DATABASE_REPLICA_URL"] } },
        log: logConfig as ["error"],
      })
    : prisma);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaReplica = prismaRead;
}
