"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { useControllableAnimation } from "@/lib/animation-policy";
import { mulberry32, normCdf } from "@/lib/data-science/sim-kit";
import { useDataScienceLocale } from "../locale-context";

// ─── ABSim ──────────────────────────────────────────
//
// Typed port of Ch08_Experiment.js's `ABSim`: a live-running A/B test
// simulator. Its seed is randomized once per fresh state
// (`mulberry32(Math.floor(Math.random() * 1e9))`) — unlike GaltonSim/
// ThresholdSim's fixed literal seeds, this is source's own intentional
// design (a different random run every reset), still routed through
// `mulberry32`, never `Math.random()` anywhere else. `stateRef` uses the
// canonical lazy-ref-init pattern (`if (!stateRef.current) ...`) since
// `useRef` has no lazy-initializer overload — do not replace with
// `useRef(fresh())` (re-invokes every render) or `useMemo` (not
// guaranteed to run only once).

interface ABHistoryEntry {
  readonly day: number;
  readonly pC: number;
  readonly pV: number;
  readonly lift: number;
  readonly low: number;
  readonly high: number;
  readonly pval: number;
}

interface ABState {
  rng: () => number;
  day: number;
  nC: number;
  cC: number;
  nV: number;
  cV: number;
  history: ABHistoryEntry[];
}

function fresh(): ABState {
  return {
    rng: mulberry32(Math.floor(Math.random() * 1e9)),
    day: 0,
    nC: 0,
    cC: 0,
    nV: 0,
    cV: 0,
    history: [],
  };
}

const W = 560;
const H = 180;
const Y_MIN = -0.04;
const Y_MAX = 0.06;

function xMap(d: number): number {
  return 30 + (d / 28) * (W - 60);
}

function yMap(v: number): number {
  return 160 - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * 140;
}

export function ABSim() {
  const { text } = useDataScienceLocale();
  const [trueLift, setTrueLift] = useState(0.02);
  const [baseline, setBaseline] = useState(0.12);
  const [dailyN, setDailyN] = useState(2000);
  const [speed, setSpeed] = useState(1);
  const { running, toggle: toggleRunning } = useControllableAnimation(false);
  const [tick, setTick] = useState(0);
  const stateRef = useRef<ABState | null>(null);
  if (!stateRef.current) stateRef.current = fresh();

  function reset() {
    stateRef.current = fresh();
    setTick((t) => t + 1);
  }

  useEffect(() => {
    if (!running) return;
    let raf: number;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const s2 = stateRef.current!;
      const daysToAdd = dt * speed;
      if (s2.day + daysToAdd <= 28) {
        let remaining = daysToAdd;
        while (remaining > 0 && s2.day < 28) {
          const step = Math.min(0.1, remaining);
          const users = Math.round(dailyN * step);
          for (let i = 0; i < users; i++) {
            const toControl = s2.rng() < 0.5;
            if (toControl) {
              s2.nC++;
              if (s2.rng() < baseline) s2.cC++;
            } else {
              s2.nV++;
              if (s2.rng() < baseline + trueLift) s2.cV++;
            }
          }
          s2.day += step;
          remaining -= step;
        }
        const pC = s2.cC / (s2.nC || 1);
        const pV = s2.cV / (s2.nV || 1);
        const lift = pV - pC;
        const se = Math.sqrt(
          (pC * (1 - pC)) / (s2.nC || 1) + (pV * (1 - pV)) / (s2.nV || 1),
        );
        const z = se > 0 ? lift / se : 0;
        const pval = 2 * (1 - normCdf(Math.abs(z)));
        s2.history.push({
          day: s2.day,
          pC,
          pV,
          lift,
          low: lift - 1.96 * se,
          high: lift + 1.96 * se,
          pval,
        });
        if (s2.history.length > 400) s2.history.shift();
      }
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, speed, dailyN, baseline, trueLift]);

  const s = stateRef.current;
  const latest = s.history[s.history.length - 1] ?? {
    pC: baseline,
    pV: baseline,
    lift: 0,
    low: 0,
    high: 0,
    pval: 1,
  };
  const p1 = baseline;
  const p2 = baseline + trueLift;
  const nPerArm =
    trueLift !== 0
      ? Math.ceil(
          ((1.96 + 0.84) ** 2 * (p1 * (1 - p1) + p2 * (1 - p2))) /
            (trueLift * trueLift),
        )
      : Infinity;
  const daysNeeded = (nPerArm * 2) / dailyN;
  const progress = Math.min(1, (s.nC + s.nV) / (nPerArm * 2 || 1));

  const bandPath = useMemo(() => {
    if (s.history.length < 2) return "";
    const top = s.history
      .map((h) => `${xMap(h.day)},${yMap(h.high)}`)
      .join(" L ");
    const bot = [...s.history]
      .reverse()
      .map((h) => `${xMap(h.day)},${yMap(h.low)}`)
      .join(" L ");
    return `M ${top} L ${bot} Z`;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mirrors source: keyed off `tick`, since `s.history` is a mutated ref field, not React state
  }, [tick]);

  const linePath = useMemo(() => {
    if (s.history.length < 2) return "";
    return (
      "M " + s.history.map((h) => `${xMap(h.day)},${yMap(h.lift)}`).join(" L ")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mirrors source: keyed off `tick`, since `s.history` is a mutated ref field, not React state
  }, [tick]);

  const significant = latest.pval < 0.05;

  return (
    <Panel
      eyebrow={text("SYNTHETIC · A/B TEST", "SYNTHETISCH · A/B-TEST")}
      title={text("Experiment stream", "Experimentverlauf")}
      meta={text(
        `Day ${s.day.toFixed(1)} / 28`,
        `Tag ${s.day.toFixed(1)} / 28`,
      )}
      caption={text(
        "The shaded band is an unadjusted, normal-approximation 95% interval for Δconversion in one locally generated Bernoulli stream. A crossing at an interim look is not a stopping rule. The sample estimate assumes equal independent arms, α=0.05, 80% power, no attrition, and a fixed horizon.",
        "Das schattierte Band ist ein unkorrigiertes 95%-Intervall mit Normalapproximation für ΔConversion in einem lokal erzeugten Bernoulli-Verlauf. Eine Kreuzung bei einer Zwischenanalyse ist keine Stoppregel. Die Stichprobenschätzung setzt gleich große unabhängige Gruppen, α=0.05, 80% Power, keine Ausfälle und einen festen Endzeitpunkt voraus.",
      )}
    >
      <div className="sim-row" style={{ gridTemplateColumns: "280px 1fr" }}>
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>
              {text("True lift", "Wahrer Lift")}{" "}
              <span className="mono">{(trueLift * 100).toFixed(1)} pp</span>
            </label>
            <input
              type="range"
              min="-0.03"
              max="0.05"
              step="0.002"
              aria-label={text("True lift", "Wahrer Lift")}
              value={trueLift}
              onChange={(e) => {
                setTrueLift(+e.target.value);
                reset();
              }}
            />
          </div>
          <div className="sim-ctrl">
            <label>
              {text("Baseline CVR", "Ausgangs-CVR")}{" "}
              <span className="mono">{(baseline * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0.02"
              max="0.30"
              step="0.01"
              aria-label={text(
                "Baseline conversion rate",
                "Ausgangs-Conversion-Rate",
              )}
              value={baseline}
              onChange={(e) => {
                setBaseline(+e.target.value);
                reset();
              }}
            />
          </div>
          <div className="sim-ctrl">
            <label>
              {text("Daily visitors", "Besucher pro Tag")}{" "}
              <span className="mono">{dailyN}</span>
            </label>
            <input
              type="range"
              min="500"
              max="10000"
              step="500"
              aria-label={text("Daily visitors", "Besucher pro Tag")}
              value={dailyN}
              onChange={(e) => setDailyN(+e.target.value)}
            />
          </div>
          <div className="sim-ctrl">
            <label>
              {text("Speed", "Geschwindigkeit")}{" "}
              <span className="mono">{speed}×</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              aria-label={text(
                "Simulation speed",
                "Simulationsgeschwindigkeit",
              )}
              value={speed}
              onChange={(e) => setSpeed(+e.target.value)}
            />
          </div>
          <div className="sim-ctrl-row">
            <button
              type="button"
              className={`btn btn-sm ${running ? "btn-primary" : ""}`}
              onClick={toggleRunning}
            >
              {running
                ? text("❚❚ Pause", "❚❚ Pause")
                : text("▶ Play", "▶ Start")}
            </button>
            <button type="button" className="btn btn-sm" onClick={reset}>
              ↻ {text("Reset", "Zurücksetzen")}
            </button>
          </div>
          <div className="sim-stats" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <div className="k">{text("CONTROL", "KONTROLLE")}</div>
              <div className="v" style={{ fontSize: 22 }}>
                {(latest.pC * 100).toFixed(2)}%
              </div>
              <div className="sub mono">
                {s.cC}/{s.nC}
              </div>
            </div>
            <div>
              <div className="k">{text("VARIANT", "VARIANTE")}</div>
              <div
                className="v"
                style={{ fontSize: 22, color: "var(--violet)" }}
              >
                {(latest.pV * 100).toFixed(2)}%
              </div>
              <div className="sub mono">
                {s.cV}/{s.nV}
              </div>
            </div>
          </div>
          <div className="ab-verdict" data-sig={significant ? "yes" : "no"}>
            <div className="ab-verdict-k">{text("p-value", "p-Wert")}</div>
            <div className="ab-verdict-v">
              {latest.pval < 1e-3 ? "<0.001" : latest.pval.toFixed(3)}
            </div>
            <div className="ab-verdict-note">
              {significant
                ? text(
                    "nominal p < 0.05 at this look",
                    "nominal p < 0.05 bei dieser Analyse",
                  )
                : text(
                    "nominal p ≥ 0.05 at this look",
                    "nominal p ≥ 0.05 bei dieser Analyse",
                  )}
            </div>
          </div>
          <div className="ab-power">
            <div className="ab-power-head">
              <span>
                {text(
                  "Approximate fixed-horizon sample · 80% power",
                  "Näherungsstichprobe mit festem Endpunkt · 80% Power",
                )}
              </span>
              <span className="mono">
                {Math.min(99, Math.floor(progress * 100))}%
              </span>
            </div>
            <div className="ab-power-bar">
              <div
                className="ab-power-fill"
                style={{ width: `${Math.min(100, progress * 100)}%` }}
              />
            </div>
            <div className="ab-power-note">
              {text("Estimate", "Schätzung")}{" "}
              <span className="mono">
                {Number.isFinite(nPerArm) ? nPerArm.toLocaleString() : "∞"}
              </span>{" "}
              {text("per arm", "je Gruppe")} · ~
              <span className="mono">
                {Number.isFinite(daysNeeded) ? daysNeeded.toFixed(1) : "∞"}
              </span>{" "}
              {text("days", "Tage")}
            </div>
          </div>
        </div>
        <div className="sim-plots">
          <div className="plot-wrap">
            <div className="sim-plot-head">
              {text(
                "Observed lift with 95% CI",
                "Beobachteter Lift mit 95%-KI",
              )}
              <span className="hint">
                {text("true lift", "wahrer Lift")} ={" "}
                {(trueLift * 100).toFixed(1)}pp
              </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`}>
              {[-0.04, -0.02, 0, 0.02, 0.04, 0.06].map((v) => (
                <g key={v}>
                  <line
                    x1="30"
                    y1={yMap(v)}
                    x2={W - 10}
                    y2={yMap(v)}
                    stroke={v === 0 ? "#A49D9A" : "#E6E1D8"}
                    strokeWidth={v === 0 ? 1 : 0.5}
                    strokeDasharray={v === 0 ? "0" : "2 3"}
                  />
                  <text
                    x="26"
                    y={yMap(v) + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#6A6270"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {(v * 100).toFixed(0)}pp
                  </text>
                </g>
              ))}
              <line
                x1="30"
                y1={yMap(trueLift)}
                x2={W - 10}
                y2={yMap(trueLift)}
                stroke="#E8A031"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.7"
              />
              <text
                x={W - 12}
                y={yMap(trueLift) - 4}
                textAnchor="end"
                fontSize="9"
                fill="#E8A031"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
              >
                {text("truth", "wahr")} · {(trueLift * 100).toFixed(1)}pp
              </text>
              {bandPath && <path d={bandPath} fill="#5B3EE8" opacity="0.12" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#5B3EE8"
                  strokeWidth="1.6"
                />
              )}
              {s.history.length > 0 && (
                <circle
                  cx={xMap(latest.day)}
                  cy={yMap(latest.lift)}
                  r="3.5"
                  fill={significant ? "#1FAF7E" : "#5B3EE8"}
                />
              )}
              {[0, 7, 14, 21, 28].map((d) => (
                <g key={d}>
                  <line
                    x1={xMap(d)}
                    y1="160"
                    x2={xMap(d)}
                    y2="164"
                    stroke="#A49D9A"
                  />
                  <text
                    x={xMap(d)}
                    y="175"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#6A6270"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    d{d}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default ABSim;
