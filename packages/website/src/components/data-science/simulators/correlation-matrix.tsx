"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { lerp, mulberry32, randn, round } from "@/lib/data-science/sim-kit";

// ─── CorrelationMatrix (plan 012 stage 7) ──────────────────────────────
//
// Typed port of Ch02_Explore.js's `CorrelationMatrix`. Seeded with
// `mulberry32(42 + Math.round(noise * 100))` (source's own formula) —
// deterministic per noise level, never `Math.random()`.

const VARS = ["Age", "Income", "Score", "Satisf."] as const;
const N_VARS = 4;
const N_OBS = 300;
const TRUE_CORR = [
  [1, 0.65, -0.2, 0.1],
  [0.65, 1, 0.4, 0.55],
  [-0.2, 0.4, 1, 0.7],
  [0.1, 0.55, 0.7, 1],
] as const;

function corrColor(r: number): string {
  if (r >= 0) {
    const t = r;
    const rb = Math.round(lerp(30, 91, 1 - t));
    const gb = Math.round(lerp(30, 62, 1 - t));
    const bb = Math.round(lerp(30, 232, 1 - t));
    return `rgb(${rb},${gb},${bb})`;
  }
  const t = -r;
  const rr = Math.round(lerp(30, 239, 1 - t));
  const gr = Math.round(lerp(30, 68, 1 - t));
  const br = Math.round(lerp(30, 68, 1 - t));
  return `rgb(${rr},${gr},${br})`;
}

export function CorrelationMatrix() {
  const [noise, setNoise] = useState(0);

  const computedCorr = useMemo(() => {
    const rng = mulberry32(42 + Math.round(noise * 100));
    const raw: number[][] = Array.from({ length: N_VARS }, () => []);
    for (let i = 0; i < N_OBS; i++) {
      const z = Array.from({ length: N_VARS }, () => randn(rng));
      const noiseFactor = noise;
      const age = z[0] ?? 0;
      const income =
        (TRUE_CORR[0]?.[1] ?? 0) * (1 - noiseFactor) * (z[0] ?? 0) +
        Math.sqrt(1 - ((TRUE_CORR[0]?.[1] ?? 0) * (1 - noiseFactor)) ** 2) * (z[1] ?? 0);
      const score =
        (TRUE_CORR[0]?.[2] ?? 0) * (1 - noiseFactor) * (z[0] ?? 0) +
        (TRUE_CORR[1]?.[2] ?? 0) * (1 - noiseFactor) * (z[1] ?? 0) * 0.5 +
        Math.sqrt(0.5) * (z[2] ?? 0);
      const sat =
        (TRUE_CORR[0]?.[3] ?? 0) * (1 - noiseFactor) * (z[0] ?? 0) +
        (TRUE_CORR[1]?.[3] ?? 0) * (1 - noiseFactor) * (z[1] ?? 0) * 0.5 +
        (TRUE_CORR[2]?.[3] ?? 0) * (1 - noiseFactor) * (z[2] ?? 0) * 0.5 +
        Math.sqrt(0.3) * (z[3] ?? 0);
      raw[0]?.push(age);
      raw[1]?.push(income);
      raw[2]?.push(score);
      raw[3]?.push(sat);
    }
    const means = raw.map((col) => col.reduce((s, v) => s + v, 0) / N_OBS);
    const sds = raw.map((col, ci) =>
      Math.sqrt(col.reduce((s, v) => s + (v - (means[ci] ?? 0)) ** 2, 0) / N_OBS),
    );
    const mat = Array.from({ length: N_VARS }, (_, i) =>
      Array.from({ length: N_VARS }, (_2, j) => {
        if (i === j) return 1;
        const rawI = raw[i] ?? [];
        const rawJ = raw[j] ?? [];
        const cov =
          rawI.reduce((s, v, k) => s + (v - (means[i] ?? 0)) * ((rawJ[k] ?? 0) - (means[j] ?? 0)), 0) /
          N_OBS;
        return round(cov / ((sds[i] ?? 1) * (sds[j] ?? 1)), 2);
      }),
    );
    return mat;
  }, [noise]);

  const CELL = 72;
  const LABEL_W = 52;
  const SVG_W = LABEL_W + N_VARS * CELL + 8;
  const SVG_H = LABEL_W + N_VARS * CELL + 8;

  const maxAbsR = Math.max(
    ...computedCorr.flatMap((row, i) => row.map((v, j) => (i !== j ? Math.abs(v) : 0))),
  );
  const strongPairs = computedCorr
    .flatMap((row, i) => row.map((v, j): number => (i < j && Math.abs(v) >= 0.5 ? 1 : 0)))
    .reduce((a, b) => a + b, 0);

  return (
    <Panel
      eyebrow="SIMULATOR"
      title="Correlation Matrix"
      meta="drag noise → watch r decay"
      caption="Pearson r per cell. Blue = positive, red = negative. Drag noise to simulate measurement error."
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>
              Noise <span className="mono">{round(noise, 2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={noise}
              aria-label="Noise level"
              onChange={(e) => setNoise(+e.target.value)}
            />
          </div>
          <div style={{ fontSize: 10, opacity: 0.5, lineHeight: 1.6, marginTop: 8 }}>
            0 = true structure
            <br />
            1 = pure noise
            <br />
            Watch r shrink toward 0.
          </div>
          <div className="sim-stats" style={{ marginTop: 12 }}>
            <div>
              <div className="k">Max |r|</div>
              <div className="v mono">{round(maxAbsR, 2)}</div>
            </div>
            <div>
              <div className="k">Strong pairs</div>
              <div className="v mono">{strongPairs}</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 9, opacity: 0.4, marginBottom: 4 }}>Color scale</div>
            <svg width={80} height={14}>
              <defs>
                <linearGradient id="corrGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="rgb(239,68,68)" />
                  <stop offset="50%" stopColor="rgb(30,30,30)" />
                  <stop offset="100%" stopColor="rgb(91,62,232)" />
                </linearGradient>
              </defs>
              <rect x={0} y={0} width={80} height={10} fill="url(#corrGrad)" rx={2} />
              <text x={0} y={14} fill="rgba(244,242,236,0.4)" fontSize="7">−1</text>
              <text x={34} y={14} fill="rgba(244,242,236,0.4)" fontSize="7">0</text>
              <text x={68} y={14} fill="rgba(244,242,236,0.4)" fontSize="7">+1</text>
            </svg>
          </div>
        </div>
        <div className="plot-wrap">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {VARS.map((v, j) => (
              <text key={j} x={LABEL_W + j * CELL + CELL / 2} y={LABEL_W - 6} textAnchor="middle" fill="rgba(244,242,236,0.6)" fontSize="10">
                {v}
              </text>
            ))}
            {VARS.map((v, i) => (
              <text key={i} x={LABEL_W - 6} y={LABEL_W + i * CELL + CELL / 2 + 4} textAnchor="end" fill="rgba(244,242,236,0.6)" fontSize="10">
                {v}
              </text>
            ))}
            {computedCorr.map((row, i) =>
              row.map((r, j) => {
                const cx = LABEL_W + j * CELL;
                const cy = LABEL_W + i * CELL;
                const isDiag = i === j;
                return (
                  <g key={`${i}-${j}`}>
                    <rect
                      x={cx + 1}
                      y={cy + 1}
                      width={CELL - 2}
                      height={CELL - 2}
                      fill={isDiag ? "rgba(244,242,236,0.06)" : corrColor(r)}
                      rx={3}
                      style={{ transition: "fill 0.4s" }}
                    />
                    <text
                      x={cx + CELL / 2}
                      y={cy + CELL / 2 + 5}
                      textAnchor="middle"
                      fill={isDiag ? "rgba(244,242,236,0.4)" : Math.abs(r) > 0.5 ? "rgba(255,255,255,0.9)" : "rgba(244,242,236,0.6)"}
                      fontSize="11"
                      fontWeight="600"
                    >
                      {isDiag ? "—" : r.toFixed(2)}
                    </text>
                  </g>
                );
              }),
            )}
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default CorrelationMatrix;
