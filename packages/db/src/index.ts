export * from "./schema";
export * from "./fields";
export { db, client, schema } from "./client";
export type { DB } from "./client";

// Re-export the drizzle operators the API layer needs, so consumers can pull
// everything db-related from "@formos/db".
export {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
