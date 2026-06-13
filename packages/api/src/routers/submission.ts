import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  eq,
  formSubmissions,
  forms,
  submissionDataSchema,
  type FormFields,
  type SubmissionData,
} from "@formos/db";
import { publicProcedure, router } from "../trpc";

/**
 * Server-side validation of a submission against the form's saved schema.
 * This is the source of truth — the client validates too, but never trust it.
 */
export function validateSubmission(
  fields: FormFields,
  data: SubmissionData,
): { errors: Record<string, string>; clean: SubmissionData } {
  const errors: Record<string, string> = {};
  const clean: SubmissionData = {};

  for (const f of fields) {
    const raw = data[f.id];
    const isEmpty =
      raw === undefined ||
      raw === null ||
      raw === "" ||
      (Array.isArray(raw) && raw.length === 0);

    if (isEmpty) {
      if (f.required) {
        errors[f.id] = `${f.label} is required.`;
      } else {
        clean[f.id] = f.type === "checkbox" ? [] : null;
      }
      continue;
    }

    switch (f.type) {
      case "email": {
        const value = String(raw);
        if (!z.string().email().safeParse(value).success) {
          errors[f.id] = `${f.label} must be a valid email address.`;
        } else {
          clean[f.id] = value;
        }
        break;
      }
      case "rating": {
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 1 || n > f.maxRating) {
          errors[f.id] = `${f.label} must be between 1 and ${f.maxRating}.`;
        } else {
          clean[f.id] = Math.round(n);
        }
        break;
      }
      case "dropdown":
      case "multiple_choice": {
        const value = String(raw);
        if (!f.options.some((o) => o.id === value)) {
          errors[f.id] = `${f.label} has an invalid selection.`;
        } else {
          clean[f.id] = value;
        }
        break;
      }
      case "checkbox": {
        const arr = Array.isArray(raw) ? raw.map(String) : [];
        clean[f.id] = arr.filter((id) => f.options.some((o) => o.id === id));
        break;
      }
      case "date": {
        const value = String(raw);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          errors[f.id] = `${f.label} must be a valid date.`;
        } else {
          clean[f.id] = value;
        }
        break;
      }
      case "short_text":
      case "long_text":
      default: {
        clean[f.id] = String(raw).slice(0, 5000);
        break;
      }
    }
  }

  return { errors, clean };
}

export const submissionRouter = router({
  create: publicProcedure
    .meta({
      openapi: {
        summary: "Submit a response to a published form (public, anonymous)",
        description:
          "Validates required fields and value types against the form's saved schema, then stores the response.",
        tags: ["submissions", "public"],
      },
    })
    .input(
      z.object({
        slug: z.string().min(1),
        sessionId: z.string().max(64).optional(),
        durationMs: z.number().int().nonnegative().max(86_400_000).optional(),
        data: submissionDataSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [form] = await ctx.db
        .select()
        .from(forms)
        .where(eq(forms.slug, input.slug))
        .limit(1);
      if (!form || form.status !== "published") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This form isn't accepting responses.",
        });
      }

      const { errors, clean } = validateSubmission(form.fields, input.data);
      if (Object.keys(errors).length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: Object.values(errors)[0] ?? "Some answers need fixing.",
          cause: new Error(JSON.stringify(errors)),
        });
      }

      const [submission] = await ctx.db
        .insert(formSubmissions)
        .values({
          formId: form.id,
          sessionId: input.sessionId,
          data: clean,
          durationMs: input.durationMs,
        })
        .returning();
      if (!submission) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not save." });
      }

      return { id: submission.id, createdAt: submission.createdAt.toISOString() };
    }),
});
