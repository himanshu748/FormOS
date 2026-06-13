"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Field,
  GroupBox,
  Select,
  Spinner,
  TextArea,
  TextInput,
  Window,
} from "@formos/ui";
import {
  FIELD_TYPE_HINTS,
  FIELD_TYPE_LABELS,
  FIELD_TYPES,
  FORM_ACCENTS,
  OPTION_FIELD_TYPES,
  type Field as FormField,
  type FieldType,
  type FormAccent,
  type FormFields,
} from "@formos/db/fields";
import type { AnswerValue } from "@formos/db/fields";
import { trpc } from "@/lib/trpc/react";
import { genId } from "@/lib/ids";
import { FieldInput } from "@/components/field-input";
import { StatePanel } from "@/components/state-panel";
import { ShareDialog } from "@/components/share-dialog";

const FIELD_ICONS: Record<FieldType, string> = {
  short_text: "✏️",
  long_text: "📝",
  email: "✉️",
  rating: "★",
  dropdown: "▾",
  multiple_choice: "◉",
  checkbox: "☑",
  date: "📅",
};

interface Draft {
  title: string;
  description: string;
  accent: FormAccent;
  fields: FormFields;
}

function makeField(type: FieldType): FormField {
  const base: FormField = {
    id: genId("f"),
    type,
    label: "Untitled question",
    description: "",
    placeholder: "",
    required: false,
    options: [],
    maxRating: 5,
  };
  if (OPTION_FIELD_TYPES.includes(type)) {
    base.options = [
      { id: genId("o"), label: "Option 1" },
      { id: genId("o"), label: "Option 2" },
    ];
  }
  return base;
}

export function Editor({ id }: { id: string }) {
  const utils = trpc.useUtils();
  const query = trpc.form.byId.useQuery({ id }, { retry: false });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState<Record<string, AnswerValue>>({});
  const [showShare, setShowShare] = useState(false);
  const loadedId = useRef<string | null>(null);

  // Load the server form into local editable state once per form id.
  useEffect(() => {
    if (query.data && loadedId.current !== query.data.id) {
      loadedId.current = query.data.id;
      setDraft({
        title: query.data.title,
        description: query.data.description,
        accent: query.data.accent,
        fields: query.data.fields,
      });
      setDirty(false);
    }
  }, [query.data]);

  const update = trpc.form.update.useMutation();
  const publish = trpc.form.publish.useMutation();
  const unpublish = trpc.form.unpublish.useMutation();

  const status = query.data?.status ?? "draft";
  const slug = query.data?.slug;

  function patchDraft(patch: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
  }
  function setFields(updater: (fields: FormFields) => FormFields) {
    setDraft((d) => (d ? { ...d, fields: updater(d.fields) } : d));
    setDirty(true);
  }
  function addField(type: FieldType) {
    setFields((fields) => [...fields, makeField(type)]);
  }
  function updateField(fieldId: string, patch: Partial<FormField>) {
    setFields((fields) =>
      fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
    );
  }
  function removeField(fieldId: string) {
    setFields((fields) => fields.filter((f) => f.id !== fieldId));
  }
  function duplicateField(fieldId: string) {
    setFields((fields) => {
      const idx = fields.findIndex((f) => f.id === fieldId);
      if (idx < 0) return fields;
      const original = fields[idx]!;
      const copy: FormField = {
        ...original,
        id: genId("f"),
        options: original.options.map((o) => ({ ...o, id: genId("o") })),
      };
      const next = [...fields];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }
  function moveField(fieldId: string, dir: -1 | 1) {
    setFields((fields) => {
      const idx = fields.findIndex((f) => f.id === fieldId);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= fields.length) return fields;
      const next = [...fields];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item!);
      return next;
    });
  }

  async function save(): Promise<boolean> {
    if (!draft) return false;
    try {
      await update.mutateAsync({
        id,
        title: draft.title.trim() || "Untitled Form",
        description: draft.description,
        accent: draft.accent,
        fields: draft.fields,
      });
      setDirty(false);
      await utils.form.byId.invalidate({ id });
      await utils.form.list.invalidate();
      return true;
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not save.");
      return false;
    }
  }

  async function onPublish() {
    const ok = await save();
    if (!ok) return;
    try {
      await publish.mutateAsync({ id });
      await utils.form.byId.invalidate({ id });
      await utils.form.list.invalidate();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not publish.");
    }
  }

  async function onUnpublish() {
    try {
      await unpublish.mutateAsync({ id });
      await utils.form.byId.invalidate({ id });
      await utils.form.list.invalidate();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not unpublish.");
    }
  }

  if (query.isLoading) {
    return (
      <main className="center-screen">
        <div style={{ maxWidth: 440, width: "100%" }}>
          <Window title="Form Editor" accent="teal" controls={false}>
            <StatePanel variant="loading" title="Opening editor…" />
          </Window>
        </div>
      </main>
    );
  }

  if (query.isError || !draft) {
    return (
      <main className="center-screen">
        <div style={{ maxWidth: 460, width: "100%" }}>
          <Window title="Error" accent="magenta">
            <StatePanel
              variant="error"
              title="Couldn't open this form"
              action={
                <Link href="/" className="btn btn--primary">
                  Back to Dashboard
                </Link>
              }
            >
              {query.error?.message ?? "The form could not be loaded."}
            </StatePanel>
          </Window>
        </div>
      </main>
    );
  }

  return (
    <main className="desktop">
      <div className="app-shell" style={{ display: "grid", gap: 16 }}>
        {/* Toolbar */}
        <Window title={`Editing — ${draft.title || "Untitled Form"}`} accent={draft.accent}>
          <div className="toolbar" style={{ padding: 0 }}>
            <Link href="/" className="btn">
              ‹ Dashboard
            </Link>
            <Badge tone={status === "published" ? "published" : "draft"}>{status}</Badge>
            {dirty && (
              <span className="muted" style={{ fontSize: 12 }}>
                ● unsaved changes
              </span>
            )}
            <span className="toolbar__spacer" />
            {(update.isPending || publish.isPending || unpublish.isPending) && <Spinner />}
            <Button onClick={save} disabled={!dirty || update.isPending}>
              💾 Save draft
            </Button>
            {status === "published" ? (
              <>
                <Button onClick={onUnpublish} disabled={unpublish.isPending}>
                  Unpublish
                </Button>
                <Button onClick={() => setShowShare(true)}>🔗 Share</Button>
                <Link href={`/analytics/${id}`} className="btn">
                  📊 Analytics
                </Link>
              </>
            ) : (
              <Button variant="primary" onClick={onPublish} disabled={publish.isPending}>
                🚀 Publish
              </Button>
            )}
          </div>
        </Window>

        <div
          style={{ display: "grid", gap: 16 }}
          className="editor-grid"
        >
          <style>{`
            .editor-grid { grid-template-columns: 1fr; }
            @media (min-width: 1024px) { .editor-grid { grid-template-columns: minmax(0,1fr) minmax(320px, 440px); align-items: start; } }
          `}</style>

          {/* Left: builder */}
          <div style={{ display: "grid", gap: 16 }}>
            <Window title="Form details" accent="blue" controls={false}>
              <Field label="Title">
                <TextInput
                  value={draft.title}
                  onChange={(e) => patchDraft({ title: e.target.value })}
                  placeholder="Untitled Form"
                />
              </Field>
              <Field label="Description" hint="Shown to people filling out the form.">
                <TextArea
                  value={draft.description}
                  onChange={(e) => patchDraft({ description: e.target.value })}
                  placeholder="What is this form for?"
                />
              </Field>
              <Field label="Window theme">
                <Select
                  value={draft.accent}
                  onChange={(e) => patchDraft({ accent: e.target.value as FormAccent })}
                  style={{ maxWidth: 220 }}
                >
                  {FORM_ACCENTS.map((a) => (
                    <option key={a} value={a}>
                      {a[0]!.toUpperCase() + a.slice(1)}
                    </option>
                  ))}
                </Select>
              </Field>
            </Window>

            <Window title="Add a field" accent="green" controls={false}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {FIELD_TYPES.map((type) => (
                  <Button key={type} onClick={() => addField(type)} title={FIELD_TYPE_HINTS[type]}>
                    <span aria-hidden>{FIELD_ICONS[type]}</span> {FIELD_TYPE_LABELS[type]}
                  </Button>
                ))}
              </div>
            </Window>

            <Window title={`Fields (${draft.fields.length})`} accent="purple" controls={false}>
              {draft.fields.length === 0 ? (
                <StatePanel variant="empty" title="No fields yet">
                  Add a field above to start building your form.
                </StatePanel>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {draft.fields.map((field, index) => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      index={index}
                      total={draft.fields.length}
                      onChange={(patch) => updateField(field.id, patch)}
                      onRemove={() => removeField(field.id)}
                      onDuplicate={() => duplicateField(field.id)}
                      onMove={(dir) => moveField(field.id, dir)}
                    />
                  ))}
                </div>
              )}
            </Window>
          </div>

          {/* Right: live preview */}
          <div className="editor-preview">
            <Window title={draft.title || "Untitled Form"} accent={draft.accent}>
              {draft.description && (
                <p className="muted" style={{ marginBottom: 14 }}>
                  {draft.description}
                </p>
              )}
              {draft.fields.length === 0 ? (
                <StatePanel variant="empty" title="Nothing to preview yet" />
              ) : (
                <div>
                  {draft.fields.map((field) => (
                    <Field
                      key={field.id}
                      label={field.label}
                      required={field.required}
                      hint={field.description || undefined}
                      htmlFor={`field-${field.id}`}
                    >
                      <FieldInput
                        field={field}
                        value={preview[field.id]}
                        onChange={(v) => setPreview((p) => ({ ...p, [field.id]: v }))}
                      />
                    </Field>
                  ))}
                  <Button variant="primary" disabled style={{ marginTop: 6 }}>
                    Submit (preview)
                  </Button>
                </div>
              )}
            </Window>
          </div>
        </div>
      </div>

      {showShare && slug && (
        <ShareDialog slug={slug} title={draft.title} onClose={() => setShowShare(false)} />
      )}
    </main>
  );
}

function FieldCard({
  field,
  index,
  total,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
}: {
  field: FormField;
  index: number;
  total: number;
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const isOptionType = OPTION_FIELD_TYPES.includes(field.type);
  const hasPlaceholder =
    field.type === "short_text" ||
    field.type === "long_text" ||
    field.type === "email";

  function updateOption(optionId: string, label: string) {
    onChange({
      options: field.options.map((o) => (o.id === optionId ? { ...o, label } : o)),
    });
  }
  function addOption() {
    onChange({
      options: [...field.options, { id: genId("o"), label: `Option ${field.options.length + 1}` }],
    });
  }
  function removeOption(optionId: string) {
    onChange({ options: field.options.filter((o) => o.id !== optionId) });
  }

  return (
    <GroupBox
      legend={
        <span>
          {FIELD_ICONS[field.type]} {FIELD_TYPE_LABELS[field.type]}
        </span>
      }
    >
      <div
        style={{
          display: "flex",
          gap: 6,
          justifyContent: "flex-end",
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <Button variant="ghost" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up">
          ▲
        </Button>
        <Button
          variant="ghost"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          aria-label="Move down"
        >
          ▼
        </Button>
        <Button variant="ghost" onClick={onDuplicate} aria-label="Duplicate">
          ⧉
        </Button>
        <Button variant="ghost" onClick={onRemove} aria-label="Delete field">
          🗑
        </Button>
      </div>

      <Field label="Label">
        <TextInput value={field.label} onChange={(e) => onChange({ label: e.target.value })} />
      </Field>

      <Field label="Help text" hint="Optional — shown under the label.">
        <TextInput
          value={field.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </Field>

      {hasPlaceholder && (
        <Field label="Placeholder">
          <TextInput
            value={field.placeholder}
            onChange={(e) => onChange({ placeholder: e.target.value })}
          />
        </Field>
      )}

      {field.type === "rating" && (
        <Field label="Max rating">
          <Select
            value={String(field.maxRating)}
            onChange={(e) => onChange({ maxRating: Number(e.target.value) })}
            style={{ maxWidth: 120 }}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </Select>
        </Field>
      )}

      {isOptionType && (
        <Field label="Options">
          <div style={{ display: "grid", gap: 6 }}>
            {field.options.map((option, i) => (
              <div key={option.id} style={{ display: "flex", gap: 6 }}>
                <TextInput
                  value={option.label}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                />
                <Button
                  variant="ghost"
                  onClick={() => removeOption(option.id)}
                  disabled={field.options.length <= 1}
                  aria-label="Remove option"
                >
                  ✕
                </Button>
              </div>
            ))}
            <div>
              <Button onClick={addOption}>✚ Add option</Button>
            </div>
          </div>
        </Field>
      )}

      <label className="choice" style={{ marginTop: 4 }}>
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onChange({ required: e.target.checked })}
        />
        <span>Required</span>
      </label>
    </GroupBox>
  );
}
