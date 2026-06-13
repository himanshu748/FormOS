"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Field, ProgressBar, Window } from "@formos/ui";
import type { FormDTO } from "@formos/api";
import type { AnswerValue } from "@formos/db/fields";
import { trpc } from "@/lib/trpc/react";
import { FieldInput } from "@/components/field-input";
import { getSessionId } from "@/lib/session";
import { validateAnswers, type Answers } from "@/lib/validate";

function isAnswered(v: AnswerValue | undefined): boolean {
  return !(v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0));
}

export function FormRunner({ slug, initialForm }: { slug: string; initialForm: FormDTO }) {
  const form = initialForm;
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const startedAt = useRef<number>(Date.now());
  const trackedRef = useRef(false);

  const trackView = trpc.view.track.useMutation();
  const submit = trpc.submission.create.useMutation();

  // Record a single view per visit.
  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    startedAt.current = Date.now();
    trackView.mutate({ slug, sessionId: getSessionId(slug) });
  }, [slug, trackView]);

  const requiredFields = useMemo(
    () => form.fields.filter((f) => f.required),
    [form.fields],
  );
  const answeredRequired = requiredFields.filter((f) => isAnswered(answers[f.id])).length;
  const progress = requiredFields.length
    ? (answeredRequired / requiredFields.length) * 100
    : Object.keys(answers).some((k) => isAnswered(answers[k]))
      ? 100
      : 0;

  function setAnswer(fieldId: string, value: AnswerValue) {
    setAnswers((a) => ({ ...a, [fieldId]: value }));
    setErrors((e) => {
      if (!e[fieldId]) return e;
      const next = { ...e };
      delete next[fieldId];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const found = validateAnswers(form.fields, answers);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const first = document.getElementById(`field-${Object.keys(found)[0]}`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    try {
      await submit.mutateAsync({
        slug,
        sessionId: getSessionId(slug),
        durationMs: Math.max(0, Date.now() - startedAt.current),
        data: answers,
      });
      setDone(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not submit your response.");
    }
  }

  function reset() {
    setAnswers({});
    setErrors({});
    setDone(false);
    setServerError(null);
    startedAt.current = Date.now();
  }

  if (done) {
    return (
      <main className="center-screen">
        <div style={{ maxWidth: 520, width: "100%" }}>
          <Window title="Response recorded" accent="green" controls>
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 44 }} aria-hidden>
                ✅
              </div>
              <h2 style={{ marginTop: 8 }}>Thanks — you&rsquo;re all set!</h2>
              <p className="muted" style={{ margin: "8px 0 18px" }}>
                Your response to <strong>{form.title}</strong> was saved.
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <Button onClick={reset}>Submit another response</Button>
                <Link href="/" className="btn">
                  Go to FormOS
                </Link>
              </div>
            </div>
          </Window>
        </div>
      </main>
    );
  }

  return (
    <main className="center-screen">
      <div style={{ maxWidth: 560, width: "100%" }}>
        <Window
          title={form.title}
          accent={form.accent}
          controls
          titleExtra={null}
        >
          {form.description && (
            <p className="muted" style={{ marginBottom: 14 }}>
              {form.description}
            </p>
          )}

          {requiredFields.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                {answeredRequired}/{requiredFields.length} required answered
              </div>
              <ProgressBar value={progress} />
            </div>
          )}

          {form.fields.length === 0 ? (
            <p className="muted">This form doesn&rsquo;t have any questions yet.</p>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              {form.fields.map((field) => (
                <Field
                  key={field.id}
                  label={field.label}
                  required={field.required}
                  hint={field.description || undefined}
                  error={errors[field.id]}
                  htmlFor={`field-${field.id}`}
                >
                  <FieldInput
                    field={field}
                    value={answers[field.id]}
                    onChange={(v) => setAnswer(field.id, v)}
                    disabled={submit.isPending}
                  />
                </Field>
              ))}

              {serverError && (
                <p className="field__error" style={{ marginBottom: 12 }}>
                  {serverError}
                </p>
              )}

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
                <Button type="submit" variant="primary" disabled={submit.isPending}>
                  {submit.isPending ? "Submitting…" : "Submit"}
                </Button>
                <span className="muted" style={{ fontSize: 12 }}>
                  <span className="field__req">*</span> required
                </span>
              </div>
            </form>
          )}
        </Window>

        <p
          style={{
            textAlign: "center",
            marginTop: 12,
            color: "rgba(255,255,255,0.85)",
            fontSize: 12,
            textShadow: "1px 1px 0 rgba(0,0,0,0.4)",
          }}
        >
          Powered by <strong>FormOS</strong>
        </p>
      </div>
    </main>
  );
}
