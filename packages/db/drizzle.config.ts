import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need a direct (session) connection. On Supabase use the
    // direct connection string here; the app runtime can use the pooled one.
    url:
      process.env.DIRECT_DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgresql://formos:formos@localhost:5432/formos",
  },
  verbose: true,
  strict: true,
});
