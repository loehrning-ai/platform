"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";

// ─── FeatureSelectionSim (plan 012 stage 8) ────────────────────────────
//
// Typed port of Ch04_Feature.js's `FeatureSelectionSim`: a feature-
// selection method comparison (correlation filter / mutual information /
// LASSO), static hardcoded data, no RNG.

type SelectionMethod = "corr" | "mi" | "lasso";

interface Feature {
  readonly name: string;
  readonly corr: number;
  readonly mi: number;
  readonly lasso: number;
}

const FEATURES: readonly Feature[] = [
  { name: "user_age", corr: 0.72, mi: 0.68, lasso: 0.41 },
  { name: "session_dur", corr: 0.85, mi: 0.81, lasso: 0.53 },
  { name: "page_views", corr: 0.88, mi: 0.76, lasso: 0 },
  { name: "ad_relevance", corr: 0.31, mi: 0.72, lasso: 0.38 },
  { name: "random_noise_1", corr: 0.04, mi: 0.06, lasso: 0 },
  { name: "random_noise_2", corr: 0.02, mi: 0.03, lasso: 0 },
  { name: "device_type", corr: 0.55, mi: 0.49, lasso: 0.22 },
  { name: "time_of_day", corr: 0.38, mi: 0.61, lasso: 0.15 },
];

const CORR_KEEP = [true, true, false, true, false, false, true, true];
const MI_THRESHOLD = 0.1;
const LASSO_THRESHOLD = 0.01;

const METHODS: readonly { key: SelectionMethod; label: string }[] = [
  { key: "corr", label: "Correlation Filter" },
  { key: "mi", label: "Mutual Information" },
  { key: "lasso", label: "LASSO" },
];

const METHOD_DESC: Record<SelectionMethod, string> = {
  corr: "Remove features with low correlation to the target, then remove pairwise-correlated duplicates (keep highest corr). Fast but misses nonlinear relationships.",
  mi: "Measures how much knowing a feature reduces uncertainty about the target. Captures nonlinear dependencies. More expensive but rarely misses a useful feature.",
  lasso:
    "Fit a regularized linear model; features with zero coefficient are discarded. Jointly considers all features — handles multicollinearity. Assumes linearity.",
};

function scoreLabelFor(method: SelectionMethod): string {
  return method === "corr" ? "|corr with target|" : method === "mi" ? "MI score" : "LASSO coef";
}

export function FeatureSelectionSim() {
  const [method, setMethod] = useState<SelectionMethod>("corr");

  const kept = useMemo(() => {
    if (method === "corr") return CORR_KEEP;
    if (method === "mi") return FEATURES.map((f) => f.mi > MI_THRESHOLD);
    return FEATURES.map((f) => f.lasso > LASSO_THRESHOLD);
  }, [method]);

  const scores = useMemo(() => {
    if (method === "corr") return FEATURES.map((f) => f.corr);
    if (method === "mi") return FEATURES.map((f) => f.mi);
    return FEATURES.map((f) => f.lasso);
  }, [method]);

  const keptCount = kept.filter(Boolean).length;

  return (
    <Panel
      eyebrow="SIMULATION"
      title="Feature selection methods"
      meta={`${keptCount}/8 features kept`}
      caption="No method dominates. LASSO sees interactions between features. MI catches nonlinearity. Correlation is fast but blind to nonlinear signals."
    >
      <div className="sim-controls" style={{ marginBottom: 14 }}>
        <div className="sim-ctrl">
          <label>Selection method</label>
          <div className="seg">
            {METHODS.map((m) => (
              <button
                key={m.key}
                type="button"
                className={method === m.key ? "on" : ""}
                onClick={() => setMethod(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <p className="prose" style={{ fontSize: 12.5, margin: "8px 0 0" }}>
          {METHOD_DESC[method]}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        {FEATURES.map((f, i) => {
          const isKept = kept[i];
          const score = scores[i]!;
          const barW = Math.round(score * 100);
          return (
            <div
              key={f.name}
              style={{
                padding: "10px 12px",
                border: `1.5px solid ${isKept ? "rgba(31,175,126,0.4)" : "rgba(216,58,58,0.35)"}`,
                borderRadius: 8,
                background: isKept ? "rgba(31,175,126,0.08)" : "rgba(216,58,58,0.07)",
                transition: "background 0.35s, border-color 0.35s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  height: 3,
                  width: `${barW}%`,
                  background: isKept ? "var(--good)" : "rgba(216,58,58,0.45)",
                  transition: "width 0.4s, background 0.35s",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: isKept ? "var(--good-ink)" : "var(--bad-ink)" }}>
                  {f.name}
                </span>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: isKept ? "var(--ink-2)" : "var(--bad-ink)" }}>
                  {score.toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: 10, color: isKept ? "var(--good-ink)" : "var(--bad-ink)", marginTop: 3 }}>
                {isKept ? "✓ KEEP" : "✗ DROP"} · {scoreLabelFor(method)}
              </div>
            </div>
          );
        })}
      </div>
      {method === "corr" && (
        <div
          style={{
            marginTop: 10,
            padding: "7px 11px",
            background: "rgba(91,62,232,0.07)",
            border: "1px solid rgba(91,62,232,0.25)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--violet-ink)",
          }}
        >
          page_views dropped: highly correlated with session_dur (r = 0.93). Keeping both adds no information.
        </div>
      )}
    </Panel>
  );
}

export default FeatureSelectionSim;
