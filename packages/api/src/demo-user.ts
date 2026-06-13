import { demoUsers } from "@formos/db";
import type { Context } from "./context";

/**
 * Resolve the single demo operator, creating one on first use so the app works
 * even before `pnpm db:seed` is run. (Auth is intentionally simplified.)
 */
export async function getOrCreateDemoUser(db: Context["db"]) {
  const [existing] = await db.select().from(demoUsers).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(demoUsers)
    .values({ name: "Demo Operator", email: "demo@formos.local" })
    .returning();
  if (!created) throw new Error("Could not create the demo user");
  return created;
}
