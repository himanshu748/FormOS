import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { appRouter, type AppRouter } from "./root";
import { createCallerFactory } from "./trpc";

export { appRouter } from "./root";
export type { AppRouter } from "./root";

export { createContext } from "./context";
export type { Context } from "./context";

export { createCallerFactory } from "./trpc";
export type { OpenApiMeta } from "./trpc";

export { generateOpenApiDocument } from "./openapi";
export type { OpenApiDocument, OpenApiDocOptions } from "./openapi";

export { validateSubmission } from "./routers/submission";

export type { FormDTO } from "./serializers";
export type {
  FieldBreakdown,
  RatingBreakdown,
  OptionBreakdown,
} from "./routers/analytics";

/** A server-side caller for SSR / route handlers (no HTTP round-trip). */
export const createCaller = createCallerFactory(appRouter);

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
