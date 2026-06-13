"use client";

import { useState } from "react";
import { cn } from "./cn";

export interface RatingInputProps {
  value: number | null;
  onChange?: (value: number) => void;
  max?: number;
  readOnly?: boolean;
  id?: string;
}

/** An interactive (or read-only) star rating control. */
export function RatingInput({
  value,
  onChange,
  max = 5,
  readOnly = false,
  id,
}: RatingInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value ?? 0;

  return (
    <div className="rating" id={id} role="radiogroup" aria-label="Rating">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          className={cn("rating__star", n <= active && "rating__star--on")}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={value === n}
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(null)}
          onFocus={() => !readOnly && setHover(n)}
          onBlur={() => !readOnly && setHover(null)}
          onClick={() => !readOnly && onChange?.(n)}
        >
          {n <= active ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
