import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@formos/api";

/** Type-only import of AppRouter — no server code reaches the client bundle. */
export const trpc = createTRPCReact<AppRouter>();
