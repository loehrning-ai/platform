"use client";

import { useMemo, useState } from "react";
import { useDataScienceLocale } from "@/components/data-science/locale-context";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, normCdf, normInv, round } from "@/lib/data-science/sim-kit";

// ─── PowerCalculator ───────────────────────────────
//
// Typed port of Ch10_Peeking.js's `PowerCalculator`: statistical power
// calculator. No RNG — pure normCdf/normInv math.

const BAD = "#C92424";
const MINT = "#0E7250";
const BLUE = "#2257C7";
const AMB = "#935C00";
const INK3 = "#5C5650";
const HAIR = "rgba(20,18,22,0.10)";
const BGHT = "var(--panel-hi)";
const baseRate = 0.1;

const SVG_W = 300;
const SVG_H = 140;
const PL = 38;
const PR = 10;
const PT = 10;
const PB = 28;

export function PowerCalculator() {
  const { text } = useDataScienceLocale();
  const [mde, setMde] = useState(0.05);
  const [n, setN] = useState(2000);
  const [alpha, setAlpha] = useState(0.05);

  const power = useMemo(() => {
    const delta = baseRate * mde;
    const p1 = baseRate;
    const p2 = baseRate + delta;
    const se = Math.sqrt((p1 * (1 - p1)) / n + (p2 * (1 - p2)) / n);
    const zCrit = normInv(1 - alpha / 2);
    const z = delta / se - zCrit;
    return clamp(normCdf(z) * 100, 0, 99.99);
  }, [mde, n, alpha]);

  const minN = useMemo(() => {
    const delta = baseRate * mde;
    const p1 = baseRate;
    const p2 = baseRate + delta;
    const zAlpha = normInv(1 - alpha / 2);
    const zBeta = normInv(0.8);
    return Math.ceil(
      Math.pow(
        zAlpha * Math.sqrt(2 * baseRate * (1 - baseRate)) +
          zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
        2,
      ) /
        (delta * delta),
    );
  }, [mde, alpha]);

  const curveData = useMemo(() => {
    const nVals: number[] = [];
    const step = Math.max(100, Math.floor((minN * 4) / 40 / 100) * 100);
    for (let ni = 100; ni <= minN * 4; ni += step) nVals.push(ni);
    const delta = baseRate * mde;
    const p1 = baseRate;
    const p2 = baseRate + delta;
    const zCrit = normInv(1 - alpha / 2);
    return nVals.map((ni) => {
      const se = Math.sqrt((p1 * (1 - p1)) / ni + (p2 * (1 - p2)) / ni);
      const z = delta / se - zCrit;
      return { n: ni, power: clamp(normCdf(z) * 100, 0, 99.99) };
    });
  }, [mde, alpha, minN]);

  const maxN = curveData.length ? curveData[curveData.length - 1]!.n : n * 4;
  const xS = (ni: number) => PL + (ni / maxN) * (SVG_W - PL - PR);
  const yS = (pw: number) => PT + (1 - pw / 100) * (SVG_H - PT - PB);
  const pathD = curveData
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"}${round(xS(d.n), 1)},${round(yS(d.power), 1)}`,
    )
    .join(" ");
  const currentX = xS(n);
  const currentY = yS(power);

  const sliders = [
    {
      label: text(
        "Minimum detectable effect (MDE)",
        "Minimal nachweisbarer Effekt (MDE)",
      ),
      val: mde,
      min: 0.01,
      max: 0.5,
      step: 0.01,
      fmt: (v: number) =>
        `${round(v * 100, 1)}% ${text("relative", "relativ")}`,
      set: setMde,
    },
    {
      label: text("Sample size per arm (n)", "Stichprobengröße je Gruppe (n)"),
      val: n,
      min: 100,
      max: 20000,
      step: 100,
      fmt: (v: number) => v.toLocaleString(),
      set: setN,
    },
    {
      label: text("Significance level (α)", "Signifikanzniveau (α)"),
      val: alpha,
      min: 0.01,
      max: 0.1,
      step: 0.01,
      fmt: (v: number) => String(v),
      set: setAlpha,
    },
  ];

  return (
    <Panel
      eyebrow={text("CALCULATOR", "RECHNER")}
      title={text("Statistical Power", "Statistische Power")}
      caption={text(
        `Normal-approximation teaching calculation for two independent, equal-sized arms, a two-sided z test, and a ${(baseRate * 100).toFixed(0)}% baseline. It omits clustering, attrition, repeated looks, and multiplicity; use a design-specific calculation for a real experiment.`,
        `Lehrrechnung mit Normalapproximation für zwei unabhängige, gleich große Gruppen, einen zweiseitigen z-Test und eine Basisrate von ${(baseRate * 100).toFixed(0)}%. Clustering, Ausfälle, Zwischenanalysen und Multiplizität fehlen; reale Experimente benötigen eine designspezifische Rechnung.`,
      )}
    >
      <div className="ds-responsive-split">
        <div>
          {sliders.map(({ label, val, min, max, step, fmt, set }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div
                className="ds-control-heading"
                style={{ fontSize: 12, marginBottom: 4 }}
              >
                <span style={{ color: "var(--ink-2)" }}>{label}</span>
                <span style={{ color: "var(--ink-1)", fontWeight: 600 }}>
                  {fmt(val)}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={val}
                aria-label={label}
                onChange={(e) => set(+e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
          ))}
          <div className="ds-responsive-metrics" style={{ marginTop: 8 }}>
            <div
              style={{
                padding: "10px 12px",
                background: BGHT,
                borderRadius: 8,
                border: `1px solid ${HAIR}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: BLUE,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Power
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontFamily: "var(--font-serif,serif)",
                  color: power >= 80 ? MINT : power >= 60 ? AMB : BAD,
                }}
              >
                {round(power, 1)}%
              </div>
            </div>
            <div
              style={{
                padding: "10px 12px",
                background: BGHT,
                borderRadius: 8,
                border: `1px solid ${HAIR}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: BLUE,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {text("Min n (80%)", "Min. n (80%)")}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontFamily: "var(--font-serif,serif)",
                  color: "var(--ink-1)",
                }}
              >
                {minN.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: INK3 }}>
                {text("per arm", "je Gruppe")}
              </div>
            </div>
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              color: INK3,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {text("Power curve", "Power-Kurve")}
          </div>
          <svg
            width="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H + 4}`}
            style={{ overflow: "visible" }}
          >
            <line
              x1={PL}
              y1={yS(80)}
              x2={SVG_W - PR}
              y2={yS(80)}
              stroke={MINT}
              strokeWidth={1}
              strokeDasharray="4,3"
              opacity={0.6}
            />
            <text x={PL + 2} y={yS(80) - 3} fontSize={8} fill={MINT}>
              80% Power
            </text>
            <path
              d={`${pathD} L${xS(maxN)},${yS(0)} L${xS(100)},${yS(0)} Z`}
              fill={BLUE}
              opacity={0.07}
            />
            <path
              d={pathD}
              fill="none"
              stroke={BLUE}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1={currentX}
              y1={PT}
              x2={currentX}
              y2={SVG_H - PB}
              stroke={AMB}
              strokeWidth={1}
              strokeDasharray="3,2"
              opacity={0.8}
            />
            <circle
              cx={currentX}
              cy={currentY}
              r={5}
              fill={AMB}
              stroke="#1f2937"
              strokeWidth={2}
            />
            <text
              x={currentX}
              y={currentY - 9}
              fontSize={9}
              fill={AMB}
              textAnchor="middle"
            >
              {round(power, 1)}%
            </text>
            <line
              x1={PL}
              y1={PT}
              x2={PL}
              y2={SVG_H - PB}
              stroke={HAIR}
              strokeWidth={1}
            />
            <line
              x1={PL}
              y1={SVG_H - PB}
              x2={SVG_W - PR}
              y2={SVG_H - PB}
              stroke={HAIR}
              strokeWidth={1}
            />
            {[0, 25, 50, 75, 100].map((pw) => (
              <text
                key={pw}
                x={PL - 3}
                y={yS(pw) + 3}
                fontSize={8}
                fill={INK3}
                textAnchor="end"
              >
                {pw}%
              </text>
            ))}
            <text
              x={SVG_W / 2}
              y={SVG_H + 4}
              fontSize={8}
              fill={INK3}
              textAnchor="middle"
            >
              {text("Sample size per arm", "Stichprobengröße je Gruppe")}
            </text>
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default PowerCalculator;
