"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Spinner, Window } from "@formos/ui";
import type { RouterOutputs } from "@formos/api";
import { trpc } from "@/lib/trpc/react";
import { formatDateTime, formatNumber } from "@/lib/format";
import { StatePanel } from "@/components/state-panel";
import { ShareDialog } from "@/components/share-dialog";

type FormSummary = RouterOutputs["form"]["list"][number];

export function DesktopDashboard() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const list = trpc.form.list.useQuery();
  const [share, setShare] = useState<{ slug: string; title: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const create = trpc.form.create.useMutation({
    onSuccess: (form) => router.push(`/editor/${form.id}`),
  });
  const publish = trpc.form.publish.useMutation({
    onSettled: () => utils.form.list.invalidate(),
  });
  const unpublish = trpc.form.unpublish.useMutation({
    onSettled: () => utils.form.list.invalidate(),
  });
  const remove = trpc.form.remove.useMutation({
    onSettled: () => utils.form.list.invalidate(),
  });

  async function onDelete(form: FormSummary) {
    if (!window.confirm(`Delete “${form.title}” and all its responses? This can't be undone.`)) {
      return;
    }
    setBusyId(form.id);
    try {
      await remove.mutateAsync({ id: form.id });
    } finally {
      setBusyId(null);
    }
  }

  async function onTogglePublish(form: FormSummary) {
    setBusyId(form.id);
    try {
      if (form.status === "published") {
        await unpublish.mutateAsync({ id: form.id });
      } else {
        await publish.mutateAsync({ id: form.id });
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not update the form.");
    } finally {
      setBusyId(null);
    }
  }

  const forms = list.data ?? [];

  return (
    <main className="desktop">
      <div className="app-shell" style={{ display: "grid", gap: 16 }}>
        {/* Hero */}
        <Window title="FormOS" icon="🗔" accent="teal">
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                className="font-display"
                style={{ fontSize: 18, color: "#006d6d", lineHeight: 1.4 }}
              >
                FormOS
              </div>
              <p className="muted" style={{ marginTop: 8, maxWidth: 520 }}>
                A form builder with a retro soul. Drag together a form, publish it,
                share the link, and watch the responses roll in — all from your
                desktop.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => create.mutate({})}
              disabled={create.isPending}
            >
              {create.isPending ? "Creating…" : "✚ New form"}
            </Button>
          </div>
        </Window>

        {/* Forms list */}
        <Window
          title="My Forms"
          icon="📁"
          accent="blue"
          footer={
            <span className="muted" style={{ fontSize: 12 }}>
              {forms.length} {forms.length === 1 ? "form" : "forms"} ·{" "}
              <a href="/docs" target="_blank" rel="noreferrer noopener" className="link">
                API docs
              </a>
            </span>
          }
        >
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <Button onClick={() => create.mutate({})} disabled={create.isPending}>
              ✚ New form
            </Button>
            <Button
              variant="ghost"
              onClick={() => utils.form.list.invalidate()}
              disabled={list.isFetching}
            >
              ⟳ Refresh
            </Button>
            {list.isFetching && <Spinner />}
          </div>

          {list.isLoading ? (
            <StatePanel variant="loading" title="Loading your forms…" />
          ) : list.isError ? (
            <StatePanel
              variant="error"
              title="Couldn't load forms"
              action={
                <Button onClick={() => list.refetch()}>Try again</Button>
              }
            >
              {list.error.message}
            </StatePanel>
          ) : forms.length === 0 ? (
            <StatePanel
              variant="empty"
              title="No forms yet"
              action={
                <Button variant="primary" onClick={() => create.mutate({})}>
                  ✚ Create your first form
                </Button>
              }
            >
              Forms you create will show up here as little windows.
            </StatePanel>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {forms.map((form) => (
                <FormCard
                  key={form.id}
                  form={form}
                  busy={busyId === form.id}
                  onDelete={() => onDelete(form)}
                  onTogglePublish={() => onTogglePublish(form)}
                  onShare={() => setShare({ slug: form.slug, title: form.title })}
                />
              ))}
            </div>
          )}
        </Window>
      </div>

      {share && (
        <ShareDialog slug={share.slug} title={share.title} onClose={() => setShare(null)} />
      )}
    </main>
  );
}

function FormCard({
  form,
  busy,
  onDelete,
  onTogglePublish,
  onShare,
}: {
  form: FormSummary;
  busy: boolean;
  onDelete: () => void;
  onTogglePublish: () => void;
  onShare: () => void;
}) {
  return (
    <div
      className="bevel-out"
      style={{ background: "var(--w-surface)", padding: 12 }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <strong style={{ fontSize: 14 }}>{form.title}</strong>
            <Badge tone={form.status === "published" ? "published" : "draft"}>
              {form.status}
            </Badge>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            {form.fieldCount} {form.fieldCount === 1 ? "field" : "fields"} ·{" "}
            {formatNumber(form.views)} views · {formatNumber(form.submissions)} responses
            <br />
            Updated {formatDateTime(form.updatedAt)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Link href={`/editor/${form.id}`} className="btn">
            ✎ Edit
          </Link>
          <Link href={`/analytics/${form.id}`} className="btn">
            📊 Analytics
          </Link>
          {form.status === "published" && (
            <>
              <a
                href={`/forms/${form.slug}`}
                target="_blank"
                rel="noreferrer noopener"
                className="btn"
              >
                ↗ Open
              </a>
              <Button onClick={onShare}>🔗 Share</Button>
            </>
          )}
          <Button onClick={onTogglePublish} disabled={busy}>
            {form.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button onClick={onDelete} disabled={busy} aria-label="Delete form">
            🗑
          </Button>
        </div>
      </div>
    </div>
  );
}
