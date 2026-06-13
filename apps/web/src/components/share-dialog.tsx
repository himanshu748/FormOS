"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button, TextInput, Window } from "@formos/ui";

export function ShareDialog({
  slug,
  title,
  onClose,
}: {
  slug: string;
  title: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";
  const url = `${base}/forms/${slug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${title}`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 420 }}
      >
        <Window title={`Share — ${title}`} accent="blue" onClose={onClose}>
          <p className="muted" style={{ marginBottom: 12 }}>
            Anyone with this link can fill out your form. No account needed.
          </p>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <TextInput readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
            <Button variant="primary" onClick={copy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div
            style={{
              display: "grid",
              placeItems: "center",
              padding: 16,
              background: "#fff",
              border: "2px solid",
              borderColor: "#808080 #fff #fff #808080",
            }}
          >
            <QRCodeSVG value={url} size={176} fgColor="#000080" bgColor="#ffffff" />
            <span className="muted" style={{ marginTop: 10, fontSize: 12 }}>
              Scan to open on a phone
            </span>
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <a href={url} target="_blank" rel="noreferrer noopener" className="btn">
              Open form ↗
            </a>
            <Button onClick={onClose}>Close</Button>
          </div>
        </Window>
      </div>
    </div>
  );
}
