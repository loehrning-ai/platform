"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";

// ─── EncodingComparison (plan 012 stage 8) ─────────────────────────────
//
// Typed port of Ch04_Feature.js's `EncodingComparison`: a categorical
// encoding-strategy demo (one-hot / label / target / frequency), no RNG.

type EncodingMode = "onehot" | "label" | "target" | "frequency";

const CITIES = ["New York", "London", "Tokyo", "Paris", "Berlin"];
const CITY_TARGETS = [7.2, 6.8, 8.1, 7.5, 6.4];
const CITY_COUNTS = [38, 22, 18, 12, 10];

const MODES: readonly { key: EncodingMode; label: string }[] = [
  { key: "onehot", label: "One-Hot" },
  { key: "label", label: "Label" },
  { key: "target", label: "Target" },
  { key: "frequency", label: "Frequency" },
];

const DESCRIPTIONS: Record<EncodingMode, string> = {
  onehot:
    "Creates one binary column per category. Safe, interpretable. Explodes at high cardinality (1000 cities → 1000 columns). No ordinal assumption.",
  label:
    'Assigns each category an integer 1–N. Compact but <strong>introduces false ordering</strong>: Berlin (5) is not "greater than" London (2). Breaks linear models.',
  target:
    "Replaces category with mean(target | category). Very powerful for tree models. <strong>Must be computed out-of-fold</strong> — computing on training data leaks the target.",
  frequency:
    "Replaces category with its frequency (count or ratio). Preserves cardinality signal without arbitrary ordering. Treats two equally-frequent cities as identical.",
};

interface TableData {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

function buildTableData(mode: EncodingMode): TableData {
  if (mode === "onehot") {
    const headers = ["City (raw)", ...CITIES.map((c) => c.split(" ")[0]!)];
    const rows = CITIES.map((city, i) => [city, ...CITIES.map((_, j) => (i === j ? "1" : "0"))]);
    return { headers, rows };
  }
  if (mode === "label") {
    return {
      headers: ["City (raw)", "city_encoded"],
      rows: CITIES.map((city, i) => [city, String(i + 1)]),
    };
  }
  if (mode === "target") {
    return {
      headers: ["City (raw)", "city_target_enc"],
      rows: CITIES.map((city, i) => [city, CITY_TARGETS[i]!.toFixed(2)]),
    };
  }
  const total = CITY_COUNTS.reduce((a, v) => a + v, 0);
  return {
    headers: ["City (raw)", "city_count", "city_freq"],
    rows: CITIES.map((city, i) => [city, String(CITY_COUNTS[i]), (CITY_COUNTS[i]! / total).toFixed(2)]),
  };
}

function colorFor(mode: EncodingMode, val: string, colIdx: number): string {
  if (mode === "onehot") return val === "1" ? "#D1FF3A" : "var(--bg-hi)";
  if (mode === "label") return colIdx === 1 ? `hsl(${Number(val) * 40}, 60%, 64%)` : "transparent";
  if (mode === "target") return colIdx === 1 ? `hsl(${(Number(val) - 6) * 120}, 55%, 64%)` : "transparent";
  if (mode === "frequency")
    return colIdx === 2 ? `hsl(200, 65%, ${Math.max(60, 84 - Number(val) * 80)}%)` : "transparent";
  return "transparent";
}

export function EncodingComparison() {
  const [mode, setMode] = useState<EncodingMode>("onehot");
  const tableData = useMemo(() => buildTableData(mode), [mode]);

  return (
    <Panel
      eyebrow="SIMULATION"
      title="Categorical encoding methods"
      meta="City column · 5 categories"
      caption="One-hot is the safe default. Target encoding is the sharp knife — always out-of-fold. Label encoding silently breaks linear models."
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>Encoding strategy</label>
            <div className="seg">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={mode === m.key ? "on" : ""}
                  onClick={() => setMode(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <p
            className="prose"
            style={{ fontSize: 12.5, margin: 0 }}
            dangerouslySetInnerHTML={{ __html: DESCRIPTIONS[mode] }}
          />
        </div>
      </div>
      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          <thead>
            <tr>
              {tableData.headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "6px 10px",
                    borderBottom: "1px solid var(--hair-2)",
                    textAlign: "left",
                    color: "var(--ink-3)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid var(--hair)" }}>
                {row.map((cell, ci) => {
                  const bg = colorFor(mode, cell, ci);
                  const isHighlight = bg !== "transparent" && bg !== "var(--bg-hi)";
                  const txt = ci === 0 ? "var(--ink-1)" : !isHighlight ? "var(--ink-2)" : "#0A0A0A";
                  return (
                    <td
                      key={ci}
                      style={{
                        padding: "5px 10px",
                        background: ci === 0 ? "transparent" : bg,
                        color: txt,
                        fontWeight: ci === 0 ? 400 : 600,
                        transition: "background 0.3s",
                      }}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mode === "label" && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "rgba(216,58,58,0.08)",
            border: "1px solid rgba(216,58,58,0.3)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--bad-ink)",
          }}
        >
          ⚠ Linear models will treat Berlin (5) as 5× New York (1). This ordering is meaningless and injects noise.
        </div>
      )}
      {mode === "target" && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "rgba(31,175,126,0.08)",
            border: "1px solid rgba(31,175,126,0.3)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--good-ink)",
          }}
        >
          ✓ Computed out-of-fold (correct). Values shown are held-out fold means — no target leakage.
        </div>
      )}
    </Panel>
  );
}

export default EncodingComparison;
