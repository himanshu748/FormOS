import type { ReactNode } from "react";
import { Spinner } from "@formos/ui";

export function StatePanel({
  variant = "empty",
  title,
  children,
  action,
}: {
  variant?: "loading" | "empty" | "error";
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const glyph = variant === "error" ? "⚠️" : "🗔";
  return (
    <div style={{ textAlign: "center", padding: "30px 16px" }}>
      {variant === "loading" ? (
        <Spinner label="Working…" />
      ) : (
        <div style={{ fontSize: 34, marginBottom: 8 }} aria-hidden>
          {glyph}
        </div>
      )}
      {title && <h3 style={{ marginTop: 10 }}>{title}</h3>}
      {children && (
        <p
          className="muted"
          style={{ marginTop: 6, maxWidth: 440, marginInline: "auto" }}
        >
          {children}
        </p>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
