"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, mulberry32, round } from "@/lib/data-science/sim-kit";

// ─── GlobalVsLocal ──────────────────────────────────
//
// Typed port of Ch07_Interpret.js's `GlobalVsLocal`: click-a-point
// global-vs-local SHAP comparison. Seeded with `mulberry32(999)`.

const GVL_FEATURES = ["credit_score", "income", "debt_ratio", "employment_yrs"] as const;
const GVL_WEIGHTS = [0.38, 0.26, -0.22, 0.14] as const;

interface DataPoint {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly score: number;
  readonly featureVals: readonly number[];
}

const SW = 260;
const SH = 260;
const BAR_MAX = 120;

export function GlobalVsLocal() {
  const [selected, setSelected] = useState<number | null>(null);

  const points = useMemo<readonly DataPoint[]>(() => {
    const rng = mulberry32(999);
    return Array.from({ length: 20 }, (_, i) => {
      const x = 0.08 + rng() * 0.84;
      const y = 0.08 + rng() * 0.84;
      const featureVals = GVL_FEATURES.map(() => rng() * 2 - 1);
      const score = clamp(
        0.5 + featureVals.reduce((s, v, j) => s + v * GVL_WEIGHTS[j], 0),
        0.05,
        0.95,
      );
      return { id: i, x, y, score, featureVals };
    });
  }, []);

  const globalImportance = GVL_WEIGHTS.map((w, j) => ({
    label: GVL_FEATURES[j],
    importance: Math.abs(w),
  }));

  const localShap = useMemo(() => {
    if (selected === null) return null;
    const pt = points[selected];
    if (!pt) return null;
    return GVL_FEATURES.map((label, j) => ({
      label,
      contrib: pt.featureVals[j]! * GVL_WEIGHTS[j],
    }));
  }, [selected, points]);

  return (
    <Panel
      eyebrow="SIMULATION"
      title="Global vs local explanations"
      meta={
        selected !== null && points[selected]
          ? `point #${selected} selected · score ${round(points[selected].score, 3)}`
          : "20 data points · click one"
      }
      caption="Global importance is the same for every prediction — it describes the model overall. Local SHAP values change for every data point. Click any dot to see how its explanation differs from the global view."
    >
      <div className="sim-row">
        <div className="plot-wrap" style={{ flex: "0 0 auto", width: SW + 20 }}>
          <div className="sim-plot-head">
            Data points <span className="hint">click any dot</span>
          </div>
          <svg viewBox={`0 0 ${SW} ${SH}`} style={{ width: "100%", cursor: "pointer" }}>
            <rect x={0} y={0} width={SW} height={SH} fill="rgba(20,18,22,0.3)" rx="4" />
            {points.map((pt) => {
              const cx = pt.x * SW;
              const cy = (1 - pt.y) * SH;
              const isSel = selected === pt.id;
              const color = pt.score >= 0.5 ? "#1FAF7E" : "#D83A3A";
              return (
                <g key={pt.id} onClick={() => setSelected(pt.id)} style={{ cursor: "pointer" }}>
                  {isSel && <circle cx={cx} cy={cy} r="13" fill="none" stroke="#E8A031" strokeWidth="2" opacity="0.7" />}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSel ? 7 : 5}
                    fill={color}
                    stroke={isSel ? "#FBF8F1" : "none"}
                    strokeWidth="1.5"
                    opacity="0.9"
                  />
                  {isSel && (
                    <text x={cx + 10} y={cy + 4} fontSize="10" fill="#E8A031" fontFamily="'JetBrains Mono',monospace">
                      #{pt.id}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <div className="plot-wrap">
            <div className="sim-plot-head">
              Global importance <span className="hint">same for every point</span>
            </div>
            <svg viewBox={`0 0 ${BAR_MAX + 100} ${GVL_FEATURES.length * 28 + 8}`} style={{ width: "100%" }}>
              {globalImportance.map((f, i) => (
                <g key={f.label}>
                  <text x={0} y={i * 28 + 15} fontSize="10" fill="#C7C4BC" fontFamily="'JetBrains Mono',monospace">
                    {f.label}
                  </text>
                  <rect x={0} y={i * 28 + 19} width={f.importance * BAR_MAX} height={9} fill="#5B3EE8" rx="2" opacity="0.8" />
                  <text
                    x={f.importance * BAR_MAX + 4}
                    y={i * 28 + 27}
                    fontSize="9"
                    fill="#5B3EE8"
                    fontFamily="'JetBrains Mono',monospace"
                  >
                    {round(f.importance, 3)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="plot-wrap">
            <div className="sim-plot-head">
              Local SHAP <span className="hint">{selected === null ? "click a point above" : `point #${selected}`}</span>
            </div>
            {localShap === null ? (
              <p className="prose" style={{ fontSize: 11, padding: "8px 0", opacity: 0.5 }}>
                Select a data point to see its local explanation.
              </p>
            ) : (
              <svg viewBox={`0 0 ${BAR_MAX * 2 + 100} ${GVL_FEATURES.length * 28 + 8}`} style={{ width: "100%" }}>
                <line
                  x1={BAR_MAX}
                  y1={0}
                  x2={BAR_MAX}
                  y2={GVL_FEATURES.length * 28 + 8}
                  stroke="rgba(164,157,154,0.3)"
                  strokeWidth="1"
                />
                {localShap.map((f, i) => {
                  const pos = f.contrib >= 0;
                  const barW = Math.abs(f.contrib) * BAR_MAX * 1.8;
                  const barX = pos ? BAR_MAX : BAR_MAX - barW;
                  const color = pos ? "#1FAF7E" : "#D83A3A";
                  return (
                    <g key={f.label}>
                      <text x={0} y={i * 28 + 15} fontSize="10" fill="#C7C4BC" fontFamily="'JetBrains Mono',monospace">
                        {f.label}
                      </text>
                      <rect
                        x={barX}
                        y={i * 28 + 19}
                        width={Math.max(barW, 2)}
                        height={9}
                        fill={color}
                        rx="2"
                        opacity="0.85"
                        style={{ transition: "all 300ms ease" }}
                      />
                      <text
                        x={pos ? BAR_MAX + barW + 4 : BAR_MAX - barW - 4}
                        y={i * 28 + 27}
                        textAnchor={pos ? "start" : "end"}
                        fontSize="9"
                        fill={color}
                        fontFamily="'JetBrains Mono',monospace"
                      >
                        {f.contrib >= 0 ? "+" : ""}
                        {round(f.contrib, 3)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default GlobalVsLocal;
