import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  count,
  desc,
  eq,
  formSubmissions,
  formViews,
  forms,
} from "@formos/db";
import type { Context } from "../context";
import { publicProcedure, router } from "../trpc";

export type RatingBreakdown = {
  fieldId: string;
  label: string;
  type: "rating";
  maxRating: number;
  responses: number;
  average: number | null;
  distribution: { value: number; count: number }[];
};

export type OptionBreakdown = {
  fieldId: string;
  label: string;
  type: "dropdown" | "multiple_choice" | "checkbox";
  responses: number;
  options: { id: string; label: string; count: number }[];
};

export type FieldBreakdown = RatingBreakdown | OptionBreakdown;

async function getForm(ctx: Context, id: string) {
  const [form] = await ctx.db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!form) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
  return form;
}

const formIdInput = z.object({ formId: z.string().uuid() });

export const analyticsRouter = router({
  overview: publicProcedure
    .meta({ openapi: { summary: "Headline analytics for a form", tags: ["analytics"] } })
    .input(formIdInput)
    .query(async ({ ctx, input }) => {
      await getForm(ctx, input.formId);

      const [viewRow] = await ctx.db
        .select({ c: count() })
        .from(formViews)
        .where(eq(formViews.formId, input.formId));
      const subs = await ctx.db
        .select({
          durationMs: formSubmissions.durationMs,
          createdAt: formSubmissions.createdAt,
        })
        .from(formSubmissions)
        .where(eq(formSubmissions.formId, input.formId));

      const views = Number(viewRow?.c ?? 0);
      const submissions = subs.length;
      const durations = subs
        .map((s) => s.durationMs)
        .filter((d): d is number => typeof d === "number");
      const avgCompletionMs = durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;
      const lastSubmissionAt = subs.length
        ? new Date(Math.max(...subs.map((s) => +s.createdAt))).toISOString()
        : null;

      return {
        views,
        submissions,
        completionRate: views > 0 ? submissions / views : 0,
        avgCompletionMs,
        lastSubmissionAt,
      };
    }),

  fieldBreakdown: publicProcedure
    .meta({ openapi: { summary: "Per-field analytics (rating / choice fields)", tags: ["analytics"] } })
    .input(formIdInput)
    .query(async ({ ctx, input }) => {
      const form = await getForm(ctx, input.formId);
      const rows = await ctx.db
        .select({ data: formSubmissions.data })
        .from(formSubmissions)
        .where(eq(formSubmissions.formId, input.formId));
      const datas = rows.map((r) => r.data);

      const result: FieldBreakdown[] = [];
      for (const f of form.fields) {
        if (f.type === "rating") {
          const distribution = Array.from({ length: f.maxRating }, (_, i) => ({
            value: i + 1,
            count: 0,
          }));
          let sum = 0;
          let responses = 0;
          for (const d of datas) {
            const v = d[f.id];
            if (typeof v === "number" && v >= 1 && v <= f.maxRating) {
              distribution[v - 1]!.count += 1;
              sum += v;
              responses += 1;
            }
          }
          result.push({
            fieldId: f.id,
            label: f.label,
            type: "rating",
            maxRating: f.maxRating,
            responses,
            average: responses ? sum / responses : null,
            distribution,
          });
        } else if (
          f.type === "dropdown" ||
          f.type === "multiple_choice" ||
          f.type === "checkbox"
        ) {
          const tally = new Map(f.options.map((o) => [o.id, 0]));
          let responses = 0;
          for (const d of datas) {
            const v = d[f.id];
            if (f.type === "checkbox") {
              if (Array.isArray(v) && v.length) {
                responses += 1;
                for (const id of v) {
                  if (tally.has(id)) tally.set(id, (tally.get(id) ?? 0) + 1);
                }
              }
            } else if (typeof v === "string" && tally.has(v)) {
              responses += 1;
              tally.set(v, (tally.get(v) ?? 0) + 1);
            }
          }
          result.push({
            fieldId: f.id,
            label: f.label,
            type: f.type,
            responses,
            options: f.options.map((o) => ({
              id: o.id,
              label: o.label,
              count: tally.get(o.id) ?? 0,
            })),
          });
        }
      }
      return { fields: result };
    }),

  responses: publicProcedure
    .meta({ openapi: { summary: "Paginated response table for a form", tags: ["analytics"] } })
    .input(
      formIdInput.extend({
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().nonnegative().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const form = await getForm(ctx, input.formId);
      const rows = await ctx.db
        .select()
        .from(formSubmissions)
        .where(eq(formSubmissions.formId, input.formId))
        .orderBy(desc(formSubmissions.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      const [totalRow] = await ctx.db
        .select({ c: count() })
        .from(formSubmissions)
        .where(eq(formSubmissions.formId, input.formId));

      return {
        fields: form.fields.map((f) => ({ id: f.id, label: f.label, type: f.type })),
        total: Number(totalRow?.c ?? 0),
        rows: rows.map((r) => ({
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          durationMs: r.durationMs,
          data: r.data,
        })),
      };
    }),
});
