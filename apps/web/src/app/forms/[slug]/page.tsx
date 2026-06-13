import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/server/api";
import { FormRunner } from "@/components/form-runner";

// Always rendered on demand (records a view, reads the latest published form).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const form = await api.form.bySlug({ slug }).catch(() => null);
  return {
    title: form ? `${form.title} — FormOS` : "Form not found — FormOS",
    description: form?.description || "Fill out this form, powered by FormOS.",
  };
}

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = await api.form.bySlug({ slug }).catch(() => null);
  if (!form) notFound();
  return <FormRunner slug={slug} initialForm={form} />;
}
