import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@formos/api";

/**
 * THE single tRPC HTTP entry point. Every business operation flows through
 * here as a tRPC procedure — there are no REST endpoints for forms,
 * submissions, views, or analytics.
 */
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[tRPC] ${path ?? "<no-path>"}:`, error.message);
      }
    },
  });
}

export { handler as GET, handler as POST };
