"use client";

import { useState, type ReactNode } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { round } from "@/lib/data-science/sim-kit";

// ─── DifferenceInDifferences ───────────────────────
//
// Typed port of Ch09_Causal.js's `DifferenceInDifferences`: DiD slider
// demo. Pure arithmetic, no RNG.

const C_pre = 40;
const C_post = 46;
const T_pre = 38;
const W = 440;
const H = 240;
const PAD = { l: 50, r: 20, t: 20, b: 40 };
const xPre = PAD.l + 80;
const xPost = W - PAD.r - 60;
const yMin = 25;
const yMax = 75;

function yScale(v: number): number {
  return H - PAD.b - ((v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
}

function XTick({ x, label }: { readonly x: number; readonly label: string }): ReactNode {
  return (
    <g>
      <line x1={x} y1={H - PAD.b} x2={x} y2={H - PAD.b + 4} stroke="#6A6270" />
      <text x={x} y={H - PAD.b + 16} textAnchor="middle" fontSize="10" fill="#6A6270" fontFamily="'JetBrains Mono',monospace">
        {label}
      </text>
    </g>
  );
}

export function DifferenceInDifferences() {
  const [effect, setEffect] = useState(8);
  const [parallelOk, setParallelOk] = useState(true);

  const commonTrend = C_post - C_pre;
  const T_counterfactual = T_pre + commonTrend;
  const T_actual = T_pre + commonTrend + effect + (parallelOk ? 0 : 5);
  const DiD = T_actual - T_counterfactual;

  return (
    <Panel
      eyebrow="SIMULATION"
      title="Difference-in-Differences"
      meta={`DiD estimate = ${round(DiD, 1)}`}
      caption="The key assumption is parallel trends: in the absence of treatment, both groups would have moved the same way. Drag the effect slider to see what DiD measures."
    >
      <div className="sim-row" style={{ gridTemplateColumns: "220px 1fr" }}>
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>
              True treatment effect <span className="mono">{effect} pts</span>
            </label>
            <input
              type="range"
              min="-10"
              max="25"
              step="1"
              aria-label="True treatment effect"
              value={effect}
              onChange={(e) => setEffect(+e.target.value)}
            />
          </div>
          <div className="sim-ctrl">
            <label>Parallel trends</label>
            <div className="seg" style={{ gap: 4 }}>
              <button type="button" className={parallelOk ? "on" : ""} onClick={() => setParallelOk(true)}>
                Hold
              </button>
              <button type="button" className={!parallelOk ? "on" : ""} onClick={() => setParallelOk(false)}>
                Violated
              </button>
            </div>
          </div>
          <div className="sim-stats" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
            <div>
              <div className="k">T_post − T_pre</div>
              <div className="v" style={{ fontSize: 18 }}>
                {round(T_actual - T_pre, 1)}
              </div>
            </div>
            <div>
              <div className="k">C_post − C_pre</div>
              <div className="v" style={{ fontSize: 18 }}>
                {round(C_post - C_pre, 1)}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(91,158,232,0.08)", border: "1px solid rgba(91,158,232,0.2)" }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "'JetBrains Mono',monospace" }}>DiD estimate</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: DiD > 0 ? "var(--good-ink)" : "var(--magenta-ink)", fontFamily: "'JetBrains Mono',monospace" }}>
              {round(DiD, 1)} pts
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 4 }}>= (T_post − T_pre) − (C_post − C_pre)</div>
          </div>
          {!parallelOk && (
            <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 6, background: "rgba(255,77,162,0.08)", border: "1px solid rgba(255,77,162,0.3)", fontSize: 11, color: "var(--magenta-ink)" }}>
              Parallel trends violated — DiD is biased by +5 pts.
            </div>
          )}
        </div>
        <div className="plot-wrap">
          <svg viewBox={`0 0 ${W} ${H}`}>
            {[30, 40, 50, 60, 70].map((v) => (
              <g key={v}>
                <line x1={PAD.l} y1={yScale(v)} x2={W - PAD.r} y2={yScale(v)} stroke="#2A2520" strokeWidth="1" strokeDasharray="2 4" />
                <text x={PAD.l - 6} y={yScale(v) + 4} textAnchor="end" fontSize="9" fill="#6A6270" fontFamily="'JetBrains Mono',monospace">
                  {v}
                </text>
              </g>
            ))}
            <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="#4A4540" />
            <line x1={(xPre + xPost) / 2} y1={PAD.t} x2={(xPre + xPost) / 2} y2={H - PAD.b} stroke="#6A6270" strokeWidth="1" strokeDasharray="3 4" opacity="0.6" />
            <text x={(xPre + xPost) / 2} y={PAD.t + 10} textAnchor="middle" fontSize="9" fill="#6A6270" fontFamily="'JetBrains Mono',monospace">
              treatment
            </text>
            <line x1={xPre} y1={yScale(C_pre)} x2={xPost} y2={yScale(C_post)} stroke="#5B9BE8" strokeWidth="2.5" />
            <circle cx={xPre} cy={yScale(C_pre)} r="5" fill="#5B9BE8" />
            <circle cx={xPost} cy={yScale(C_post)} r="5" fill="#5B9BE8" />
            <text x={xPost + 8} y={yScale(C_post) + 4} fontSize="10" fill="#5B9BE8" fontFamily="'JetBrains Mono',monospace">
              Control
            </text>
            <line x1={xPre} y1={yScale(T_pre)} x2={xPost} y2={yScale(T_counterfactual)} stroke="#E8A031" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7" />
            <circle cx={xPost} cy={yScale(T_counterfactual)} r="4" fill="#E8A031" opacity="0.7" />
            <text x={xPost + 8} y={yScale(T_counterfactual) + 4} fontSize="10" fill="#E8A031" opacity="0.8" fontFamily="'JetBrains Mono',monospace">
              Counterfactual
            </text>
            <line x1={xPre} y1={yScale(T_pre)} x2={xPost} y2={yScale(T_actual)} stroke="#1FAF7E" strokeWidth="2.5" />
            <circle cx={xPre} cy={yScale(T_pre)} r="5" fill="#1FAF7E" />
            <circle cx={xPost} cy={yScale(T_actual)} r="5" fill="#1FAF7E" />
            <text x={xPost + 8} y={yScale(T_actual) + 4} fontSize="10" fill="#1FAF7E" fontFamily="'JetBrains Mono',monospace">
              Treated
            </text>
            {T_actual !== T_counterfactual && (
              <g>
                <line
                  x1={xPost + 45}
                  y1={yScale(T_counterfactual)}
                  x2={xPost + 45}
                  y2={yScale(T_actual)}
                  stroke="#9A6BFF"
                  strokeWidth="1.5"
                  markerEnd="url(#arr9)"
                />
                <text x={xPost + 52} y={(yScale(T_counterfactual) + yScale(T_actual)) / 2 + 4} fontSize="10" fill="#9A6BFF" fontFamily="'JetBrains Mono',monospace">
                  DiD={round(DiD, 1)}
                </text>
              </g>
            )}
            <XTick x={xPre} label="Pre" />
            <XTick x={xPost} label="Post" />
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default DifferenceInDifferences;
