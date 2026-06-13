"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Button, GroupBox, Window } from "@formos/ui";
import type { AnswerValue, FieldType } from "@formos/db/fields";
import { trpc } from "@/lib/trpc/react";
import { BarChart } from "@/components/bar-chart";
import { StatePanel } from "@/components/state-panel";
import {
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent,
} from "@/lib/format";

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat-tile bevel-out">
      <div className="stat-tile__value font-display">{value}</div>
      <div className="stat-tile__label">{label}</div>
    </div>
  );
}

function renderAnswer(
  type: FieldType,
  value: AnswerValue | undefined,
  optionLabels: Map<string, string>,
): string {
  if (value === undefined || value === null || value === "") return "—";
  if (Array.isArray(value)) {
    return value.map((v) => optionLabels.get(v) ?? v).join(", ") || "—";
  }
  if (type === "rating") return `${value}★`;
  if (type === "dropdown" || type === "multiple_choice") {
    return optionLabels.get(String(value)) ?? String(value);
  }
  return String(value);
}

export function AnalyticsView({ formId }: { formId: string }) {
  const form = trpc.form.byId.useQuery({ id: formId }, { retry: false });
  const overview = trpc.analytics.overview.useQuery({ formId });
  const breakdown = trpc.analytics.fieldBreakdown.useQuery({ formId });
  const responses = trpc.analytics.responses.useQuery({ formId, limit: 50, offset: 0 });

  if (form.isLoading) {
    return (
      <main className="center-screen">
        <div style={{ maxWidth: 460, width: "100%" }}>
          <Window title="Analytics" accent="teal" controls={false}>
            <StatePanel variant="loading" title="Crunching the numbers…" />
          </Window>
        </div>
      </main>
    );
  }

  if (form.isError || !form.data) {
    return (
      <main className="center-screen">
        <div style={{ maxWidth: 460, width: "100%" }}>
          <Window title="Error" accent="magenta">
            <StatePanel
              variant="error"
              title="Couldn't load analytics"
              action={
                <Link href="/" className="btn btn--primary">
                  Back to Dashboard
                </Link>
              }
            >
              {form.error?.message ?? "This form could not be found."}
            </StatePanel>
          </Window>
        </div>
      </main>
    );
  }

  const optionLabels = new Map<string, string>();
  for (const f of form.data.fields) {
    for (const o of f.options) optionLabels.set(o.id, o.label);
  }

  const o = overview.data;
  const charts = breakdown.data?.fields ?? [];
  const table = responses.data;

  return (
    <main className="desktop">
      <div className="app-shell" style={{ display: "grid", gap: 16 }}>
        <Window title={`Analytics — ${form.data.title}`} accent={form.data.accent}>
          <div className="toolbar" style={{ padding: 0 }}>
            <Link href="/" className="btn">
              ‹ Dashboard
            </Link>
            <Badge tone={form.data.status === "published" ? "published" : "draft"}>
              {form.data.status}
            </Badge>
            <span className="toolbar__spacer" />
            <Link href={`/editor/${formId}`} className="btn">
              ✎ Edit
            </Link>
            {form.data.status === "published" && (
              <a
                href={`/forms/${form.data.slug}`}
                target="_blank"
                rel="noreferrer noopener"
                className="btn"
              >
                ↗ Open
              </a>
            )}
            <Button variant="ghost" onClick={() => overview.refetch()}>
              ⟳ Refresh
            </Button>
          </div>
        </Window>

        {/* Overview */}
        <Window title="Overview" accent="blue" controls={false}>
          {overview.isLoading ? (
            <StatePanel variant="loading" />
          ) : (
            <div
              className="grid grid-cols-2 md:grid-cols-4"
              style={{ gap: 10 }}
            >
              <Stat label="Views" value={o ? formatNumber(o.views) : "—"} />
              <Stat label="Submissions" value={o ? formatNumber(o.submissions) : "—"} />
              <Stat
                label="Completion rate"
                value={o ? formatPercent(o.completionRate) : "—"}
              />
              <Stat
                label="Avg. completion"
                value={o ? formatDuration(o.avgCompletionMs) : "—"}
              />
            </div>
          )}
          {o?.lastSubmissionAt && (
            <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
              Last response: {formatDateTime(o.lastSubmissionAt)}
            </p>
          )}
        </Window>

        {/* Field insights */}
        <Window title="Field insights" accent="green" controls={false}>
          {breakdown.isLoading ? (
            <StatePanel variant="loading" />
          ) : charts.length === 0 ? (
            <StatePanel variant="empty" title="No chartable fields">
              Add a rating, dropdown, multiple-choice, or checkbox field to see
              breakdowns here.
            </StatePanel>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {charts.map((field) => (
                <GroupBox
                  key={field.fieldId}
                  legend={
                    <span>
                      {field.label}{" "}
                      <span className="muted" style={{ fontWeight: 400 }}>
                        ({field.responses} answered
                        {field.type === "rating" && field.average !== null
                          ? `, avg ${field.average.toFixed(1)}★`
                          : ""}
                        )
                      </span>
                    </span>
                  }
                >
                  {field.type === "rating" ? (
                    <BarChart
                      data={field.distribution.map((d) => ({
                        label: `${d.value} ★`,
                        value: d.count,
                      }))}
                    />
                  ) : (
                    <BarChart
                      data={field.options.map((opt) => ({
                        label: opt.label,
                        value: opt.count,
                      }))}
                    />
                  )}
                </GroupBox>
              ))}
            </div>
          )}
        </Window>

        {/* Responses table */}
        <Window
          title={`Responses${table ? ` (${table.total})` : ""}`}
          accent="purple"
          controls={false}
        >
          {responses.isLoading ? (
            <StatePanel variant="loading" />
          ) : !table || table.rows.length === 0 ? (
            <StatePanel variant="empty" title="No responses yet">
              Share your form to start collecting responses.
            </StatePanel>
          ) : (
            <div className="retro-table-wrap">
              <table className="retro-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {table.fields.map((f) => (
                      <th key={f.id}>{f.label}</th>
                    ))}
                    <th>Time</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      {table.fields.map((f) => (
                        <td key={f.id}>
                          {renderAnswer(f.type, row.data[f.id], optionLabels)}
                        </td>
                      ))}
                      <td>{formatDuration(row.durationMs)}</td>
                      <td>{formatDateTime(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Window>
      </div>
    </main>
  );
}
