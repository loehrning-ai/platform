"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, inkOf, mulberry32, randn, round } from "@/lib/data-science/sim-kit";

// ─── PolynomialExpansion (plan 012 stage 8) ────────────────────────────
//
// Typed port of Ch04_Feature.js's `PolynomialExpansion`: a polynomial
// curve-fit demo, seeded with `mulberry32(42)`. `fitPoly`/`evalPoly`/
// `computeR2` below are a plain (non-ridge-regularized) least-squares
// solve — deliberately NOT shared with bias-variance-sim.tsx's own
// `fitPoly`, which adds ridge damping terms source itself never shares
// across these two chapter files either.

interface Point {
  readonly x: number;
  readonly y: number;
}

function fitPoly(pts: readonly Point[], degree: number): readonly number[] {
  const d = degree + 1;
  const X = pts.map((p) => Array.from({ length: d }, (_, k) => p.x ** k));
  const XtX = Array.from({ length: d }, (_, i) =>
    Array.from({ length: d }, (_2, j) => X.reduce((s, row) => s + row[i]! * row[j]!, 0)),
  );
  const Xty = Array.from({ length: d }, (_, i) =>
    X.reduce((s, row, r) => s + row[i]! * pts[r]!.y, 0),
  );
  const A = XtX.map((row, i) => [...row, Xty[i]!]);
  for (let col = 0; col < d; col++) {
    let maxRow = col;
    for (let row = col + 1; row < d; row++) {
      if (Math.abs(A[row]![col]!) > Math.abs(A[maxRow]![col]!)) maxRow = row;
    }
    [A[col], A[maxRow]] = [A[maxRow]!, A[col]!];
    const pivot = A[col]![col]!;
    if (Math.abs(pivot) < 1e-12) continue;
    for (let row = col + 1; row < d; row++) {
      const f = A[row]![col]! / pivot;
      for (let k = col; k <= d; k++) A[row]![k] = A[row]![k]! - f * A[col]![k]!;
    }
  }
  const coeffs = new Array(d).fill(0);
  for (let i = d - 1; i >= 0; i--) {
    let s = A[i]![d]!;
    for (let j = i + 1; j < d; j++) s -= A[i]![j]! * coeffs[j];
    coeffs[i] = A[i]![i] !== 0 ? s / A[i]![i]! : 0;
  }
  return coeffs;
}

function evalPoly(coeffs: readonly number[], x: number): number {
  return coeffs.reduce((s, c, k) => s + c * x ** k, 0);
}

function computeR2(pts: readonly Point[], coeffs: readonly number[]): number {
  const yMean = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const ssTot = pts.reduce((s, p) => s + (p.y - yMean) ** 2, 0);
  const ssRes = pts.reduce((s, p) => s + (p.y - evalPoly(coeffs, p.x)) ** 2, 0);
  return ssTot < 1e-10 ? 1 : 1 - ssRes / ssTot;
}

const W = 460;
const H = 210;
const PAD = { l: 36, r: 14, t: 14, b: 28 };

function xScale(x: number): number {
  return PAD.l + ((x + 1) / 2) * (W - PAD.l - PAD.r);
}

function yScale(y: number): number {
  return PAD.t + ((1.4 - y) / 2.2) * (H - PAD.t - PAD.b);
}

export function PolynomialExpansion() {
  const [degree, setDegree] = useState(2);
  const pts = useMemo(() => {
    const rng = mulberry32(42);
    return Array.from({ length: 40 }, () => {
      const x = rng() * 2 - 1;
      const y = x * x + 0.25 * randn(rng);
      return { x, y };
    });
  }, []);
  const coeffs = useMemo(() => fitPoly(pts, degree), [pts, degree]);
  const r2 = useMemo(() => round(computeR2(pts, coeffs), 3), [pts, coeffs]);
  const curvePath = useMemo(() => {
    const steps = 100;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const x = -1 + (i / steps) * 2;
      const y = clamp(evalPoly(coeffs, x), -0.8, 1.35);
      return `${i === 0 ? "M" : "L"}${xScale(x).toFixed(1)},${yScale(y).toFixed(1)}`;
    }).join(" ");
  }, [coeffs]);

  const complexityLabel =
    degree === 1 ? "Underfits (high bias)" : degree === 2 ? "Good fit" : "Slight overfit (high complexity)";
  const complexityColor = degree === 1 ? "#ff6b6b" : degree === 2 ? "#D1FF3A" : "#ffa94d";

  return (
    <Panel
      eyebrow="SIMULATION"
      title="Polynomial feature expansion"
      meta={`Degree ${degree} · Train R² = ${r2}`}
      caption="Degree 1 cannot capture the parabola (bias). Degree 2 fits well. Degree 3 starts chasing noise (variance)."
    >
      <div className="sim-controls" style={{ marginBottom: 12 }}>
        <div className="sim-ctrl">
          <label>Polynomial degree</label>
          <div className="seg">
            {[1, 2, 3].map((d) => (
              <button key={d} type="button" className={degree === d ? "on" : ""} onClick={() => setDegree(d)}>
                Degree {d}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 8, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
          <span style={{ color: inkOf(complexityColor) }}>{complexityLabel}</span>
          <span style={{ color: "var(--ink-3)" }}>Features: {degree === 1 ? "x" : degree === 2 ? "x, x²" : "x, x², x³"}</span>
          <span style={{ color: "var(--ink-3)" }}>
            Complexity: {"●".repeat(degree)}
            {"○".repeat(3 - degree)}
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {[-0.5, 0, 0.5, 1].map((yv) => (
          <line key={yv} x1={PAD.l} x2={W - PAD.r} y1={yScale(yv)} y2={yScale(yv)} stroke="#2a2a2a" strokeWidth="1" />
        ))}
        {[-0.75, -0.25, 0.25, 0.75].map((xv) => (
          <line key={xv} x1={xScale(xv)} x2={xScale(xv)} y1={PAD.t} y2={H - PAD.b} stroke="#2a2a2a" strokeWidth="1" />
        ))}
        {[-0.5, 0, 0.5, 1].map((yv) => (
          <text
            key={yv}
            x={PAD.l - 4}
            y={yScale(yv) + 4}
            textAnchor="end"
            fontSize="9"
            fontFamily="'JetBrains Mono', monospace"
            fill="#555"
          >
            {yv}
          </text>
        ))}
        <path
          d={Array.from({ length: 101 }, (_, i) => {
            const x = -1 + (i / 100) * 2;
            const y = clamp(x * x, -0.8, 1.35);
            return `${i === 0 ? "M" : "L"}${xScale(x).toFixed(1)},${yScale(y).toFixed(1)}`;
          }).join(" ")}
          stroke="#444"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4 3"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={xScale(p.x)} cy={yScale(clamp(p.y, -0.8, 1.35))} r="3" fill="#4a7fa5" opacity="0.7" />
        ))}
        <path d={curvePath} stroke={complexityColor} strokeWidth="2.2" fill="none" style={{ transition: "stroke 0.3s" }} />
        <line x1={W - 130} x2={W - 110} y1="22" y2="22" stroke="#444" strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={W - 105} y="26" fontSize="9" fontFamily="'JetBrains Mono', monospace" fill="#555">
          true y=x²
        </text>
        <line x1={W - 130} x2={W - 110} y1="36" y2="36" stroke={complexityColor} strokeWidth="2.2" />
        <text x={W - 105} y="40" fontSize="9" fontFamily="'JetBrains Mono', monospace" fill={complexityColor}>
          degree {degree} fit
        </text>
      </svg>
    </Panel>
  );
}

export default PolynomialExpansion;
