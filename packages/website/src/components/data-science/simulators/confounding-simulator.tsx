"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { inkOf, mulberry32, randn, round } from "@/lib/data-science/sim-kit";

// ─── ConfoundingSimulator ──────────────────────────
//
// Typed port of Ch09_Causal.js's `ConfoundingSimulator`: ice-cream/
// drowning + shoe-size/reading scenario picker. Seeded with
// `mulberry32(42)` for "icecream", `mulberry32(77)` for "reading" —
// reseeded on scenario change via useMemo deps [scenario], exactly as
// source does.

type ScenarioKey = "icecream" | "reading";

interface Point {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

interface Scenario {
  readonly label: string;
  readonly xLab: string;
  readonly yLab: string;
  readonly zLab: string;
  readonly zGroups: readonly string[];
  readonly zColors: readonly string[];
  readonly generate: (rng: () => number) => Point[];
}

const SCENARIOS: Record<ScenarioKey, Scenario> = {
  icecream: {
    label: "Ice cream & drowning",
    xLab: "Ice cream sales (units/day)",
    yLab: "Drowning deaths / week",
    zLab: "Temperature (°C)",
    zGroups: ["Cool  (10–17°C)", "Warm  (18–24°C)", "Hot   (25–32°C)"],
    zColors: ["#5B9BE8", "#E8A031", "#FF4DA2"],
    generate: (rng) => {
      const pts: Point[] = [];
      for (let g = 0; g < 3; g++) {
        for (let i = 0; i < 30; i++) {
          // Source draws a (temperature) sample here and discards it —
          // the draw still consumes two rng() calls via randn, which
          // shifts the RNG stream for every point after it. Preserved
          // as a bare call so x/y match source's exact sequence.
          randn(rng);
          const x = 20 + g * 40 + randn(rng) * 10;
          const y = 0.5 + g * 1.2 + randn(rng) * 0.3;
          pts.push({ x, y, z: g });
        }
      }
      return pts;
    },
  },
  reading: {
    label: "Shoe size & reading",
    xLab: "Shoe size (EU)",
    yLab: "Reading score (0–100)",
    zLab: "Age group",
    zGroups: ["Age 6–8", "Age 9–11", "Age 12–14"],
    zColors: ["#5B9BE8", "#9A6BFF", "#1FAF7E"],
    generate: (rng) => {
      const pts: Point[] = [];
      for (let g = 0; g < 3; g++) {
        for (let i = 0; i < 30; i++) {
          const x = 26 + g * 6 + randn(rng) * 2;
          const y = 35 + g * 22 + randn(rng) * 8;
          pts.push({ x, y, z: g });
        }
      }
      return pts;
    },
  },
};

function pearsonR(xs: readonly number[], ys: readonly number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - mx;
    const dy = ys[i]! - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  return num / (Math.sqrt(dx2 * dy2) || 1);
}

const W = 420;
const H = 260;
const PAD = { l: 48, r: 16, t: 16, b: 40 };

export function ConfoundingSimulator() {
  const [scenario, setScenario] = useState<ScenarioKey>("icecream");
  const [revealed, setRevealed] = useState(false);

  const sc = SCENARIOS[scenario];
  const pts = useMemo(() => {
    const rng = mulberry32(scenario === "icecream" ? 42 : 77);
    return sc.generate(rng);
  }, [scenario, sc]);

  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const rAll = pearsonR(xs, ys);
  const rPerGroup = [0, 1, 2].map((g) => {
    const sub = pts.filter((p) => p.z === g);
    return pearsonR(sub.map((p) => p.x), sub.map((p) => p.y));
  });

  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const px = (v: number) => PAD.l + ((v - xMin) / xRange) * (W - PAD.l - PAD.r);
  const py = (v: number) => H - PAD.b - ((v - yMin) / yRange) * (H - PAD.t - PAD.b);

  const mxAll = xs.reduce((a, b) => a + b, 0) / xs.length;
  const myAll = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  xs.forEach((x, i) => {
    num += (x - mxAll) * (ys[i]! - myAll);
    den += (x - mxAll) ** 2;
  });
  const slope = num / (den || 1);
  const inter = myAll - slope * mxAll;
  const lx1 = xMin;
  const lx2 = xMax;
  const ly1 = slope * lx1 + inter;
  const ly2 = slope * lx2 + inter;

  return (
    <Panel
      eyebrow="SIMULATION"
      title="Confounding · the lurking variable"
      meta={sc.label}
      caption="Both variables really do correlate, they share a common cause. Stratify by the confounder and each group's correlation collapses toward zero."
    >
      <div className="sim-row" style={{ gridTemplateColumns: "220px 1fr" }}>
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>Scenario</label>
            <div className="seg" style={{ flexDirection: "column", gap: 4 }}>
              {Object.entries(SCENARIOS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  className={scenario === k ? "on" : ""}
                  onClick={() => {
                    setScenario(k as ScenarioKey);
                    setRevealed(false);
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div className="sim-ctrl" style={{ marginTop: 8 }}>
            <button
              type="button"
              className={`btn btn-sm ${revealed ? "btn-primary" : ""}`}
              onClick={() => setRevealed((r) => !r)}
            >
              {revealed ? "✓ Confounder visible" : "Reveal confounder"}
            </button>
          </div>
          <div className="sim-stats" style={{ marginTop: 12, gridTemplateColumns: "1fr" }}>
            <div>
              <div className="k">OVERALL r</div>
              <div className="v" style={{ fontSize: 24, color: "var(--magenta-ink)" }}>
                {round(rAll, 2)}
              </div>
              <div className="sub">looks causal!</div>
            </div>
            {revealed && (
              <div style={{ marginTop: 10 }}>
                {rPerGroup.map((r, g) => (
                  <div key={g} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: inkOf(sc.zColors[g]), fontFamily: "'JetBrains Mono',monospace" }}>
                      {sc.zGroups[g]}
                    </span>
                    <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "var(--ink-3)" }}>
                      r = {round(r, 2)}
                    </span>
                  </div>
                ))}
                <div className="sub" style={{ marginTop: 6 }}>
                  within-group r ≈ 0
                </div>
              </div>
            )}
          </div>
          <p className="prose" style={{ fontSize: 11.5, marginTop: 10, color: "var(--ink-3)" }}>
            {sc.zLab} drives both axes. Remove its influence and the correlation vanishes.
          </p>
        </div>
        <div className="plot-wrap">
          <svg viewBox={`0 0 ${W} ${H}`}>
            <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="#4A4540" strokeWidth="1" />
            <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="#4A4540" strokeWidth="1" />
            <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="#6A6270" fontFamily="'JetBrains Mono',monospace">
              {sc.xLab}
            </text>
            <text
              x={10}
              y={H / 2}
              textAnchor="middle"
              fontSize="10"
              fill="#6A6270"
              fontFamily="'JetBrains Mono',monospace"
              transform={`rotate(-90,10,${H / 2})`}
            >
              {sc.yLab}
            </text>
            {!revealed && (
              <line x1={px(lx1)} y1={py(ly1)} x2={px(lx2)} y2={py(ly2)} stroke="#FF4DA2" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7" />
            )}
            {revealed &&
              [0, 1, 2].map((g) => {
                const sub = pts.filter((p) => p.z === g);
                const gxs = sub.map((p) => p.x);
                const gys = sub.map((p) => p.y);
                const gxm = gxs.reduce((a, b) => a + b, 0) / gxs.length;
                const gym = gys.reduce((a, b) => a + b, 0) / gys.length;
                let gn = 0;
                let gd = 0;
                gxs.forEach((x, i) => {
                  gn += (x - gxm) * (gys[i]! - gym);
                  gd += (x - gxm) ** 2;
                });
                const gs = gn / (gd || 1);
                const gi = gym - gs * gxm;
                const gx1 = Math.min(...gxs);
                const gx2 = Math.max(...gxs);
                return (
                  <line
                    key={g}
                    x1={px(gx1)}
                    y1={py(gs * gx1 + gi)}
                    x2={px(gx2)}
                    y2={py(gs * gx2 + gi)}
                    stroke={sc.zColors[g]}
                    strokeWidth="1.5"
                    opacity="0.7"
                    strokeDasharray="4 3"
                  />
                );
              })}
            {pts.map((p, i) => (
              <circle
                key={i}
                cx={px(p.x)}
                cy={py(p.y)}
                r="4"
                fill={revealed ? sc.zColors[p.z] : "#9A6BFF"}
                opacity={0.8}
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="0.5"
              />
            ))}
            <text
              x={W - PAD.r - 4}
              y={PAD.t + 14}
              textAnchor="end"
              fontSize="13"
              fill="#FF4DA2"
              fontFamily="'JetBrains Mono',monospace"
              fontWeight="700"
            >
              r = {round(rAll, 2)}
            </text>
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default ConfoundingSimulator;
