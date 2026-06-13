import type { ReactNode } from "react";

export interface BarDatum {
  label: string;
  value: number;
  hint?: ReactNode;
}

export function BarChart({ data, max }: { data: BarDatum[]; max?: number }) {
  const peak = Math.max(1, max ?? Math.max(0, ...data.map((d) => d.value)));
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(72px, 150px) 1fr auto",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={d.label}
          >
            {d.label}
          </span>
          <div className="bevel-in" style={{ background: "#fff", height: 18 }}>
            <div
              style={{
                height: "100%",
                width: `${(d.value / peak) * 100}%`,
                minWidth: d.value > 0 ? 4 : 0,
                background: "linear-gradient(90deg, #000080, #1084d0)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
            {d.value}
            {d.hint ? <span className="muted"> {d.hint}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}
