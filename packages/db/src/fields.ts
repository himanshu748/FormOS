import { z } from "zod";

/**
 * The canonical form-field domain model for FormOS.
 *
 * This module is the single source of truth shared by:
 *  - the database (JSONB column typing in schema.ts),
 *  - the tRPC API (Zod validation of inputs), and
 *  - the web app (rendering the editor and the public form).
 */

export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "email",
  "rating",
  "dropdown",
  "multiple_choice",
  "checkbox",
  "date",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  email: "Email",
  rating: "Rating",
  dropdown: "Dropdown",
  multiple_choice: "Multiple Choice",
  checkbox: "Checkboxes",
  date: "Date",
};

/** Short, friendly description shown in the field palette. */
export const FIELD_TYPE_HINTS: Record<FieldType, string> = {
  short_text: "A single line of text",
  long_text: "A multi-line paragraph",
  email: "A validated email address",
  rating: "A star rating from 1 to N",
  dropdown: "Pick one from a menu",
  multiple_choice: "Pick one with radio buttons",
  checkbox: "Pick many with checkboxes",
  date: "A calendar date",
};

/** Field types that present a fixed list of options to choose from. */
export const OPTION_FIELD_TYPES: readonly FieldType[] = [
  "dropdown",
  "multiple_choice",
  "checkbox",
];

/** Field types we can build per-option analytics for. */
export const ANALYZABLE_FIELD_TYPES: readonly FieldType[] = [
  "rating",
  "dropdown",
  "multiple_choice",
  "checkbox",
];

export function isOptionField(type: FieldType): boolean {
  return OPTION_FIELD_TYPES.includes(type);
}

export const fieldOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, "Option label can't be empty").max(200),
});
export type FieldOption = z.infer<typeof fieldOptionSchema>;

export const fieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1, "Every field needs a label").max(300),
  description: z.string().max(1000).default(""),
  placeholder: z.string().max(300).default(""),
  required: z.boolean().default(false),
  /** Only meaningful for OPTION_FIELD_TYPES. */
  options: z.array(fieldOptionSchema).default([]),
  /** Only meaningful for the "rating" type. */
  maxRating: z.number().int().min(3).max(10).default(5),
});
export type Field = z.infer<typeof fieldSchema>;

export const formFieldsSchema = z.array(fieldSchema);
export type FormFields = z.infer<typeof formFieldsSchema>;

/** A single submitted answer value. */
export const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);
export type AnswerValue = z.infer<typeof answerValueSchema>;

/** The full submission payload: a map of field id -> answer value. */
export const submissionDataSchema = z.record(z.string(), answerValueSchema);
export type SubmissionData = z.infer<typeof submissionDataSchema>;

export const FORM_STATUSES = ["draft", "published"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

/** Retro window accent colors a form can wear. */
export const FORM_ACCENTS = ["teal", "purple", "blue", "magenta", "green"] as const;
export type FormAccent = (typeof FORM_ACCENTS)[number];
