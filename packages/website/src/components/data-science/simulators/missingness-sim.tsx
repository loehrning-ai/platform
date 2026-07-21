"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { inkOf, mulberry32, round } from "@/lib/data-science/sim-kit";

// ─── MissingnessSim (plan 012 stage 7) ─────────────────────────────────
//
// Typed port of Ch03_Clean.js's `MissingnessSim`. Seeded with
// `mulberry32(77)` for the base table and `mulberry32(42)` for the
// missingness mask — never reseed or swap for `Math.random()`. Uses
// `inkOf` to keep the per-pattern accent color AA-readable when used as
// text on the light paper background.

type Pattern = "MCAR" | "MAR" | "MNAR";

const ROWS = 8;
const COLS = ["Age", "Income", "Score", "Clicks", "Region", "Churn"] as const;

interface Row {
  readonly Age: number;
  readonly Income: number;
  readonly Score: number;
  readonly Clicks: number;
  readonly Region: string;
  readonly Churn: number;
}

const COLORS: Record<Pattern, string> = { MCAR: "#4DE2FF", MAR: "#D1FF3A", MNAR: "#FF6B80" };
const DESC: Record<Pattern, string> = {
  MCAR: "Sensor dropped a packet. Missingness is unrelated to any value — coin flip. Safe to drop rows or impute.",
  MAR: "Income & Score go missing more in the EU region (observed in other columns). Impute carefully; missingness is explainable.",
  MNAR: "High earners omit income; low scorers skip the score field. The missing value predicts its own absence. Dangerous — imputation will be biased.",
};

export function MissingnessSim() {
  const [pattern, setPattern] = useState<Pattern>("MCAR");

  const base = useMemo<readonly Row[]>(() => {
    const rng = mulberry32(77);
    return Array.from({ length: ROWS }, () => ({
      Age: Math.floor(22 + rng() * 48),
      Income: Math.floor(25000 + rng() * 180000),
      Score: Math.floor(rng() * 100),
      Clicks: Math.floor(rng() * 300),
      Region: ["EU", "US", "APAC", "LATAM"][Math.floor(rng() * 4)] ?? "EU",
      Churn: rng() > 0.6 ? 1 : 0,
    }));
  }, []);

  const missing = useMemo<readonly Record<string, boolean>[]>(() => {
    const rng = mulberry32(42);
    return base.map((row) => {
      const m: Record<string, boolean> = {};
      if (pattern === "MCAR") {
        for (const c of COLS) m[c] = rng() < 0.22;
      } else if (pattern === "MAR") {
        for (const c of COLS) {
          if (c === "Income" || c === "Score") {
            m[c] = row.Region === "EU" ? rng() < 0.6 : rng() < 0.08;
          } else {
            m[c] = rng() < 0.05;
          }
        }
      } else {
        for (const c of COLS) {
          if (c === "Income") {
            m[c] = row.Income > 120000 ? rng() < 0.8 : rng() < 0.05;
          } else if (c === "Score") {
            m[c] = row.Score < 30 ? rng() < 0.75 : rng() < 0.06;
          } else {
            m[c] = rng() < 0.04;
          }
        }
      }
      return m;
    });
  }, [base, pattern]);

  const pctMissing = useMemo(
    () => COLS.map((c) => round((missing.filter((r) => r[c]).length / ROWS) * 100, 0)),
    [missing],
  );

  const color = COLORS[pattern];

  return (
    <Panel
      eyebrow="SIMULATION"
      title="Missingness Patterns"
      meta={`${ROWS} rows · ${COLS.length} columns`}
      caption="Pattern determines what you can safely do about it. MCAR → drop or impute freely. MAR → model the missingness. MNAR → you may need to model the mechanism itself."
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>Pattern</label>
            <div className="seg">
              {(["MCAR", "MAR", "MNAR"] as const).map((p) => (
                <button key={p} type="button" className={pattern === p ? "on" : ""} onClick={() => setPattern(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <p className="prose" style={{ fontSize: 12.5, margin: 0 }}>
            {DESC[pattern]}
          </p>
          <div className="sim-stats" style={{ marginTop: 12 }}>
            {COLS.map((c, i) => (
              <div key={c}>
                <div className="k">{c}</div>
                <div className="v" style={{ color: (pctMissing[i] ?? 0) > 30 ? inkOf(color) : "inherit" }}>
                  {pctMissing[i]}%
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="plot-wrap" style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ padding: "4px 8px", textAlign: "left", color: "#6A6270", fontWeight: 700, letterSpacing: "0.1em" }}>#</th>
                {COLS.map((c) => (
                  <th key={c} style={{ padding: "4px 8px", textAlign: "right", color: "#6A6270", fontWeight: 700 }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {base.map((row, r) => (
                <tr key={r} style={{ borderTop: "1px solid #E8E2DA" }}>
                  <td style={{ padding: "4px 8px", color: "var(--ink-3)" }}>{r + 1}</td>
                  {COLS.map((c) => {
                    const isMissing = missing[r]?.[c] ?? false;
                    const value = row[c as keyof Row];
                    return (
                      <td
                        key={c}
                        style={{
                          padding: "4px 8px",
                          textAlign: "right",
                          background: isMissing ? `${color}22` : "transparent",
                          color: isMissing ? color : "#3A3540",
                          fontWeight: isMissing ? 700 : 400,
                          borderRadius: 3,
                        }}
                      >
                        {isMissing ? "—" : c === "Income" ? value.toLocaleString() : value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

export default MissingnessSim;
