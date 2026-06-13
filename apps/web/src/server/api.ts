import "server-only";
import { createCaller, createContext } from "@formos/api";

/**
 * A server-side tRPC caller for use in Server Components / route handlers.
 * Calls procedures directly (no HTTP round-trip) — still the same procedures,
 * not a separate API.
 */
export const api = createCaller(createContext());
