import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://formos:formos@localhost:5432/formos";

if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  // Surface a clear warning instead of silently using the dev default.
  console.warn(
    "[@formos/db] DATABASE_URL is not set — falling back to the local default.",
  );
}

/**
 * Reuse a single postgres-js client across hot reloads in development so we
 * don't exhaust the connection pool. postgres-js connects lazily (on the first
 * query), so constructing this at import time is safe during build.
 */
const globalForDb = globalThis as unknown as {
  __formosClient?: ReturnType<typeof postgres>;
};

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

const client =
  globalForDb.__formosClient ??
  // `prepare: false` keeps us compatible with transaction-mode poolers such as
  // Supabase's Supavisor / PgBouncer (used for serverless on Vercel). SSL is
  // required by hosted Postgres (Supabase) but disabled for local Docker.
  postgres(connectionString, {
    max: 10,
    prepare: false,
    ssl: isLocal ? false : "require",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__formosClient = client;
}

export const db = drizzle(client, { schema });
export { client, schema };
export type DB = typeof db;
