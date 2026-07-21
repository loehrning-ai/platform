"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, round } from "@/lib/data-science/sim-kit";

// ─── SHAPWaterfallSim ───────────────────────────────
//
// Typed port of Ch07_Interpret.js's `SHAPWaterfallSim`: a loan-approval
// SHAP waterfall chart. No RNG — every feature's contribution is a pure
// function of the current slider values.

interface LoanFeature {
  readonly key: string;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly mean: number;
  readonly weight: number;
}

const LOAN_FEATURES: readonly LoanFeature[] = [
  { key: "income", label: "Annual income ($k)", min: 20, max: 200, step: 1, mean: 70, weight: 4e-3 },
  { key: "age", label: "Age (years)", min: 18, max: 75, step: 1, mean: 38, weight: 55e-4 },
  { key: "debt_ratio", label: "Debt ratio (%)", min: 0, max: 80, step: 1, mean: 35, weight: -7e-3 },
  { key: "employment_years", label: "Employment years", min: 0, max: 30, step: 1, mean: 8, weight: 9e-3 },
  { key: "credit_score", label: "Credit score", min: 300, max: 850, step: 5, mean: 640, weight: 28e-4 },
  { key: "savings", label: "Savings ($k)", min: 0, max: 150, step: 1, mean: 25, weight: 5e-3 },
];

const LOAN_BASE = 0.42;

const W = 440;
const H = 240;
const BAR_H = 14;
const ROW_H = 36;
const PAD_LEFT = 148;
const PAD_RIGHT = 40;

function xScale(v: number): number {
  return PAD_LEFT + v * (W - PAD_LEFT - PAD_RIGHT);
}

export function SHAPWaterfallSim() {
  const defaults = useMemo(
    () => Object.fromEntries(LOAN_FEATURES.map((f) => [f.key, f.mean])),
    [],
  );
  const [vals, setVals] = useState<Record<string, number>>(defaults);

  const { rows, finalScore } = useMemo(() => {
    let running = LOAN_BASE;
    const rows2 = LOAN_FEATURES.map((f) => {
      const contrib = ((vals[f.key] ?? f.mean) - f.mean) * f.weight;
      const from = running;
      running = clamp(running + contrib, 0.01, 0.99);
      return { ...f, contrib, from, to: running };
    });
    return { rows: rows2, finalScore: running };
  }, [vals]);

  const baseX = xScale(LOAN_BASE);
  const approved = finalScore >= 0.5;

  return (
    <Panel
      eyebrow="SIMULATION"
      title="SHAP waterfall · loan approval"
      meta={`score ${round(finalScore, 3)} · ${approved ? "APPROVED" : "DECLINED"}`}
      caption="Each feature's contribution = (your value − population mean) × weight. Bars extend right (positive) or left (negative) from the running total, which is clamped to a valid [0.01, 0.99] probability."
    >
      <div className="sim-row">
        <div className="sim-controls" style={{ minWidth: 220 }}>
          {LOAN_FEATURES.map((f) => (
            <div className="sim-ctrl" key={f.key}>
              <label>
                {f.label} <span className="mono">{vals[f.key]}</span>
              </label>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={vals[f.key]}
                aria-label={f.label}
                onChange={(e) => setVals((v) => ({ ...v, [f.key]: +e.target.value }))}
              />
            </div>
          ))}
          <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => setVals(defaults)}>
            Reset to means
          </button>
        </div>
        <div className="plot-wrap" style={{ flex: 1 }}>
          <div className="sim-plot-head">
            SHAP waterfall
            <span className="hint">
              baseline {LOAN_BASE.toFixed(2)} → score {round(finalScore, 3)}
            </span>
          </div>
          <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: "100%" }}>
            <text x={baseX} y="12" textAnchor="middle" fontSize="9" fill="#6A6270" fontFamily="'JetBrains Mono',monospace">
              BASE {LOAN_BASE.toFixed(2)}
            </text>
            <line x1={baseX} y1="16" x2={baseX} y2={H - 10} stroke="rgba(164,157,154,0.25)" strokeDasharray="3 3" strokeWidth="1" />
            {rows.map((f, i) => {
              const y = 22 + i * ROW_H;
              const pos = f.contrib >= 0;
              const barX = pos ? xScale(f.from) : xScale(f.to);
              const barW = Math.abs(xScale(f.to) - xScale(f.from));
              const color = pos ? "#1FAF7E" : "#D83A3A";
              const labelX = pos ? xScale(f.to) + 5 : xScale(f.to) - 5;
              const anchor = pos ? "start" : "end";
              return (
                <g key={f.key}>
                  <text x={PAD_LEFT - 6} y={y + 11} textAnchor="end" fontSize="10" fill="#C7C4BC" fontFamily="'JetBrains Mono',monospace">
                    {f.label}
                  </text>
                  {i > 0 && (
                    <line
                      x1={xScale(f.from)}
                      y1={y - ROW_H + BAR_H + 4}
                      x2={xScale(f.from)}
                      y2={y + 4}
                      stroke="rgba(164,157,154,0.18)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                  <rect
                    x={barX}
                    y={y}
                    width={Math.max(barW, 1)}
                    height={BAR_H}
                    fill={color}
                    rx="2"
                    style={{ transition: "all 200ms ease" }}
                  />
                  <text x={labelX} y={y + 11} textAnchor={anchor} fontSize="10" fill={color} fontFamily="'JetBrains Mono',monospace">
                    {f.contrib >= 0 ? "+" : ""}
                    {round(f.contrib, 3)}
                  </text>
                </g>
              );
            })}
            <line
              x1={xScale(finalScore)}
              y1="18"
              x2={xScale(finalScore)}
              y2={H - 4}
              stroke={approved ? "#1FAF7E" : "#D83A3A"}
              strokeWidth="2"
            />
            <text
              x={xScale(finalScore)}
              y={H + 14}
              textAnchor="middle"
              fontSize="10"
              fill={approved ? "#1FAF7E" : "#D83A3A"}
              fontFamily="'JetBrains Mono',monospace"
              fontWeight="700"
            >
              {round(finalScore, 3)} · {approved ? "APPROVED" : "DECLINED"}
            </text>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <g key={v}>
                <line x1={xScale(v)} y1={H - 4} x2={xScale(v)} y2={H} stroke="#A49D9A" strokeWidth="0.6" />
                <text x={xScale(v)} y={H + 10} textAnchor="middle" fontSize="8" fill="#6A6270" fontFamily="'JetBrains Mono',monospace">
                  {v.toFixed(2)}
                </text>
              </g>
            ))}
            <line x1={PAD_LEFT} y1={H - 4} x2={W - PAD_RIGHT} y2={H - 4} stroke="#A49D9A" strokeWidth="0.6" />
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default SHAPWaterfallSim;
