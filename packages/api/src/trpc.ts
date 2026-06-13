import { initTRPC, TRPCError } from "@trpc/server";
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
export const middleware = t.middleware;
export const createCallerFactory = t.createCallerFactory;

/** Open to anyone — used for public form-filling (bySlug, view.track, submit). */
export const publicProcedure = t.procedure;

/**
 * Requires the shared admin passcode (ADMIN_TOKEN) via the `x-admin-token`
 * header. Used for all form management and analytics. If ADMIN_TOKEN is not
 * configured, access is denied by default (fail closed).
 */
export const protectedProcedure = t.procedure.use(function isAdmin({ ctx, next }) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || !ctx.adminToken || ctx.adminToken !== expected) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin passcode required.",
    });
  }
  return next();
});

export type { Context };
export type { inferRouterInputs, inferRouterOutputs };
