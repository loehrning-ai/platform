"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { useControllableAnimation } from "@/lib/animation-policy";
import { clamp, mulberry32, round } from "@/lib/data-science/sim-kit";
import { useDataScienceLocale } from "../locale-context";

// ─── GaltonSim ──────────────────────────────────────
//
// Typed port of Ch01_Fundamentals.js's `GaltonSim`: a physics-driven
// Central Limit Theorem demo. Balls drop through a peg grid (top), stack
// into the population histogram (middle), and every `n` balls their mean
// drops into the sampling-distribution histogram (bottom). Seeded with
// `mulberry32(42)` — never reseed or swap for `Math.random()`. All state
// that drives the RAF loop lives in refs (the sanctioned mutable escape
// hatch for imperative per-frame physics); `tick` exists purely to force
// a re-render each frame, matching source exactly.

type Population = "bell" | "skew" | "bimodal";

const POPULATION_LABELS_DE: Readonly<Record<Population, string>> = {
  bell: "Glocke",
  skew: "schief",
  bimodal: "bimodal",
};

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  row: number;
  hue: string;
  batchId: number;
  landed: boolean;
  age: number;
  binIdx?: number;
  stackIdx?: number;
}

interface MeanBall {
  x: number;
  y: number;
  tx: number;
  ty: number;
  t: number;
  dur: number;
  hue: string;
  meanVal: number;
  cy?: number;
  done?: boolean;
}

interface Peg {
  readonly x: number;
  readonly y: number;
}

const W = 520;
const H = 620;
const BOARD_TOP = 30;
const BOARD_BOT = 280;
const POP_TOP = 290;
const POP_BOT = 400;
const MEAN_TOP = 450;
const MEAN_BOT = 590;
const BIN_W = W / 32;
const PEG_ROWS = 11;

function buildPegs(): readonly Peg[] {
  const pegs: Peg[] = [];
  for (let row = 0; row < PEG_ROWS; row++) {
    const cy =
      BOARD_TOP + 10 + (row / (PEG_ROWS - 1)) * (BOARD_BOT - BOARD_TOP - 40);
    const cols = row + 2;
    const spacing = W / (cols + 1);
    for (let col = 0; col < cols; col++) {
      pegs.push({ x: (col + 1) * spacing, y: cy });
    }
  }
  return pegs;
}

function normalPath(
  mu: number,
  sigma: number,
  top: number,
  bot: number,
  binW: number,
  width: number,
): string {
  const pts: string[] = [];
  for (let x = 0; x <= width; x += 4) {
    const binIdx = x / binW;
    const z = (binIdx - mu) / Math.max(0.5, sigma);
    const y = Math.exp(-0.5 * z * z);
    const py = bot - y * (bot - top - 10);
    pts.push(`${x},${py}`);
  }
  return "M " + pts.join(" L ");
}

export function GaltonSim() {
  const { locale, text } = useDataScienceLocale();
  const [n, setN] = useState(25);
  const [rate, setRate] = useState(8);
  const [pop, setPop] = useState<Population>("bell");
  const { running, toggle: toggleRunning } = useControllableAnimation(false);
  const [, setTick] = useState(0);

  const ballsRef = useRef<Ball[]>([]);
  const stackRef = useRef<number[]>(new Array(32).fill(0));
  const sampleBufRef = useRef<number[]>([]);
  const meansRef = useRef<number[]>([]);
  const meanStackRef = useRef<number[]>(new Array(32).fill(0));
  const meanBallsRef = useRef<MeanBall[]>([]);
  const rngRef = useRef(mulberry32(42));

  const pegs = useMemo(() => buildPegs(), []);

  const spawnBall = useCallback((sampleBatchId: number) => {
    ballsRef.current.push({
      x: W / 2 + (rngRef.current() - 0.5) * 8,
      y: BOARD_TOP - 8,
      vx: 0,
      vy: 0,
      row: -1,
      hue: sampleBatchId % 2 === 0 ? "#5B3EE8" : "#E8318F",
      batchId: sampleBatchId,
      landed: false,
      age: 0,
    });
  }, []);

  const biasAt = useCallback(
    (x: number): number => {
      const r = rngRef.current();
      if (pop === "bell") return r < 0.5 ? -1 : 1;
      if (pop === "skew") return r < 0.35 ? -1 : 1;
      const leanCenter = (x - W / 2) / (W / 2);
      const pushProb = 0.5 + 0.28 * Math.sign(leanCenter || r - 0.5);
      return r < pushProb
        ? leanCenter >= 0
          ? 1
          : -1
        : leanCenter >= 0
          ? -1
          : 1;
    },
    [pop],
  );

  useEffect(() => {
    if (!running) return;
    let raf: number;
    let last = performance.now();
    let ballAccum = 0;
    let sampleBatchId = 0;
    let inBatch = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ballAccum += dt * rate;
      while (ballAccum >= 1) {
        ballAccum -= 1;
        spawnBall(sampleBatchId);
        inBatch++;
        if (inBatch >= n) {
          sampleBatchId++;
          inBatch = 0;
        }
      }

      const balls = ballsRef.current;
      for (const b of balls) {
        if (b.landed) {
          b.age += dt;
          continue;
        }
        const rowF =
          (b.y - BOARD_TOP - 10) /
          ((BOARD_BOT - BOARD_TOP - 40) / (PEG_ROWS - 1));
        const rowIdx = Math.max(-1, Math.floor(rowF));
        if (rowIdx > b.row) {
          b.row = rowIdx;
          const dir = biasAt(b.x);
          const spacing = W / (rowIdx + 3);
          b.vx = dir * spacing * 2.8;
          b.vy = Math.max(b.vy, 180);
        }
        b.vy += 520 * dt;
        b.x += b.vx * dt;
        b.vx *= 0.93;
        b.y += b.vy * dt;
        if (b.y >= POP_TOP - 6) {
          b.landed = true;
          b.y = POP_TOP - 6;
          const binIdx = Math.max(0, Math.min(31, Math.floor(b.x / BIN_W)));
          const prevH = stackRef.current[binIdx] ?? 0;
          stackRef.current[binIdx] = prevH + 1;
          sampleBufRef.current.push(binIdx);
          if (sampleBufRef.current.length >= n) {
            const mean =
              sampleBufRef.current.reduce((acc, v) => acc + v, 0) /
              sampleBufRef.current.length;
            meansRef.current.push(mean);
            meanBallsRef.current.push({
              x: b.x,
              y: POP_BOT + 4,
              tx: (mean + 0.5) * BIN_W,
              ty: MEAN_BOT - 8,
              t: 0,
              dur: 0.9,
              hue: "#E8318F",
              meanVal: mean,
            });
            sampleBufRef.current = [];
          }
          b.binIdx = binIdx;
          b.stackIdx = prevH;
        }
      }

      for (const m of meanBallsRef.current) {
        m.t += dt;
        const u = clamp(m.t / m.dur, 0, 1);
        const eased = 1 - Math.pow(1 - u, 3);
        m.x =
          m.x +
          (m.tx - m.x) *
            (eased - clamp((m.t - dt) / m.dur, 0, 1) + eased * 1e-3);
        const arcLift = -60 * Math.sin(eased * Math.PI);
        m.cy = m.y + (m.ty - m.y) * eased + arcLift;
        if (u >= 1) {
          m.done = true;
          const binIdx = Math.max(0, Math.min(31, Math.floor(m.tx / BIN_W)));
          meanStackRef.current[binIdx] =
            (meanStackRef.current[binIdx] ?? 0) + 1;
        }
      }

      ballsRef.current = balls.filter((b) => !b.landed || b.age < 0.12);
      meanBallsRef.current = meanBallsRef.current.filter((m) => !m.done);
      setTick((k) => k + 1);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, rate, n, pop, spawnBall, biasAt]);

  const reset = useCallback(() => {
    stackRef.current = new Array(32).fill(0);
    meanStackRef.current = new Array(32).fill(0);
    ballsRef.current = [];
    meanBallsRef.current = [];
    meansRef.current = [];
    sampleBufRef.current = [];
    rngRef.current = mulberry32(42);
    setTick((k) => k + 1);
  }, []);

  useEffect(() => {
    reset();
  }, [pop, reset]);

  const totalSamples = meansRef.current.length;
  const totalBalls = stackRef.current.reduce((a, v) => a + v, 0);
  const meanOfMeans = totalSamples
    ? meansRef.current.reduce((a, v) => a + v, 0) / totalSamples
    : null;
  const seEmpirical =
    totalSamples > 1 && meanOfMeans !== null
      ? Math.sqrt(
          meansRef.current.reduce((a, v) => a + (v - meanOfMeans) ** 2, 0) /
            (totalSamples - 1),
        )
      : null;
  const popMax = Math.max(6, ...stackRef.current);
  const meanMax = Math.max(4, ...meanStackRef.current);

  return (
    <Panel
      eyebrow={text("LIVE · PHYSICS", "LIVE · PHYSIK")}
      title={text(
        "Galton Board · Sampling Distribution",
        "Galtonbrett · Stichprobenverteilung",
      )}
      meta={text(
        `n = ${n} · ${totalSamples} samples · ${totalBalls} balls`,
        `n = ${n} · ${totalSamples} Stichproben · ${totalBalls} Kugeln`,
      )}
      caption={text(
        "Top: balls drop through a peg grid, stacking into the population shape. Bottom: every n balls, their mean drops into the sampling distribution. Watch the bottom curve narrow and become bell-shaped, that's the CLT, live.",
        "Oben fallen Kugeln durch ein Raster und bilden die Grundgesamtheit. Unten wird nach jeweils n Kugeln ihr Mittelwert in die Stichprobenverteilung eingetragen. Mit wachsendem n wird diese Verteilung schmaler und glockenförmig: der zentrale Grenzwertsatz in der Simulation.",
      )}
    >
      <div className="sim-row galton-row">
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>{text("Population", "Grundgesamtheit")}</label>
            <div className="seg">
              {(["bell", "skew", "bimodal"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={pop === p ? "on" : ""}
                  onClick={() => setPop(p)}
                >
                  {locale === "de" ? POPULATION_LABELS_DE[p] : p}
                </button>
              ))}
            </div>
          </div>
          <div className="sim-ctrl">
            <label>
              {text("Sample size", "Stichprobengröße")}{" "}
              <span className="mono">n = {n}</span>
            </label>
            <input
              type="range"
              min="2"
              max="100"
              value={n}
              aria-label={text("Sample size", "Stichprobengröße")}
              onChange={(e) => setN(+e.target.value)}
            />
          </div>
          <div className="sim-ctrl">
            <label>
              {text("Drop rate", "Fallrate")}{" "}
              <span className="mono">{rate}/s</span>
            </label>
            <input
              type="range"
              min="2"
              max="40"
              value={rate}
              aria-label={text("Drop rate per second", "Fallrate pro Sekunde")}
              onChange={(e) => setRate(+e.target.value)}
            />
          </div>
          <div className="sim-ctrl-row">
            <button
              type="button"
              className={`btn btn-sm ${running ? "" : "btn-primary"}`}
              onClick={toggleRunning}
            >
              {running ? text("Pause", "Pause") : text("Play", "Start")}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={reset}
            >
              {text("Reset", "Zurücksetzen")}
            </button>
          </div>
          <div className="sim-stats">
            <div>
              <div className="k">
                {text("Mean of means", "Mittelwert der Mittelwerte")}
              </div>
              <div className="v">
                {meanOfMeans != null ? round(meanOfMeans, 2) : "—"}
              </div>
            </div>
            <div>
              <div className="k">
                {text("SE (empirical)", "SE (empirisch)")}
              </div>
              <div className="v" style={{ color: "var(--magenta)" }}>
                {seEmpirical != null ? round(seEmpirical, 2) : "—"}
              </div>
            </div>
            <div>
              <div className="k">{text("Samples", "Stichproben")}</div>
              <div className="v" style={{ color: "var(--violet)" }}>
                {totalSamples}
              </div>
            </div>
          </div>
          <div className="galton-note">
            <span className="tag-pill">CLT</span>
            {locale === "de" ? (
              <>
                Mit wachsendem <code className="mono">n</code> sinkt der
                <strong> SE um den Faktor 1/√n</strong>. Bei n=4 → SE≈1.7. Bei
                n=100 → SE≈0.35.
              </>
            ) : (
              <>
                As <code className="mono">n</code> grows,{" "}
                <strong>SE shrinks</strong> by
                <strong> 1/√n</strong>. At n=4 → SE≈1.7. At n=100 → SE≈0.35.
              </>
            )}
          </div>
        </div>
        <div className="galton-stage">
          <svg viewBox={`0 0 ${W} ${H}`} className="galton-svg">
            <defs>
              <linearGradient id="galton-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FBF8F1" stopOpacity="0" />
                <stop offset="1" stopColor="#FBF8F1" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d={`M ${W / 2 - 40} 6 L ${W / 2 - 14} 28 L ${W / 2 + 14} 28 L ${W / 2 + 40} 6`}
              fill="none"
              stroke="#3A3540"
              strokeWidth="1.4"
            />
            {pegs.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={2.2} fill="#A49D9A" />
            ))}
            {ballsRef.current.map((b, i) => {
              if (b.landed) {
                const binX = ((b.binIdx ?? 0) + 0.5) * BIN_W;
                const binBarH =
                  (((b.stackIdx ?? 0) + 1) / popMax) * (POP_BOT - POP_TOP - 10);
                const y = POP_BOT - binBarH + 4;
                return (
                  <circle
                    key={i}
                    cx={binX}
                    cy={y}
                    r={2.4}
                    fill={b.hue}
                    opacity={Math.max(0, 1 - b.age * 8)}
                  />
                );
              }
              return (
                <circle
                  key={i}
                  cx={b.x}
                  cy={b.y}
                  r={3}
                  fill={b.hue}
                  stroke="#14121688"
                  strokeWidth="0.5"
                />
              );
            })}
            {stackRef.current.map((v, i) => {
              const h = (v / popMax) * (POP_BOT - POP_TOP - 10);
              return (
                <rect
                  key={i}
                  x={i * BIN_W + 0.5}
                  y={POP_BOT - h}
                  width={BIN_W - 1}
                  height={h}
                  fill="#1CA5D9"
                  opacity="0.45"
                />
              );
            })}
            <text
              x="8"
              y={POP_TOP - 8}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10"
              fontWeight="700"
              letterSpacing="0.14em"
              fill="#6A6270"
              style={{ textTransform: "uppercase" }}
            >
              {text(
                `Population · ${totalBalls} balls`,
                `Grundgesamtheit · ${totalBalls} Kugeln`,
              )}
            </text>
            <line
              x1="0"
              y1={POP_BOT + 12}
              x2={W}
              y2={POP_BOT + 12}
              stroke="#A49D9A"
              strokeDasharray="3 4"
              strokeWidth="0.8"
            />
            <text
              x="8"
              y={MEAN_TOP - 6}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="10"
              fontWeight="700"
              letterSpacing="0.14em"
              fill="#6A6270"
              style={{ textTransform: "uppercase" }}
            >
              {text(
                `Sampling distribution of the mean · n = ${n}`,
                `Stichprobenverteilung des Mittelwerts · n = ${n}`,
              )}
            </text>
            {meanBallsRef.current.map((m, i) => (
              <g key={i}>
                <circle
                  cx={m.x}
                  cy={m.cy ?? m.y}
                  r={4}
                  fill={m.hue}
                  opacity="0.9"
                />
                <circle
                  cx={m.x}
                  cy={m.cy ?? m.y}
                  r={8}
                  fill="none"
                  stroke={m.hue}
                  strokeWidth="1"
                  opacity="0.4"
                />
              </g>
            ))}
            {meanStackRef.current.map((v, i) => {
              const h = (v / meanMax) * (MEAN_BOT - MEAN_TOP - 10);
              if (v === 0) return null;
              return (
                <rect
                  key={i}
                  x={i * BIN_W + 0.5}
                  y={MEAN_BOT - h}
                  width={BIN_W - 1}
                  height={h}
                  fill="#E8318F"
                  opacity="0.65"
                />
              );
            })}
            {totalSamples > 20 &&
              seEmpirical !== null &&
              seEmpirical > 0 &&
              meanOfMeans !== null && (
                <path
                  d={normalPath(
                    meanOfMeans,
                    seEmpirical,
                    MEAN_TOP,
                    MEAN_BOT,
                    BIN_W,
                    W,
                  )}
                  fill="none"
                  stroke="#5B3EE8"
                  strokeWidth="2"
                  opacity="0.85"
                  strokeDasharray="0"
                />
              )}
            <line
              x1="0"
              y1={MEAN_BOT}
              x2={W}
              y2={MEAN_BOT}
              stroke="#A49D9A"
              strokeWidth="0.8"
            />
            <line
              x1="0"
              y1={POP_BOT}
              x2={W}
              y2={POP_BOT}
              stroke="#A49D9A"
              strokeWidth="0.8"
            />
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default GaltonSim;
