import type { Form } from "@formos/db";

/** Convert a DB form row into a JSON-safe DTO (Dates -> ISO strings). */
export function serializeForm(f: Form) {
  return {
    id: f.id,
    userId: f.userId,
    title: f.title,
    description: f.description,
    slug: f.slug,
    status: f.status,
    accent: f.accent,
    fields: f.fields,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    publishedAt: f.publishedAt ? f.publishedAt.toISOString() : null,
  };
}

export type FormDTO = ReturnType<typeof serializeForm>;
