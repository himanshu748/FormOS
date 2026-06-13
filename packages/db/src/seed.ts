import "dotenv/config";
import { sql } from "drizzle-orm";
import { client, db } from "./client";
import type { Field, FormFields, SubmissionData } from "./fields";
import {
  demoUsers,
  formSubmissions,
  formViews,
  forms,
  type NewFormSubmission,
  type NewFormView,
} from "./schema";

/** Build a complete Field from a partial, filling in the usual defaults. */
function field(
  f: Partial<Field> & Pick<Field, "id" | "type" | "label">,
): Field {
  return {
    description: "",
    placeholder: "",
    required: false,
    options: [],
    maxRating: 5,
    ...f,
  };
}

// Tiny deterministic RNG so reseeding produces stable-ish demo data.
let _seed = 1337;
function rnd(): number {
  _seed = (_seed * 1664525 + 1013904223) % 4294967296;
  return _seed / 4294967296;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)] as T;
}
function pickSubset<T>(arr: readonly T[], min = 1): T[] {
  const chosen = arr.filter(() => rnd() > 0.45);
  if (chosen.length < min) chosen.push(pick(arr));
  return chosen;
}
function intBetween(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

// --- Onboarding form field ids -------------------------------------------
const F1 = {
  name: "f1_name",
  email: "f1_email",
  experience: "f1_experience",
  tracks: "f1_tracks",
  excited: "f1_excited",
  goals: "f1_goals",
  consent: "f1_consent",
  start: "f1_start",
} as const;

const onboardingFields: FormFields = [
  field({ id: F1.name, type: "short_text", label: "What's your name?", placeholder: "Ada Lovelace", required: true }),
  field({ id: F1.email, type: "email", label: "Email address", placeholder: "you@example.com", required: true }),
  field({
    id: F1.experience,
    type: "dropdown",
    label: "How would you rate your coding experience?",
    required: true,
    options: [
      { id: "exp_beg", label: "Beginner" },
      { id: "exp_int", label: "Intermediate" },
      { id: "exp_adv", label: "Advanced" },
    ],
  }),
  field({
    id: F1.tracks,
    type: "checkbox",
    label: "Which tracks are you interested in?",
    description: "Pick as many as you like.",
    options: [
      { id: "trk_web", label: "Web Dev" },
      { id: "trk_gen", label: "GenAI" },
      { id: "trk_dev", label: "DevOps" },
      { id: "trk_data", label: "Data Engineering" },
    ],
  }),
  field({ id: F1.excited, type: "rating", label: "How excited are you to start?", required: true, maxRating: 5 }),
  field({ id: F1.goals, type: "long_text", label: "What do you want to build?", placeholder: "Tell us about your dream project..." }),
  field({
    id: F1.consent,
    type: "multiple_choice",
    label: "Code of conduct",
    required: true,
    options: [
      { id: "cons_yes", label: "I agree to the code of conduct" },
    ],
  }),
  field({ id: F1.start, type: "date", label: "When can you start?" }),
];

// --- Feedback form field ids ---------------------------------------------
const F2 = {
  rating: "f2_rating",
  recommend: "f2_recommend",
  likes: "f2_likes",
  comments: "f2_comments",
} as const;

const feedbackFields: FormFields = [
  field({ id: F2.rating, type: "rating", label: "How would you rate today's session?", required: true, maxRating: 5 }),
  field({
    id: F2.recommend,
    type: "dropdown",
    label: "Would you recommend it to a friend?",
    required: true,
    options: [
      { id: "rec_yes", label: "Absolutely" },
      { id: "rec_maybe", label: "Maybe" },
      { id: "rec_no", label: "Not really" },
    ],
  }),
  field({
    id: F2.likes,
    type: "multiple_choice",
    label: "What did you enjoy the most?",
    options: [
      { id: "like_content", label: "The content" },
      { id: "like_speaker", label: "The speaker" },
      { id: "like_pace", label: "The pace" },
      { id: "like_demos", label: "The live demos" },
    ],
  }),
  field({ id: F2.comments, type: "long_text", label: "Anything else to share?", placeholder: "Your honest feedback..." }),
];

// --- Draft form ----------------------------------------------------------
const bugReportFields: FormFields = [
  field({ id: "f3_title", type: "short_text", label: "Bug title", required: true, placeholder: "Short summary" }),
  field({
    id: "f3_sev",
    type: "dropdown",
    label: "Severity",
    options: [
      { id: "sev_low", label: "Low" },
      { id: "sev_med", label: "Medium" },
      { id: "sev_high", label: "High" },
      { id: "sev_crit", label: "Critical" },
    ],
  }),
  field({ id: "f3_desc", type: "long_text", label: "What happened?", required: true }),
  field({ id: "f3_email", type: "email", label: "Your email (optional)" }),
];

const NAMES = [
  "Ada Lovelace", "Grace Hopper", "Linus T.", "Margaret H.", "Dennis R.",
  "Barbara L.", "Ken T.", "Radia P.", "Guido v.R.", "Anita B.",
];
const GOALS = [
  "A SaaS for my college fest.",
  "An AI study buddy.",
  "A portfolio that actually converts.",
  "",
  "A real-time multiplayer game.",
  "Honestly, just want to land an internship.",
  "",
  "A tool to manage my freelance clients.",
];
const DATES = ["2026-07-01", "2026-07-07", "2026-07-15", "2026-08-01"];
const COMMENTS = [
  "Loved the energy!", "More live coding please.", "", "Perfect pacing.",
  "The demos were 🔥", "", "Could be a bit longer.", "Best session so far.",
];

function makeViewsAndSubmissions(
  formId: string,
  fields: FormFields,
  totalViews: number,
  totalSubs: number,
): { views: NewFormView[]; subs: NewFormSubmission[] } {
  const views: NewFormView[] = [];
  const subs: NewFormSubmission[] = [];
  for (let i = 0; i < totalViews; i++) {
    const sessionId = `seed_${formId.slice(0, 8)}_${i}`;
    views.push({ formId, sessionId });
    if (i < totalSubs) {
      const data: SubmissionData = {};
      for (const f of fields) {
        switch (f.type) {
          case "short_text":
            data[f.id] = pick(NAMES);
            break;
          case "email":
            data[f.id] = `user${i}@example.com`;
            break;
          case "long_text":
            data[f.id] = f.id === F2.comments ? pick(COMMENTS) : pick(GOALS);
            break;
          case "rating":
            data[f.id] = intBetween(3, f.maxRating);
            break;
          case "date":
            data[f.id] = pick(DATES);
            break;
          case "dropdown":
          case "multiple_choice":
            data[f.id] = f.options.length ? pick(f.options).id : null;
            break;
          case "checkbox":
            data[f.id] = f.options.length
              ? pickSubset(f.options).map((o) => o.id)
              : [];
            break;
          default:
            data[f.id] = null;
        }
      }
      subs.push({ formId, sessionId, data, durationMs: intBetween(22_000, 210_000) });
    }
  }
  return { views, subs };
}

async function main() {
  console.log("🌱  Seeding FormOS...");

  await db.execute(
    sql`TRUNCATE TABLE form_submissions, form_views, forms, demo_users RESTART IDENTITY CASCADE`,
  );

  const [user] = await db
    .insert(demoUsers)
    .values({ name: "Demo Operator", email: "demo@formos.local" })
    .returning();
  if (!user) throw new Error("Failed to create demo user");

  const [onboarding, feedback] = await db
    .insert(forms)
    .values([
      {
        userId: user.id,
        title: "ChaiCode Cohort Onboarding",
        description: "Tell us a little about yourself before the cohort kicks off.",
        slug: "chaicode-cohort-onboarding",
        status: "published",
        accent: "teal",
        fields: onboardingFields,
        publishedAt: new Date(),
      },
      {
        userId: user.id,
        title: "Workshop Feedback",
        description: "Two minutes of feedback helps us make the next one better.",
        slug: "workshop-feedback",
        status: "published",
        accent: "purple",
        fields: feedbackFields,
        publishedAt: new Date(),
      },
      {
        userId: user.id,
        title: "Bug Report (draft)",
        description: "An internal form still being built.",
        slug: "bug-report",
        status: "draft",
        accent: "magenta",
        fields: bugReportFields,
      },
    ])
    .returning();
  if (!onboarding || !feedback) throw new Error("Failed to create forms");

  const a = makeViewsAndSubmissions(onboarding.id, onboardingFields, 48, 31);
  const b = makeViewsAndSubmissions(feedback.id, feedbackFields, 30, 22);

  await db.insert(formViews).values([...a.views, ...b.views]);
  await db.insert(formSubmissions).values([...a.subs, ...b.subs]);

  console.log(`✓ demo user: ${user.email}`);
  console.log(`✓ forms: 3 (2 published, 1 draft)`);
  console.log(`✓ views: ${a.views.length + b.views.length}`);
  console.log(`✓ submissions: ${a.subs.length + b.subs.length}`);
  console.log("✅  Done. Open http://localhost:3000");
}

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end({ timeout: 5 });
  });
