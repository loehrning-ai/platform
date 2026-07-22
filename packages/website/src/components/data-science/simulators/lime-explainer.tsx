"use client";

import { useCallback, useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, mulberry32, round } from "@/lib/data-science/sim-kit";

// ─── LIMEExplainer ──────────────────────────────────
//
// Typed port of Ch07_Interpret.js's `LIMEExplainer`: a local linear
// explanation demo. Seeded with `mulberry32(42)` on every recompute — the
// same fixed literal seed GaltonSim uses, but for an unrelated
// simulator/concept; ported exactly as source does. `sigmoid` is local to
// this file since no other source chapter calls it.

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

const RADIUS = 0.22;
const SW = 300;
const SH = 280;
const CELLS = 30;

interface Sample {
  readonly sx: number;
  readonly sy: number;
  readonly w: number;
  readonly prob: number;
}

export function LIMEExplainer() {
  const [qx, setQx] = useState(0.55);
  const [qy, setQy] = useState(0.45);

  const trueProb = useCallback(
    (x: number, y: number) => sigmoid(6 * (x - 0.5) + 1.5 * (y - 0.5)),
    [],
  );

  const localExplanation = useMemo(() => {
    const rng = mulberry32(42);
    const N = 80;
    const samples: Sample[] = [];
    for (let i = 0; i < N; i++) {
      const sx = clamp(qx + (rng() - 0.5) * RADIUS * 2, 0, 1);
      const sy = clamp(qy + (rng() - 0.5) * RADIUS * 2, 0, 1);
      const dist = Math.sqrt((sx - qx) ** 2 + (sy - qy) ** 2);
      if (dist > RADIUS) continue;
      const w = Math.exp(-((dist / (RADIUS * 0.5)) ** 2));
      const prob = trueProb(sx, sy);
      samples.push({ sx, sy, w, prob });
    }
    let sw = 0;
    let swx = 0;
    let swy = 0;
    let swp = 0;
    for (const s of samples) {
      sw += s.w;
      swx += s.w * (s.sx - qx);
      swy += s.w * (s.sy - qy);
      swp += s.w * s.prob;
    }
    const swInv = sw || 1;
    const mx = swx / swInv;
    const my = swy / swInv;
    const mp = swp / swInv;
    let cxx = 0;
    let cyy = 0;
    let cxy = 0;
    let cpx = 0;
    let cpy = 0;
    for (const s of samples) {
      const dx = s.sx - qx - mx;
      const dy = s.sy - qy - my;
      const dp = s.prob - mp;
      cxx += s.w * dx * dx;
      cyy += s.w * dy * dy;
      cxy += s.w * dx * dy;
      cpx += s.w * dp * dx;
      cpy += s.w * dp * dy;
    }
    const det = (cxx + 1e-3) * (cyy + 1e-3) - cxy * cxy;
    const a12 = det !== 0 ? ((cyy + 1e-3) * cpx - cxy * cpy) / det : 0;
    const a22 = det !== 0 ? ((cxx + 1e-3) * cpy - cxy * cpx) / det : 0;
    const a02 = mp - a12 * mx - a22 * my;
    return { a0: a02, a1: a12, a2: a22, prob: trueProb(qx, qy) };
  }, [qx, qy, trueProb]);

  const toSvg = (v: number, dim: "x" | "y") => v * (dim === "x" ? SW : SH);
  const qsvgX = toSvg(qx, "x");
  const qsvgY = toSvg(1 - qy, "y");
  const rSvg = RADIUS * SW;

  const cells = useMemo(() => {
    const out: { cx: number; cy: number; p: number }[] = [];
    for (let iy = 0; iy < CELLS; iy++) {
      for (let ix = 0; ix < CELLS; ix++) {
        const cx = (ix + 0.5) / CELLS;
        const cy = (iy + 0.5) / CELLS;
        out.push({ cx, cy, p: trueProb(cx, cy) });
      }
    }
    return out;
  }, [trueProb]);

  const { a0, a1, a2 } = localExplanation;
  const localBndX = a1 !== 0 ? qx + (0.5 - a0) / a1 : null;

  return (
    <Panel
      eyebrow="SIMULATION"
      title="LIME · local linear explanation"
      meta={`P(class B) = ${round(localExplanation.prob, 3)}`}
      caption="LIME samples points around the query (dashed circle), weights them by distance, and fits a simple linear model locally. The dotted line is the local decision boundary, valid only within the circle."
    >
      <div className="sim-row">
        <div className="sim-controls" style={{ minWidth: 200 }}>
          <div className="sim-ctrl">
            <label>
              Query X <span className="mono">{round(qx, 2)}</span>
            </label>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.01"
              value={qx}
              aria-label="Query point X"
              onChange={(e) => setQx(+e.target.value)}
            />
          </div>
          <div className="sim-ctrl">
            <label>
              Query Y <span className="mono">{round(qy, 2)}</span>
            </label>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.01"
              value={qy}
              aria-label="Query point Y"
              onChange={(e) => setQy(+e.target.value)}
            />
          </div>
          <div className="sim-stats" style={{ marginTop: 12 }}>
            <div>
              <div className="k">P(class B)</div>
              <div className="v" style={{ color: "var(--violet-ink)" }}>
                {round(localExplanation.prob, 3)}
              </div>
            </div>
            <div>
              <div className="k">Local ∂/∂x</div>
              <div className="v" style={{ color: a1 >= 0 ? "var(--good-ink)" : "var(--bad-ink)" }}>
                {a1 >= 0 ? "+" : ""}
                {round(a1, 3)}
              </div>
            </div>
            <div>
              <div className="k">Local ∂/∂y</div>
              <div className="v" style={{ color: a2 >= 0 ? "var(--good-ink)" : "var(--bad-ink)" }}>
                {a2 >= 0 ? "+" : ""}
                {round(a2, 3)}
              </div>
            </div>
          </div>
          <p className="prose" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
            {Math.abs(a1) > Math.abs(a2) ? (
              <>
                <strong>Feature X</strong> drives this prediction more than Y locally.
              </>
            ) : (
              <>
                <strong>Feature Y</strong> drives this prediction more than X locally.
              </>
            )}
          </p>
        </div>
        <div className="plot-wrap" style={{ flex: 1 }}>
          <div className="sim-plot-head">
            Decision boundary
            <span className="hint">class A (blue) · class B (pink) · locality circle (dashed)</span>
          </div>
          <svg viewBox={`0 0 ${SW} ${SH}`} style={{ width: "100%", cursor: "crosshair" }}>
            {cells.map(({ cx, cy, p }, i) => {
              const r = Math.round(91 + p * 164);
              const g = Math.round(62 + (1 - p) * 100);
              const b = Math.round(232 * (1 - p) + 164 * p);
              return (
                <rect
                  key={i}
                  x={cx * SW - SW / CELLS / 2}
                  y={(1 - cy) * SH - SH / CELLS / 2}
                  width={SW / CELLS + 1}
                  height={SH / CELLS + 1}
                  fill={`rgb(${r},${g},${b})`}
                  opacity="0.35"
                />
              );
            })}
            <line
              x1={0.5 * SW}
              y1={0}
              x2={0.5 * SW}
              y2={SH}
              stroke="rgba(244,242,236,0.4)"
              strokeWidth="1.5"
              strokeDasharray="5 3"
            />
            <text x={0.5 * SW + 4} y="14" fontSize="9" fill="rgba(244,242,236,0.5)" fontFamily="'JetBrains Mono',monospace">
              global boundary
            </text>
            <circle
              cx={qsvgX}
              cy={qsvgY}
              r={rSvg}
              fill="rgba(244,242,236,0.05)"
              stroke="rgba(244,242,236,0.7)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            {localBndX !== null && localBndX > 0 && localBndX < 1 && (
              <line
                x1={localBndX * SW}
                y1={qsvgY - rSvg * 0.9}
                x2={localBndX * SW}
                y2={qsvgY + rSvg * 0.9}
                stroke="#E8A031"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
            )}
            <circle
              cx={qsvgX}
              cy={qsvgY}
              r="7"
              fill={localExplanation.prob >= 0.5 ? "#E8318F" : "#5B3EE8"}
              stroke="#FBF8F1"
              strokeWidth="2"
            />
            <text x={qsvgX + 10} y={qsvgY + 4} fontSize="10" fill="#FBF8F1" fontFamily="'JetBrains Mono',monospace">
              query
            </text>
            <text x={SW - 4} y={SH - 4} textAnchor="end" fontSize="9" fill="#6A6270" fontFamily="'JetBrains Mono',monospace">
              X →
            </text>
            <text x="4" y="14" fontSize="9" fill="#6A6270" fontFamily="'JetBrains Mono',monospace">
              Y ↑
            </text>
            <text x="8" y={SH / 2} fontSize="9" fill="rgba(91,62,232,0.7)" fontFamily="'JetBrains Mono',monospace">
              A
            </text>
            <text x={SW - 16} y={SH / 2} fontSize="9" fill="rgba(232,49,143,0.7)" fontFamily="'JetBrains Mono',monospace">
              B
            </text>
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default LIMEExplainer;
