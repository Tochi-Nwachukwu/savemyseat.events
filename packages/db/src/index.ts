import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { PrismaClient } from "./generated/prisma/client";

export * from "./generated/prisma/client";
export { newGuestToken } from "./token";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  // node-postgres over Neon's pooled URL; on Vercel Fluid compute, idle
  // clients are released before a function instance is suspended.
  const pool = new Pool({ connectionString });
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// One client per process, reused across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function client() {
  return (globalForPrisma.prisma ??= createClient());
}

/** Connects on first use, so importing this module never needs DATABASE_URL (e.g. during `next build`). */
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const c = client();
    const value = Reflect.get(c, prop, c);
    return typeof value === "function" ? value.bind(c) : value;
  },
});
