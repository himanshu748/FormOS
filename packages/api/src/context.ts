import { db } from "@formos/db";

/**
 * Every tRPC procedure receives this context. Auth is simplified for the demo,
 * so the context just carries the database handle; the "current operator" is
 * resolved on demand via getOrCreateDemoUser().
 */
export interface Context {
  db: typeof db;
}

export function createContext(): Context {
  return { db };
}
