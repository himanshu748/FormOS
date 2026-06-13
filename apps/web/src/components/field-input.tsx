"use client";

import { Checkbox, Radio, RatingInput, Select, TextArea, TextInput } from "@formos/ui";
import type { AnswerValue, Field } from "@formos/db/fields";

export interface FieldInputProps {
  field: Field;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
}

/** Renders the correct retro control for any field type. Shared by the public
 *  form runner and the editor's live preview. */
export function FieldInput({ field, value, onChange, disabled }: FieldInputProps) {
  const id = `field-${field.id}`;

  switch (field.type) {
    case "short_text":
      return (
        <TextInput
          id={id}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder || undefined}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "long_text":
      return (
        <TextArea
          id={id}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder || undefined}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "email":
      return (
        <TextInput
          id={id}
          type="email"
          inputMode="email"
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder || "you@example.com"}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "date":
      return (
        <TextInput
          id={id}
          type="date"
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "rating":
      return (
        <RatingInput
          id={id}
          value={typeof value === "number" ? value : null}
          max={field.maxRating}
          readOnly={disabled}
          onChange={(n) => onChange(n)}
        />
      );
    case "dropdown":
      return (
        <Select
          id={id}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Select —</option>
          {field.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    case "multiple_choice":
      return (
        <div className="choice-list" role="radiogroup" aria-labelledby={id}>
          {field.options.map((o) => (
            <Radio
              key={o.id}
              name={id}
              label={o.label}
              value={o.id}
              checked={value === o.id}
              disabled={disabled}
              onChange={() => onChange(o.id)}
              block
            />
          ))}
        </div>
      );
    case "checkbox": {
      const arr = Array.isArray(value) ? value : [];
      return (
        <div className="choice-list">
          {field.options.map((o) => (
            <Checkbox
              key={o.id}
              label={o.label}
              checked={arr.includes(o.id)}
              disabled={disabled}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...arr, o.id]
                    : arr.filter((x) => x !== o.id),
                )
              }
              block
            />
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}
