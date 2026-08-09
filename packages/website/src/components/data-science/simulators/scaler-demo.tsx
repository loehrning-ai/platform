"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { useDataScienceLocale } from "../locale-context";

// ─── ScalerDemo ─────────────────────────────────────
//
// Typed port of Ch03_Clean.js's `ScalerDemo`. Feature values are
// hardcoded (no RNG in source), so there's nothing to seed here.

type Scaler = "raw" | "standard" | "minmax" | "robust";

interface Feature {
  readonly name: string;
  readonly values: readonly number[];
  readonly unit: string;
}

const FEATURES: readonly Feature[] = [
  { name: "Age", values: [23, 45, 31, 67, 28, 52], unit: "yrs" },
  {
    name: "Income",
    values: [28000, 95000, 42000, 180000, 35000, 120000],
    unit: "$",
  },
  { name: "Score", values: [45, 82, 60, 15, 91, 37], unit: "pts" },
  { name: "Clicks", values: [3, 120, 22, 450, 8, 230], unit: "n" },
  { name: "Days", values: [1, 7, 3, 30, 2, 14], unit: "d" },
  { name: "Spend", values: [5, 299, 49, 1200, 12, 599], unit: "$" },
];
const FEATURE_LABELS_DE: Readonly<Record<string, string>> = {
  Age: "Alter",
  Income: "Einkommen",
  Score: "Score",
  Clicks: "Klicks",
  Days: "Tage",
  Spend: "Ausgaben",
};

function standardize(vals: readonly number[]): number[] {
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd =
    Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length) || 1;
  return vals.map((v) => (v - m) / sd);
}

function minmax(vals: readonly number[]): number[] {
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  return vals.map((v) => (hi === lo ? 0 : (v - lo) / (hi - lo)));
}

function robust(vals: readonly number[]): number[] {
  const sorted = [...vals].sort((a, b) => a - b);
  const n = sorted.length;
  const q1 = sorted[Math.floor(n * 0.25)] ?? 0;
  const q2 = sorted[Math.floor(n * 0.5)] ?? 0;
  const q3 = sorted[Math.floor(n * 0.75)] ?? 0;
  const iqr = q3 - q1 || 1;
  return vals.map((v) => (v - q2) / iqr);
}

const SCALER_FORMULA: Record<Scaler, string> = {
  raw: "No transformation, raw values keep their original scale.",
  standard: "z = (x − μ) / σ   →  mean=0, std=1. Sensitive to outliers.",
  minmax:
    "x′ = (x − min) / (max − min)   →  range [0, 1]. Crushed by outliers.",
  robust:
    "x′ = (x − Q2) / IQR   →  median-centered; tail extremes do not set the scale. Suitability depends on the model and data.",
};
const SCALER_FORMULA_DE: Record<Scaler, string> = {
  raw: "Keine Transformation; die Rohwerte behalten ihre ursprüngliche Skala.",
  standard:
    "z = (x − μ) / σ   →  Mittelwert=0, Standardabweichung=1. Empfindlich gegen Ausreißer.",
  minmax:
    "x′ = (x − min) / (max − min)   →  Wertebereich [0, 1]. Ausreißer stauchen die übrigen Werte.",
  robust:
    "x′ = (x − Q2) / IQR   →  um den Median zentriert; Randextreme legen die Skala nicht fest. Die Eignung hängt von Modell und Daten ab.",
};
const SCALER_LABELS_DE: Record<Scaler, string> = {
  raw: "Rohdaten",
  standard: "Standard",
  minmax: "Min-Max",
  robust: "Robust",
};

const COLORS = [
  "#4DE2FF",
  "#D1FF3A",
  "#FF6B80",
  "#B89DFF",
  "#FFA500",
  "#00E5A0",
];

export function ScalerDemo() {
  const { locale, text } = useDataScienceLocale();
  const [scaler, setScaler] = useState<Scaler>("raw");

  const transform = useMemo(() => {
    return (vals: readonly number[]): readonly number[] => {
      if (scaler === "raw") return vals;
      if (scaler === "standard") return standardize(vals);
      if (scaler === "minmax") return minmax(vals);
      return robust(vals);
    };
  }, [scaler]);

  const allTransformed = FEATURES.map((f) => transform(f.values));
  const globalMin = Math.min(...allTransformed.flat());
  const globalMax = Math.max(...allTransformed.flat()) || 1;

  const W = 400;
  const H = 200;
  const PAD_L = 48;
  const PAD_R = 12;
  const PAD_T = 16;
  const PAD_B = 24;
  const nFeatures = FEATURES.length;
  const nBars = FEATURES[0]?.values.length ?? 0;
  const groupW = (W - PAD_L - PAD_R) / nFeatures;
  const barW = groupW / (nBars + 1);

  const barH = (v: number): number => {
    if (scaler === "raw") {
      const allRaw = FEATURES.map((f) => Math.max(...f.values));
      const gMax = Math.max(...allRaw) || 1;
      return Math.max(0, v / gMax) * (H - PAD_T - PAD_B);
    }
    const range = globalMax - globalMin;
    if (range === 0) return 0;
    return Math.max(0, (v - globalMin) / range) * (H - PAD_T - PAD_B);
  };

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text("Feature Scaling", "Merkmale skalieren")}
      meta={text(
        "6 features · 6 samples each",
        "6 Merkmale · je 6 Stichproben",
      )}
      caption={text(
        "Without scaling, income (€200 k) dominates age (67). Regularized models and distance-based models (kNN, SVM, PCA) require features on comparable scales.",
        "Ohne Skalierung dominiert das Einkommen (€200 k) das Alter (67). Regularisierte und distanzbasierte Modelle wie kNN, SVM und PCA benötigen vergleichbare Skalen.",
      )}
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>{text("Scaler", "Skalierung")}</label>
            <div className="seg" style={{ flexWrap: "wrap" }}>
              {(["raw", "standard", "minmax", "robust"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={scaler === s ? "on" : ""}
                  onClick={() => setScaler(s)}
                >
                  {locale === "de" ? SCALER_LABELS_DE[s] : s}
                </button>
              ))}
            </div>
          </div>
          <p className="prose" style={{ fontSize: 12.5, margin: 0 }}>
            {locale === "de"
              ? SCALER_FORMULA_DE[scaler]
              : SCALER_FORMULA[scaler]}
          </p>
          <div className="galton-note" style={{ marginTop: 10 }}>
            <span className="tag-pill">{text("Rule", "Regel")}</span>
            {locale === "de" ? (
              <>
                Die Skalierung nur an den <strong>Trainingsdaten</strong>{" "}
                anpassen und danach Trainings- und Testdaten transformieren.
                Eine Anpassung am gesamten Datensatz überträgt Teststatistiken
                in das Training.
              </>
            ) : (
              <>
                Fit learned scaling parameters on each <strong>training</strong>{" "}
                partition, then apply them to its held-out partition. Fitting on
                the full dataset leaks held-out statistics into training.
              </>
            )}
          </div>
        </div>
        <div className="plot-wrap">
          <svg viewBox={`0 0 ${W} ${H}`}>
            <line
              x1={PAD_L}
              y1={H - PAD_B}
              x2={W - PAD_R}
              y2={H - PAD_B}
              stroke="#A49D9A"
              strokeWidth="0.8"
            />
            {scaler !== "raw" && scaler !== "minmax" && (
              <line
                x1={PAD_L}
                y1={
                  H -
                  PAD_B -
                  ((0 - globalMin) / (globalMax - globalMin || 1)) *
                    (H - PAD_T - PAD_B)
                }
                x2={W - PAD_R}
                y2={
                  H -
                  PAD_B -
                  ((0 - globalMin) / (globalMax - globalMin || 1)) *
                    (H - PAD_T - PAD_B)
                }
                stroke="#A49D9A"
                strokeDasharray="3 3"
                strokeWidth="0.8"
              />
            )}
            {FEATURES.map((feat, fi) => {
              const transformed = transform(feat.values);
              const gx = PAD_L + fi * groupW;
              return (
                <g key={feat.name}>
                  {transformed.map((v, si) => {
                    const h = barH(v);
                    const bx = gx + (si + 0.5) * barW;
                    const by = H - PAD_B - h;
                    return (
                      <rect
                        key={si}
                        x={bx}
                        y={by}
                        width={barW - 1}
                        height={h}
                        fill={COLORS[si]}
                        opacity="0.75"
                        rx="1"
                      />
                    );
                  })}
                  <text
                    x={gx + groupW / 2}
                    y={H - 6}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="'JetBrains Mono', monospace"
                    fill="#6A6270"
                  >
                    {locale === "de" ? FEATURE_LABELS_DE[feat.name] : feat.name}
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

export default ScalerDemo;
