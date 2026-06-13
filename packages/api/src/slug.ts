import { eq, forms } from "@formos/db";
import type { Context } from "./context";

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "form";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

/** Produce a slug that is unique within the forms table. */
export async function uniqueSlug(
  db: Context["db"],
  desired: string,
): Promise<string> {
  let slug = slugify(desired);
  for (let attempt = 0; attempt < 5; attempt++) {
    const [hit] = await db
      .select({ id: forms.id })
      .from(forms)
      .where(eq(forms.slug, slug))
      .limit(1);
    if (!hit) return slug;
    slug = `${slugify(desired)}-${randomSuffix()}`;
  }
  return `${slugify(desired)}-${Date.now().toString(36)}`;
}
