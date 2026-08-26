"use client";

import { useMemo, useState } from "react";
import { useDataScienceLocale } from "@/components/data-science/locale-context";
import { Panel } from "@/components/data-science/shared/primitives";
import { mulberry32, randn, round } from "@/lib/data-science/sim-kit";

// ─── CUPEDExplainer ────────────────────────────────
//
// Typed port of Ch10_Peeking.js's `CUPEDExplainer`: variance-reduction
// demo. Seeded with `mulberry32(99)`.

const BAD = "#C92424";
const MINT = "#0E7250";
const BLUE = "#2257C7";
const INK3 = "#5C5650";
const HAIR = "rgba(20,18,22,0.10)";
const BGHT = "var(--panel-hi)";

interface Row {
  readonly group: 0 | 1;
  readonly x: number;
  readonly y: number;
}

const N = 30;
const W = 280;
const H = 160;
const PAD = 40;
const domain = [0.2, 0.4] as const;

function scale(v: number): number {
  return PAD + ((v - domain[0]) / (domain[1] - domain[0])) * (W - PAD - 20);
}

function mean(arr: readonly number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function vari(arr: readonly number[]): number {
  const m = mean(arr);
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
}

export function CUPEDExplainer() {
  const { text } = useDataScienceLocale();
  const [cupedOn, setCupedOn] = useState(false);

  const data = useMemo<readonly Row[]>(() => {
    const rng = mulberry32(99);
    const rows: Row[] = [];
    for (let i = 0; i < N * 2; i++) {
      const group: 0 | 1 = i < N ? 0 : 1;
      const x = 0.15 + randn(rng) * 0.08;
      const noise = randn(rng) * 0.12;
      const effect = group === 1 ? 0.02 : 0;
      const y = 0.5 * x + 0.25 + noise + effect;
      rows.push({ group, x, y });
    }
    return rows;
  }, []);

  const { theta, varRaw, varCuped, pctReduction } = useMemo(() => {
    const ctrl = data.filter((d) => d.group === 0);
    const trt = data.filter((d) => d.group === 1);
    const allX = data.map((d) => d.x);
    const xBar = mean(allX);
    const allY = data.map((d) => d.y);
    const yBar = mean(allY);
    const covXY =
      data.reduce((s, d) => s + (d.x - xBar) * (d.y - yBar), 0) / data.length;
    const varX = data.reduce((s, d) => s + (d.x - xBar) ** 2, 0) / data.length;
    const th = covXY / varX;
    const yCupedAll = data.map((d) => ({ ...d, yc: d.y - th * (d.x - xBar) }));
    const ctrlC = yCupedAll.filter((d) => d.group === 0);
    const trtC = yCupedAll.filter((d) => d.group === 1);
    const rawVals = [...ctrl.map((d) => d.y), ...trt.map((d) => d.y)];
    const cupedVals = [...ctrlC.map((d) => d.yc), ...trtC.map((d) => d.yc)];
    const varRaw2 = vari(rawVals);
    const varCuped2 = vari(cupedVals);
    return {
      theta: round(th, 3),
      varRaw: round(varRaw2, 5),
      varCuped: round(varCuped2, 5),
      pctReduction: round((1 - varCuped2 / varRaw2) * 100, 1),
    };
  }, [data]);

  const barsData = useMemo(() => {
    const allX = data.map((d) => d.x);
    const xBar = mean(allX);
    const allY = data.map((d) => d.y);
    const yBar = mean(allY);
    const covXY =
      data.reduce((s, d) => s + (d.x - xBar) * (d.y - yBar), 0) / data.length;
    const varX = data.reduce((s, d) => s + (d.x - xBar) ** 2, 0) / data.length;
    const th = covXY / varX;
    return [0, 1].map((g) => {
      const rows = data.filter((d) => d.group === g);
      const rawY = rows.map((d) => d.y);
      const cupY = rows.map((d) => d.y - th * (d.x - xBar));
      const mRaw = mean(rawY);
      const seRaw = Math.sqrt(vari(rawY) / rows.length);
      const mCup = mean(cupY);
      const seCup = Math.sqrt(vari(cupY) / rows.length);
      return { g, mRaw, seRaw, mCup, seCup };
    });
  }, [data]);

  return (
    <Panel
      eyebrow={text("EXPLAINER", "ERKLÄRUNG")}
      title={text(
        "CUPED, Variance Reduction via Covariates",
        "CUPED: Varianzreduktion durch Kovariaten",
      )}
      caption={text(
        "Toggle the adjustment for this fixed synthetic sample. The pooled linear coefficient reduces the displayed variance here; the group estimate can move in finite samples. Real analyses need a pre-treatment covariate, assignment-aware standard errors, and validation of the adjustment model.",
        "Schalte die Anpassung für diese feste synthetische Stichprobe um. Der gepoolte lineare Koeffizient senkt hier die angezeigte Varianz; die Gruppenschätzung kann sich in endlichen Stichproben verändern. Reale Analysen benötigen eine Vorbehandlungsvariable, zur Zuweisung passende Standardfehler und eine Prüfung des Anpassungsmodells.",
      )}
    >
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div
          style={{
            flex: "1 1 200px",
            padding: 16,
            background: BGHT,
            borderRadius: 10,
            border: `1px solid ${HAIR}`,
            fontSize: 12.5,
            lineHeight: 1.8,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono,monospace)",
              fontSize: 12,
              color: BLUE,
              marginBottom: 8,
            }}
          >
            {text("CUPED FORMULA", "CUPED-FORMEL")}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono,monospace)",
              color: "var(--ink-1)",
            }}
          >
            θ = Cov(Y, X) / Var(X)
            <br />Ŷ = Y − θ(X − X̄)
          </div>
          <div style={{ marginTop: 12, color: INK3, fontSize: 12 }}>
            <div>
              θ {text("estimated", "geschätzt")}:{" "}
              <strong style={{ color: "var(--ink-1)" }}>{theta}</strong>
            </div>
            <div>
              Var ({text("raw", "roh")}):{" "}
              <strong style={{ color: BAD }}>{varRaw}</strong>
            </div>
            <div>
              Var (CUPED): <strong style={{ color: MINT }}>{varCuped}</strong>
            </div>
          </div>
          <div
            style={{
              marginTop: 10,
              padding: "8px 10px",
              background: "rgba(16,185,129,0.1)",
              borderRadius: 6,
              color: MINT,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            ↓ {pctReduction}%{" "}
            {text("synthetic variance", "synthetische Varianz")}
          </div>
          <div style={{ marginTop: 14 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={cupedOn}
                onChange={(e) => setCupedOn(e.target.checked)}
              />
              {text("Apply CUPED", "CUPED anwenden")}
            </label>
          </div>
        </div>
        <div style={{ flex: "2 1 280px" }}>
          <div
            style={{
              fontSize: 12,
              color: INK3,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {cupedOn
              ? text(
                  "CUPED-adjusted metric (narrower CIs)",
                  "CUPED-bereinigte Metrik (engere KI)",
                )
              : text("Raw metric (wide CIs)", "Rohmetrik (weite KI)")}
          </div>
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H + 20}`}
            style={{ overflow: "visible" }}
          >
            {barsData.map((b, i) => {
              const m = cupedOn ? b.mCup : b.mRaw;
              const se = cupedOn ? b.seCup : b.seRaw;
              const ci = 1.96 * se;
              const x = scale(m);
              const y = 40 + i * 50;
              const color = i === 0 ? BLUE : MINT;
              const label =
                i === 0
                  ? text("Control", "Kontrolle")
                  : text("Treatment", "Treatment");
              return (
                <g key={i}>
                  <text
                    x={35}
                    y={y + 5}
                    fontSize={11}
                    fill="#d1d5db"
                    textAnchor="end"
                  >
                    {label}
                  </text>
                  <line
                    x1={scale(m - ci)}
                    y1={y}
                    x2={scale(m + ci)}
                    y2={y}
                    stroke={color}
                    strokeWidth={3}
                    strokeLinecap="round"
                    style={{ transition: "x1 500ms ease, x2 500ms ease" }}
                  />
                  <line
                    x1={scale(m - ci)}
                    y1={y - 6}
                    x2={scale(m - ci)}
                    y2={y + 6}
                    stroke={color}
                    strokeWidth={2}
                    style={{ transition: "x1 500ms ease, x2 500ms ease" }}
                  />
                  <line
                    x1={scale(m + ci)}
                    y1={y - 6}
                    x2={scale(m + ci)}
                    y2={y + 6}
                    stroke={color}
                    strokeWidth={2}
                    style={{ transition: "x1 500ms ease, x2 500ms ease" }}
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={5}
                    fill={color}
                    style={{ transition: "cx 500ms ease" }}
                  />
                  <text
                    x={x}
                    y={y - 12}
                    fontSize={10}
                    fill={color}
                    textAnchor="middle"
                    style={{ transition: "x 500ms ease" }}
                  >
                    {round(m, 3)} ± {round(ci, 3)}
                  </text>
                </g>
              );
            })}
            <line
              x1={PAD}
              y1={H - 10}
              x2={W - 10}
              y2={H - 10}
              stroke={HAIR}
              strokeWidth={1}
            />
            {[0.22, 0.26, 0.3, 0.34, 0.38].map((v) => (
              <g key={v}>
                <line
                  x1={scale(v)}
                  y1={H - 15}
                  x2={scale(v)}
                  y2={H - 5}
                  stroke={INK3}
                  strokeWidth={1}
                />
                <text
                  x={scale(v)}
                  y={H + 8}
                  fontSize={9}
                  fill={INK3}
                  textAnchor="middle"
                >
                  {v}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default CUPEDExplainer;
