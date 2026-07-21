"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { mulberry32, randn, round } from "@/lib/data-science/sim-kit";

// ─── DistributionExplorer (plan 012 stage 7) ───────────────────────────
//
// Typed port of Ch02_Explore.js's `DistributionExplorer`. Seeded from
// `shape`/`n` (`mulberry32(shape.charCodeAt(0) * 17 + n)`, source's own
// formula) rather than a single fixed literal — still fully deterministic
// for a given shape/N, never `Math.random()`.

type Shape = "normal" | "skewed" | "bimodal" | "uniform";

const SHAPES: readonly Shape[] = ["normal", "skewed", "bimodal", "uniform"];
const NS = [50, 500, 5000] as const;

function skewLabel(s: number): string {
  return Math.abs(s) < 0.3 ? "symmetric" : s > 0 ? "right-skewed" : "left-skewed";
}

function kurtLabel(k: number): string {
  return k > 1 ? "leptokurtic (heavy tails)" : k < -1 ? "platykurtic (light tails)" : "mesokurtic (normal)";
}

export function DistributionExplorer() {
  const [shape, setShape] = useState<Shape>("normal");
  const [n, setN] = useState(500);
  const [bins, setBins] = useState(30);

  const W = 480;
  const H = 260;
  const PADL = 30;
  const PADR = 12;
  const PADT = 16;
  const PADB = 28;
  const plotW = W - PADL - PADR;
  const plotH = H - PADT - PADB;

  const data = useMemo(() => {
    const rng = mulberry32(shape.charCodeAt(0) * 17 + n);
    const pts: number[] = [];
    for (let i = 0; i < n; i++) {
      let v: number;
      if (shape === "normal") v = randn(rng);
      else if (shape === "skewed") v = Math.exp(0.6 * randn(rng)) - 1.2;
      else if (shape === "bimodal") v = rng() < 0.5 ? randn(rng) - 2.2 : randn(rng) + 2.2;
      else v = (rng() - 0.5) * 6;
      pts.push(v);
    }
    return pts;
  }, [shape, n]);

  const stats = useMemo(() => {
    const sorted = [...data].sort((a, b) => a - b);
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    const median =
      sorted.length % 2 === 0
        ? ((sorted[sorted.length / 2 - 1] ?? 0) + (sorted[sorted.length / 2] ?? 0)) / 2
        : (sorted[Math.floor(sorted.length / 2)] ?? 0);
    const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length;
    const sd = Math.sqrt(variance);
    const skewness = data.reduce((s, v) => s + ((v - mean) / sd) ** 3, 0) / data.length;
    const kurtosis = data.reduce((s, v) => s + ((v - mean) / sd) ** 4, 0) / data.length - 3;
    const min = sorted[0] ?? 0;
    const max = sorted[sorted.length - 1] ?? 0;
    return { mean, median, sd, skewness, kurtosis, min, max };
  }, [data]);

  const histogram = useMemo(() => {
    const { min, max } = stats;
    const bw = (max - min) / bins;
    const counts = new Array(bins).fill(0);
    for (const v of data) {
      const idx = Math.min(Math.floor((v - min) / bw), bins - 1);
      counts[idx]++;
    }
    return { counts, bw, min, max };
  }, [data, bins, stats]);

  const modeCenter = useMemo(() => {
    const maxIdx = histogram.counts.indexOf(Math.max(...histogram.counts));
    return histogram.min + (maxIdx + 0.5) * histogram.bw;
  }, [histogram]);

  const xScale = (v: number) => PADL + ((v - histogram.min) / (histogram.max - histogram.min)) * plotW;
  const maxCount = Math.max(...histogram.counts);
  const barW = plotW / bins;
  const meanX = xScale(stats.mean);
  const medianX = xScale(stats.median);
  const modeX = xScale(modeCenter);

  return (
    <Panel
      eyebrow="SIMULATOR"
      title="Distribution Explorer"
      meta="shape · N · bins"
      caption="Mean (purple), median (teal), mode (orange). Skewness and excess kurtosis shown below."
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>Shape</label>
            <div className="sim-ctrl-row" style={{ flexWrap: "wrap", gap: 4 }}>
              {SHAPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn btn-sm${shape === s ? " active" : ""}`}
                  onClick={() => setShape(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="sim-ctrl">
            <label>
              N <span className="mono">{n}</span>
            </label>
            <div className="sim-ctrl-row" style={{ gap: 4 }}>
              {NS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`btn btn-sm${n === v ? " active" : ""}`}
                  onClick={() => setN(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="sim-ctrl">
            <label>
              Bins <span className="mono">{bins}</span>
            </label>
            <input
              type="range"
              min="10"
              max="60"
              step="1"
              value={bins}
              aria-label="Number of histogram bins"
              onChange={(e) => setBins(+e.target.value)}
            />
          </div>
          <div className="sim-stats">
            <div>
              <div className="k">Mean</div>
              <div className="v mono">{round(stats.mean, 3)}</div>
            </div>
            <div>
              <div className="k">Median</div>
              <div className="v mono">{round(stats.median, 3)}</div>
            </div>
            <div>
              <div className="k">SD</div>
              <div className="v mono">{round(stats.sd, 3)}</div>
            </div>
            <div>
              <div className="k">Skew</div>
              <div className="v mono">{round(stats.skewness, 2)}</div>
            </div>
            <div>
              <div className="k">Kurt</div>
              <div className="v mono">{round(stats.kurtosis, 2)}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, lineHeight: 1.4, marginTop: 4 }}>
            {skewLabel(stats.skewness)}
            <br />
            {kurtLabel(stats.kurtosis)}
          </div>
        </div>
        <div className="plot-wrap">
          <svg viewBox={`0 0 ${W} ${H}`}>
            <line x1={PADL} y1={PADT + plotH} x2={PADL + plotW} y2={PADT + plotH} stroke="rgba(244,242,236,0.15)" strokeWidth="1" />
            <line x1={PADL} y1={PADT} x2={PADL} y2={PADT + plotH} stroke="rgba(244,242,236,0.15)" strokeWidth="1" />
            {histogram.counts.map((c: number, i: number) => {
              const bx = PADL + i * barW;
              const bh = (c / maxCount) * plotH;
              const by = PADT + plotH - bh;
              return (
                <rect
                  key={i}
                  x={bx + 0.5}
                  y={by}
                  width={Math.max(barW - 1, 1)}
                  height={bh}
                  fill="#5B3EE8"
                  opacity="0.7"
                  rx="1"
                />
              );
            })}
            {meanX > PADL && meanX < PADL + plotW && (
              <line x1={meanX} y1={PADT} x2={meanX} y2={PADT + plotH} stroke="#A78BFA" strokeWidth="1.5" strokeDasharray="4 2" />
            )}
            {medianX > PADL && medianX < PADL + plotW && (
              <line x1={medianX} y1={PADT} x2={medianX} y2={PADT + plotH} stroke="#2DD4BF" strokeWidth="1.5" strokeDasharray="4 2" />
            )}
            {modeX > PADL && modeX < PADL + plotW && (
              <line x1={modeX} y1={PADT} x2={modeX} y2={PADT + plotH} stroke="#FB923C" strokeWidth="1.5" strokeDasharray="4 2" />
            )}
            <circle cx={PADL + 8} cy={PADT + 8} r={4} fill="#A78BFA" />
            <text x={PADL + 16} y={PADT + 12} fill="#A78BFA" fontSize="9">mean</text>
            <circle cx={PADL + 52} cy={PADT + 8} r={4} fill="#2DD4BF" />
            <text x={PADL + 60} y={PADT + 12} fill="#2DD4BF" fontSize="9">median</text>
            <circle cx={PADL + 104} cy={PADT + 8} r={4} fill="#FB923C" />
            <text x={PADL + 112} y={PADT + 12} fill="#FB923C" fontSize="9">mode</text>
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
              const val = histogram.min + frac * (histogram.max - histogram.min);
              const tx = PADL + frac * plotW;
              return (
                <g key={i}>
                  <line x1={tx} y1={PADT + plotH} x2={tx} y2={PADT + plotH + 4} stroke="rgba(244,242,236,0.25)" strokeWidth="1" />
                  <text x={tx} y={H - 4} textAnchor="middle" fill="rgba(244,242,236,0.4)" fontSize="8">
                    {round(val, 1)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default DistributionExplorer;
