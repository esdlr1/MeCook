import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for Prisma Postgres adapter.");
}

// Force IPv4 loopback to avoid intermittent localhost resolution timeouts on Windows.
const normalizedConnectionString = connectionString.replace("@localhost:", "@127.0.0.1:");

const adapter = new PrismaPg(
  new Pool({
    connectionString: normalizedConnectionString,
    max: 1,
    connectionTimeoutMillis: 60000,
    idleTimeoutMillis: 30000,
    allowExitOnIdle: false,
  }),
);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
