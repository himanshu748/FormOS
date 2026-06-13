import { z } from "zod";
import { eq, formViews, forms } from "@formos/db";
import { publicProcedure, router } from "../trpc";

export const viewRouter = router({
  track: publicProcedure
    .meta({
      openapi: {
        summary: "Record a view of a published form (public)",
        description:
          "Called when an anonymous visitor opens a public form. Pairs with a submission via the optional sessionId so completion time can be measured.",
        tags: ["views", "public"],
      },
    })
    .input(
      z.object({
        slug: z.string().min(1),
        sessionId: z.string().max(64).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [form] = await ctx.db
        .select({ id: forms.id, status: forms.status })
        .from(forms)
        .where(eq(forms.slug, input.slug))
        .limit(1);
      if (!form || form.status !== "published") {
        return { ok: false as const };
      }
      await ctx.db
        .insert(formViews)
        .values({ formId: form.id, sessionId: input.sessionId });
      return { ok: true as const };
    }),
});
