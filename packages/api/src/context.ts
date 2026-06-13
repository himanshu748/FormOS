import { db } from "@formos/db";

/**
 * Every tRPC procedure receives this context. Auth is simplified for the demo:
 * management/analytics procedures are gated by a shared admin passcode
 * (ADMIN_TOKEN), presented by the client via the `x-admin-token` header.
 * Public form-filling procedures don't require it.
 */
export interface Context {
  db: typeof db;
  adminToken: string | null;
}

export function createContext(opts?: { headers?: Headers }): Context {
  const adminToken = opts?.headers?.get("x-admin-token") ?? null;
  return { db, adminToken };
}
