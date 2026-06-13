import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { FormAccent, FormFields, FormStatus, SubmissionData } from "./fields";

/**
 * Auth is intentionally simplified for this demo: a single "demo operator"
 * owns the forms in the editor and dashboard. Public form-filling is anonymous.
 */
export const demoUsers = pgTable("demo_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const forms = pgTable(
  "forms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => demoUsers.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    slug: varchar("slug", { length: 80 }).notNull().unique(),
    status: varchar("status", { length: 16 })
      .$type<FormStatus>()
      .notNull()
      .default("draft"),
    fields: jsonb("fields")
      .$type<FormFields>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    accent: varchar("accent", { length: 16 })
      .$type<FormAccent>()
      .notNull()
      .default("teal"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    index("forms_user_idx").on(table.userId),
    index("forms_status_idx").on(table.status),
  ],
);

export const formViews = pgTable(
  "form_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    /** Anonymous per-visit token, used to pair a view with its submission. */
    sessionId: varchar("session_id", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("form_views_form_idx").on(table.formId)],
);

export const formSubmissions = pgTable(
  "form_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    formId: uuid("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    sessionId: varchar("session_id", { length: 64 }),
    data: jsonb("data").$type<SubmissionData>().notNull(),
    /** Milliseconds from first view (same session) to submit, when known. */
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("form_submissions_form_idx").on(table.formId)],
);

export type DemoUser = typeof demoUsers.$inferSelect;
export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type FormView = typeof formViews.$inferSelect;
export type NewFormView = typeof formViews.$inferInsert;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;
