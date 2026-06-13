import type { AnswerValue, FormFields } from "@formos/db/fields";

export type Answers = Record<string, AnswerValue>;

/** Client-side mirror of the server submission validation (see packages/api). */
export function validateAnswers(
  fields: FormFields,
  answers: Answers,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const v = answers[f.id];
    const empty =
      v === undefined ||
      v === null ||
      v === "" ||
      (Array.isArray(v) && v.length === 0);

    if (f.required && empty) {
      errors[f.id] = `${f.label} is required.`;
      continue;
    }
    if (empty) continue;

    if (f.type === "email" && typeof v === "string") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        errors[f.id] = "Enter a valid email address.";
      }
    } else if (f.type === "rating" && typeof v === "number") {
      if (v < 1 || v > f.maxRating) errors[f.id] = `Pick 1–${f.maxRating}.`;
    } else if (f.type === "date" && typeof v === "string") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) errors[f.id] = "Pick a valid date.";
    }
  }
  return errors;
}
