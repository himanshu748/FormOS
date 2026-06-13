import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  and,
  count,
  desc,
  eq,
  FORM_ACCENTS,
  formFieldsSchema,
  forms,
  formSubmissions,
  formViews,
} from "@formos/db";
import type { Context } from "../context";
import { getOrCreateDemoUser } from "../demo-user";
import { serializeForm } from "../serializers";
import { uniqueSlug } from "../slug";
import { protectedProcedure, publicProcedure, router } from "../trpc";

async function loadOwnedForm(ctx: Context, id: string) {
  const user = await getOrCreateDemoUser(ctx.db);
  const [form] = await ctx.db
    .select()
    .from(forms)
    .where(and(eq(forms.id, id), eq(forms.userId, user.id)))
    .limit(1);
  if (!form) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Form not found." });
  }
  return form;
}

export const formRouter = router({
  // --- Management (admin-only) --------------------------------------------
  list: protectedProcedure
    .meta({ openapi: { summary: "List the operator's forms (admin)", tags: ["forms"] } })
    .query(async ({ ctx }) => {
      const user = await getOrCreateDemoUser(ctx.db);
      const rows = await ctx.db
        .select()
        .from(forms)
        .where(eq(forms.userId, user.id))
        .orderBy(desc(forms.updatedAt));

      const viewRows = await ctx.db
        .select({ formId: formViews.formId, c: count() })
        .from(formViews)
        .groupBy(formViews.formId);
      const subRows = await ctx.db
        .select({ formId: formSubmissions.formId, c: count() })
        .from(formSubmissions)
        .groupBy(formSubmissions.formId);

      const views = new Map(viewRows.map((r) => [r.formId, Number(r.c)]));
      const subs = new Map(subRows.map((r) => [r.formId, Number(r.c)]));

      return rows.map((f) => ({
        id: f.id,
        title: f.title,
        description: f.description,
        slug: f.slug,
        status: f.status,
        accent: f.accent,
        fieldCount: f.fields.length,
        views: views.get(f.id) ?? 0,
        submissions: subs.get(f.id) ?? 0,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
        publishedAt: f.publishedAt ? f.publishedAt.toISOString() : null,
      }));
    }),

  byId: protectedProcedure
    .meta({ openapi: { summary: "Get a form by id, for the editor (admin)", tags: ["forms"] } })
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => serializeForm(await loadOwnedForm(ctx, input.id))),

  create: protectedProcedure
    .meta({ openapi: { summary: "Create a new draft form (admin)", tags: ["forms"] } })
    .input(z.object({ title: z.string().min(1).max(300).optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const user = await getOrCreateDemoUser(ctx.db);
      const title = input?.title?.trim() || "Untitled Form";
      const slug = await uniqueSlug(ctx.db, title);
      const [created] = await ctx.db
        .insert(forms)
        .values({ userId: user.id, title, slug })
        .returning();
      if (!created) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Create failed." });
      }
      return serializeForm(created);
    }),

  update: protectedProcedure
    .meta({ openapi: { summary: "Update a form's title, description, accent, or fields (admin)", tags: ["forms"] } })
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(300).optional(),
        description: z.string().max(2000).optional(),
        accent: z.enum(FORM_ACCENTS).optional(),
        fields: formFieldsSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await loadOwnedForm(ctx, input.id);
      const patch: Partial<typeof forms.$inferInsert> = { updatedAt: new Date() };
      if (input.title !== undefined) patch.title = input.title;
      if (input.description !== undefined) patch.description = input.description;
      if (input.accent !== undefined) patch.accent = input.accent;
      if (input.fields !== undefined) patch.fields = input.fields;

      const [updated] = await ctx.db
        .update(forms)
        .set(patch)
        .where(eq(forms.id, existing.id))
        .returning();
      if (!updated) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Update failed." });
      }
      return serializeForm(updated);
    }),

  publish: protectedProcedure
    .meta({ openapi: { summary: "Publish a form so it accepts responses (admin)", tags: ["forms"] } })
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const form = await loadOwnedForm(ctx, input.id);
      if (form.fields.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add at least one field before publishing.",
        });
      }
      const [updated] = await ctx.db
        .update(forms)
        .set({
          status: "published",
          publishedAt: form.publishedAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(forms.id, form.id))
        .returning();
      return serializeForm(updated!);
    }),

  unpublish: protectedProcedure
    .meta({ openapi: { summary: "Return a published form to draft (admin)", tags: ["forms"] } })
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const form = await loadOwnedForm(ctx, input.id);
      const [updated] = await ctx.db
        .update(forms)
        .set({ status: "draft", updatedAt: new Date() })
        .where(eq(forms.id, form.id))
        .returning();
      return serializeForm(updated!);
    }),

  remove: protectedProcedure
    .meta({ openapi: { summary: "Delete a form and all of its data (admin)", tags: ["forms"] } })
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const form = await loadOwnedForm(ctx, input.id);
      await ctx.db.delete(forms).where(eq(forms.id, form.id));
      return { id: form.id };
    }),

  // --- Public --------------------------------------------------------------
  bySlug: publicProcedure
    .meta({
      openapi: {
        summary: "Get a published form by slug (public)",
        description: "Returns a form only if it is published. Used by the public fill page.",
        tags: ["forms", "public"],
      },
    })
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [form] = await ctx.db
        .select()
        .from(forms)
        .where(eq(forms.slug, input.slug))
        .limit(1);
      if (!form || form.status !== "published") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This form isn't published (or doesn't exist).",
        });
      }
      return serializeForm(form);
    }),
});
