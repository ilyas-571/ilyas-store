import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Explicit SSL for Neon and other managed Postgres providers
  ssl: { rejectUnauthorized: false },
  // Limit connections for serverless (each cold start gets its own pool)
  max: 10,
  // Release idle clients after 30s to prevent connection leaks
  idleTimeoutMillis: 30_000,
  // Fail fast if pool is full rather than queueing indefinitely
  connectionTimeoutMillis: 10_000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
