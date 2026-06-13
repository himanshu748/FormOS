import { initTRPC } from "@trpc/server";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { ZodError } from "zod";
import type { Context } from "./context";

/**
 * Metadata we attach to procedures so the OpenAPI generator (openapi.ts) can
 * produce accurate, human-friendly docs straight from the real procedures.
 */
export interface OpenApiMeta {
  openapi?: {
    summary?: string;
    description?: string;
    tags?: string[];
  };
}

const t = initTRPC
  .context<Context>()
  .meta<OpenApiMeta>()
  .create({
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.cause instanceof ZodError ? error.cause.flatten() : null,
        },
      };
    },
  });

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const createCallerFactory = t.createCallerFactory;

export type { Context };
export type { inferRouterInputs, inferRouterOutputs };
