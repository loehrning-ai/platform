"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, mulberry32, randn, round } from "@/lib/data-science/sim-kit";

// ─── BiasVarianceSim ────────────────────────────────
//
// Typed port of Ch05_Model.js's `BiasVarianceSim`: a bias/variance
// bootstrap-resampling demo. Seeded via `mulberry32(dataSeed)`, where
// `dataSeed` starts at 17 and increments by 17 on "reshuffle" — never
// swapped for `Math.random()`, just a component-state-driven seed input
// (unlike GaltonSim/ThresholdSim's fixed literal seeds). `fitPoly` below
// is a ridge-regularized least-squares solve — deliberately NOT shared
// with polynomial-expansion.tsx's own plain (non-ridge) `fitPoly`, which
// source itself never shares across these two chapter files either.

interface Point {
  readonly x: number;
  readonly y: number;
}

function truth(x: number): number {
  return Math.sin(x * Math.PI * 2) * 0.7;
}

function fitPoly(pts: readonly Point[], deg: number): readonly number[] {
  const n = pts.length;
  const D = deg + 1;
  const X = pts.map((p) => Array.from({ length: D }, (_, k) => p.x ** k));
  const y = pts.map((p) => p.y);
  const XTX = Array.from({ length: D }, () => new Array(D).fill(0));
  const XTy = new Array(D).fill(0);
  for (let i = 0; i < D; i++) {
    for (let j = 0; j < D; j++) {
      let s2 = 0;
      for (let k = 0; k < n; k++) s2 += X[k]![i]! * X[k]![j]!;
      XTX[i][j] = s2 + (i === j ? 1e-5 : 0);
    }
    let s = 0;
    for (let k = 0; k < n; k++) s += X[k]![i]! * y[k]!;
    XTy[i] = s;
  }
  const m = XTX.map((row: number[], i: number) => [...row, XTy[i]]);
  for (let i = 0; i < D; i++) {
    let max = i;
    for (let k = i + 1; k < D; k++) if (Math.abs(m[k][i]) > Math.abs(m[max][i])) max = k;
    [m[i], m[max]] = [m[max], m[i]];
    for (let k = i + 1; k < D; k++) {
      const f = m[k][i] / (m[i][i] || 1e-12);
      for (let j = i; j <= D; j++) m[k][j] -= f * m[i][j];
    }
  }
  const b = new Array(D).fill(0);
  for (let i = D - 1; i >= 0; i--) {
    let s = m[i][D];
    for (let j = i + 1; j < D; j++) s -= m[i][j] * b[j];
    b[i] = s / (m[i][i] || 1e-12);
  }
  return b;
}

function predictWith(coeffs: readonly number[], x: number): number {
  return coeffs.reduce((a, c, k) => a + c * x ** k, 0);
}

const W = 600;
const H = 200;

function xMap(x: number): number {
  return 40 + x * 520;
}

function yMap(y: number): number {
  return 100 - y * 60;
}

export function BiasVarianceSim() {
  const [complexity, setComplexity] = useState(5);
  const [dataSeed, setDataSeed] = useState(17);
  const [svgKey, setSvgKey] = useState(0);

  const train = useMemo(() => {
    const r = mulberry32(dataSeed);
    return Array.from({ length: 22 }, (_, i) => {
      const x = i / 21;
      return { x, y: truth(x) + 0.22 * randn(r) };
    });
  }, [dataSeed]);

  const resampleFits = useMemo(() => {
    const out: (readonly number[])[] = [];
    for (let s = 0; s < 24; s++) {
      const r = mulberry32(dataSeed * 31 + s * 7 + 1);
      const pts = Array.from({ length: 22 }, (_, i) => {
        const x = i / 21;
        return { x, y: truth(x) + 0.22 * randn(r) };
      });
      out.push(fitPoly(pts, complexity));
    }
    return out;
  }, [dataSeed, complexity]);

  const mainCoeffs = useMemo(() => fitPoly(train, complexity), [train, complexity]);
  const predict = (x: number) => predictWith(mainCoeffs, x);

  const testPts = useMemo(() => {
    const r = mulberry32(99);
    return Array.from({ length: 200 }, () => {
      const x = r();
      return { x, y: truth(x) + 0.22 * randn(r) };
    });
  }, []);

  const trainErr = train.reduce((a, p) => a + (p.y - predict(p.x)) ** 2, 0) / train.length;
  const testErr = testPts.reduce((a, p) => a + (p.y - predict(p.x)) ** 2, 0) / testPts.length;

  const { bias2, variance } = useMemo(() => {
    const GRID = 40;
    let bias22 = 0;
    let variance2 = 0;
    for (let i = 0; i < GRID; i++) {
      const x = i / (GRID - 1);
      const ys = resampleFits.map((c) => predictWith(c, x));
      const meanY = ys.reduce((a, v) => a + v, 0) / ys.length;
      bias22 += (meanY - truth(x)) ** 2;
      variance2 += ys.reduce((a, v) => a + (v - meanY) ** 2, 0) / ys.length;
    }
    return { bias2: bias22 / GRID, variance: variance2 / GRID };
  }, [resampleFits]);

  const pathFor = (coeffs: readonly number[]): string => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = i / 120;
      const y = clamp(predictWith(coeffs, x), -1.6, 1.6);
      pts.push(`${xMap(x).toFixed(2)},${yMap(y).toFixed(2)}`);
    }
    return "M " + pts.join(" L ");
  };

  const truthPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = i / 120;
      pts.push(`${xMap(x).toFixed(2)},${yMap(truth(x)).toFixed(2)}`);
    }
    return "M " + pts.join(" L ");
  }, []);

  const regimeLabel = complexity <= 1 ? "underfit (high bias)" : complexity >= 10 ? "overfit (high variance)" : "good fit";

  const reshuffle = () => {
    setDataSeed((s) => s + 17);
    setSvgKey((k) => k + 1);
  };

  return (
    <Panel
      eyebrow="LIVE · ENSEMBLE"
      title="Bias–variance dance"
      meta={`degree ${complexity} · ${resampleFits.length} bootstraps`}
      caption="Gray cloud = the range of fits you'd get from resampling. Narrow cloud + close to truth = good. Narrow + far = bias. Wide & wild = variance. The tradeoff is the dance."
    >
      <div className="sim-row" style={{ gridTemplateColumns: "280px 1fr" }}>
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>
              Model complexity <span className="mono">deg {complexity}</span>
            </label>
            <input
              type="range"
              min="0"
              max="15"
              value={complexity}
              aria-label="Model complexity (polynomial degree)"
              onChange={(e) => setComplexity(+e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-sm btn-primary" onClick={reshuffle}>
            ⟲ New training data
          </button>
          <div className="sim-stats">
            <div>
              <div className="k">Train MSE</div>
              <div className="v" style={{ color: "var(--cyan-ink)" }}>
                {round(trainErr, 3)}
              </div>
            </div>
            <div>
              <div className="k">Test MSE</div>
              <div className="v" style={{ color: "var(--magenta)" }}>
                {round(testErr, 3)}
              </div>
            </div>
            <div>
              <div className="k">Regime</div>
              <div className="v serif" style={{ fontStyle: "italic", fontSize: 15 }}>
                {regimeLabel}
              </div>
            </div>
          </div>
          <div className="sim-stats" style={{ marginTop: 2 }}>
            <div>
              <div className="k">Bias²</div>
              <div className="v" style={{ color: "var(--warn-ink)" }}>
                {round(bias2, 3)}
              </div>
            </div>
            <div>
              <div className="k">Variance</div>
              <div className="v" style={{ color: "var(--violet)" }}>
                {round(variance, 3)}
              </div>
            </div>
            <div>
              <div className="k">Bias²+Var</div>
              <div className="v">{round(bias2 + variance, 3)}</div>
            </div>
          </div>
          <div className="galton-note">
            <span className="tag-pill">tip</span>
            At low <code className="mono">deg</code>, bias is huge (stiff line misses curve). At
            high <code className="mono">deg</code>, bias collapses but variance explodes — the
            gray cloud fans wildly.
          </div>
        </div>
        <div className="plot-wrap" style={{ padding: 16 }}>
          <svg viewBox={`0 0 ${W} ${H}`} key={`${svgKey}-${complexity}`}>
            <line x1={xMap(0)} y1={yMap(0)} x2={xMap(1)} y2={yMap(0)} stroke="#A49D9A" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.5" />
            <line x1={xMap(0)} y1={yMap(-1.5)} x2={xMap(0)} y2={yMap(1.5)} stroke="#A49D9A" strokeWidth="0.6" />
            <path d={truthPath} fill="none" stroke="#14121655" strokeWidth="1.2" strokeDasharray="4 3" />
            {resampleFits.map((c, i) => (
              <path
                key={i}
                d={pathFor(c)}
                fill="none"
                stroke="#5B3EE8"
                strokeWidth="1.1"
                opacity={0.08}
                style={{
                  strokeDasharray: 3000,
                  strokeDashoffset: 3000,
                  animation: `drawPath 1.2s cubic-bezier(.4,0,.2,1) ${i * 0.04}s forwards`,
                }}
              />
            ))}
            <path
              d={pathFor(mainCoeffs)}
              fill="none"
              stroke="#E8318F"
              strokeWidth="2.4"
              style={{
                strokeDasharray: 3000,
                strokeDashoffset: 3000,
                animation: `drawPath 1.1s cubic-bezier(.4,0,.2,1) 0s forwards`,
              }}
            />
            {train.map((p, i) => (
              <circle
                key={i}
                cx={xMap(p.x)}
                cy={yMap(clamp(p.y, -1.6, 1.6))}
                r="3.2"
                fill="#141216"
                stroke="#FBF8F1"
                strokeWidth="1"
                style={{
                  opacity: 0,
                  animation: `fadeIn 280ms cubic-bezier(.4,0,.2,1) ${0.6 + i * 0.02}s forwards`,
                }}
              />
            ))}
            <g transform="translate(48 16)">
              <line x1="0" y1="0" x2="20" y2="0" stroke="#14121655" strokeWidth="1.2" strokeDasharray="4 3" />
              <text x="26" y="4" fontSize="10" fill="#3A3540" fontFamily="'JetBrains Mono', monospace">
                truth
              </text>
              <line x1="100" y1="0" x2="120" y2="0" stroke="#E8318F" strokeWidth="2.4" />
              <text x="126" y="4" fontSize="10" fill="#3A3540" fontFamily="'JetBrains Mono', monospace">
                this fit
              </text>
              <g transform="translate(220 0)">
                <line x1="0" y1="0" x2="20" y2="0" stroke="#5B3EE8" strokeWidth="1.4" opacity="0.5" />
                <text x="26" y="4" fontSize="10" fill="#3A3540" fontFamily="'JetBrains Mono', monospace">
                  24 resamples
                </text>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default BiasVarianceSim;
