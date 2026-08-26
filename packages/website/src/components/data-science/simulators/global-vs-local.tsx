"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, mulberry32, round } from "@/lib/data-science/sim-kit";
import { useDataScienceLocale } from "../locale-context";

// ─── GlobalVsLocal ──────────────────────────────────
//
// Typed port of Ch07_Interpret.js's `GlobalVsLocal`: click-a-point
// global-vs-local SHAP comparison. Seeded with `mulberry32(999)`.

const GVL_FEATURES = [
  "credit_score",
  "income",
  "debt_ratio",
  "employment_yrs",
] as const;
const GVL_LABELS_DE: Readonly<Record<(typeof GVL_FEATURES)[number], string>> = {
  credit_score: "Kredit-Score",
  income: "Einkommen",
  debt_ratio: "Schuldenquote",
  employment_yrs: "Beschäftigungsjahre",
};
const GVL_WEIGHTS = [0.38, 0.26, -0.22, 0.14] as const;

interface DataPoint {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly score: number;
  readonly featureVals: readonly number[];
}

const SW = 260;
const SH = 260;
const BAR_MAX = 120;

export function GlobalVsLocal() {
  const { locale, text } = useDataScienceLocale();
  const [selected, setSelected] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);

  const points = useMemo<readonly DataPoint[]>(() => {
    const rng = mulberry32(999);
    return Array.from({ length: 20 }, (_, i) => {
      const x = 0.08 + rng() * 0.84;
      const y = 0.08 + rng() * 0.84;
      const featureVals = GVL_FEATURES.map(() => rng() * 2 - 1);
      const score = clamp(
        0.5 + featureVals.reduce((s, v, j) => s + v * GVL_WEIGHTS[j], 0),
        0.05,
        0.95,
      );
      return { id: i, x, y, score, featureVals };
    });
  }, []);

  const globalImportance = GVL_WEIGHTS.map((w, j) => ({
    label: GVL_FEATURES[j],
    importance: Math.abs(w),
  }));

  const localShap = useMemo(() => {
    if (selected === null) return null;
    const pt = points[selected];
    if (!pt) return null;
    return GVL_FEATURES.map((label, j) => ({
      label,
      contrib: pt.featureVals[j]! * GVL_WEIGHTS[j],
    }));
  }, [selected, points]);

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text(
        "Global vs local explanations",
        "Globale und lokale Erklärungen",
      )}
      meta={
        selected !== null && points[selected]
          ? text(
              `point #${selected} selected · score ${round(points[selected].score, 3)}`,
              `Punkt #${selected} ausgewählt · Score ${round(points[selected].score, 3)}`,
            )
          : text(
              "20 data points · click one",
              "20 Datenpunkte · einen auswählen",
            )
      }
      caption={text(
        "This fixed linear construction compares absolute coefficients with per-point coefficient × value contributions. It does not compute global importance or SHAP from a fitted model. Click a dot to inspect the constructed local contribution.",
        "Diese feste lineare Konstruktion vergleicht absolute Koeffizienten mit punktweisen Beiträgen aus Koeffizient × Wert. Sie berechnet weder globale Wichtigkeit noch SHAP aus einem angepassten Modell. Wähle einen Punkt, um den konstruierten lokalen Beitrag zu prüfen.",
      )}
    >
      <div className="sim-row">
        <div
          className="plot-wrap ds-global-local-plot"
          style={{ width: "100%", maxWidth: SW + 20 }}
        >
          <div className="sim-plot-head">
            {text("Data points", "Datenpunkte")}{" "}
            <span className="hint">
              {text("click any dot", "einen Punkt auswählen")}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${SW} ${SH}`}
            style={{ width: "100%", cursor: "pointer" }}
          >
            <rect
              x={0}
              y={0}
              width={SW}
              height={SH}
              fill="rgba(20,18,22,0.3)"
              rx="4"
            />
            {points.map((pt) => {
              const cx = pt.x * SW;
              const cy = (1 - pt.y) * SH;
              const isSel = selected === pt.id;
              const isFocused = focused === pt.id;
              const color = pt.score >= 0.5 ? "#1FAF7E" : "#D83A3A";
              return (
                <g
                  key={pt.id}
                  className="gvl-point"
                  role="button"
                  tabIndex={0}
                  aria-label={text(
                    `Select data point ${pt.id}, score ${round(pt.score, 3)}`,
                    `Datenpunkt ${pt.id} auswählen, Score ${round(pt.score, 3)}`,
                  )}
                  aria-pressed={isSel}
                  onClick={() => setSelected(pt.id)}
                  onFocus={() => setFocused(pt.id)}
                  onBlur={() => setFocused(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(pt.id);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {isFocused && !isSel && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="11"
                      fill="none"
                      stroke="#5B3EE8"
                      strokeWidth="2"
                    />
                  )}
                  {isSel && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="13"
                      fill="none"
                      stroke="#E8A031"
                      strokeWidth="2"
                      opacity="0.7"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSel ? 7 : 5}
                    fill={color}
                    stroke={isSel ? "#FBF8F1" : "none"}
                    strokeWidth="1.5"
                    opacity="0.9"
                  />
                  {isSel && (
                    <text
                      x={cx + 10}
                      y={cy + 4}
                      fontSize="10"
                      fill="#E8A031"
                      fontFamily="'JetBrains Mono',monospace"
                    >
                      #{pt.id}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minWidth: 0,
          }}
        >
          <div className="plot-wrap">
            <div className="sim-plot-head">
              {text("Global importance", "Globale Wichtigkeit")}{" "}
              <span className="hint">
                {text("fixed absolute weights", "feste Absolutgewichte")}
              </span>
            </div>
            <svg
              viewBox={`0 0 ${BAR_MAX + 100} ${GVL_FEATURES.length * 28 + 8}`}
              style={{ width: "100%" }}
            >
              {globalImportance.map((f, i) => (
                <g key={f.label}>
                  <text
                    x={0}
                    y={i * 28 + 15}
                    fontSize="10"
                    fill="#C7C4BC"
                    fontFamily="'JetBrains Mono',monospace"
                  >
                    {locale === "de" ? GVL_LABELS_DE[f.label] : f.label}
                  </text>
                  <rect
                    x={0}
                    y={i * 28 + 19}
                    width={f.importance * BAR_MAX}
                    height={9}
                    fill="#5B3EE8"
                    rx="2"
                    opacity="0.8"
                  />
                  <text
                    x={f.importance * BAR_MAX + 4}
                    y={i * 28 + 27}
                    fontSize="9"
                    fill="#5B3EE8"
                    fontFamily="'JetBrains Mono',monospace"
                  >
                    {round(f.importance, 3)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="plot-wrap">
            <div className="sim-plot-head">
              {text("Local SHAP", "Lokales SHAP")}{" "}
              <span className="hint">
                {selected === null
                  ? text("click a point above", "oben einen Punkt auswählen")
                  : text(`point #${selected}`, `Punkt #${selected}`)}
              </span>
            </div>
            {localShap === null ? (
              <p
                className="prose"
                style={{ fontSize: 12, padding: "8px 0", opacity: 0.5 }}
              >
                {text(
                  "Select a data point to see its local explanation.",
                  "Wähle einen Datenpunkt, um seine lokale Erklärung zu sehen.",
                )}
              </p>
            ) : (
              <svg
                viewBox={`0 0 ${BAR_MAX * 2 + 100} ${GVL_FEATURES.length * 28 + 8}`}
                style={{ width: "100%" }}
              >
                <line
                  x1={BAR_MAX}
                  y1={0}
                  x2={BAR_MAX}
                  y2={GVL_FEATURES.length * 28 + 8}
                  stroke="rgba(164,157,154,0.3)"
                  strokeWidth="1"
                />
                {localShap.map((f, i) => {
                  const pos = f.contrib >= 0;
                  const barW = Math.abs(f.contrib) * BAR_MAX * 1.8;
                  const barX = pos ? BAR_MAX : BAR_MAX - barW;
                  const color = pos ? "#1FAF7E" : "#D83A3A";
                  return (
                    <g key={f.label}>
                      <text
                        x={0}
                        y={i * 28 + 15}
                        fontSize="10"
                        fill="#C7C4BC"
                        fontFamily="'JetBrains Mono',monospace"
                      >
                        {locale === "de" ? GVL_LABELS_DE[f.label] : f.label}
                      </text>
                      <rect
                        x={barX}
                        y={i * 28 + 19}
                        width={Math.max(barW, 2)}
                        height={9}
                        fill={color}
                        rx="2"
                        opacity="0.85"
                        style={{
                          transition:
                            "x 300ms ease, width 300ms ease, fill 300ms ease",
                        }}
                      />
                      <text
                        x={pos ? BAR_MAX + barW + 4 : BAR_MAX - barW - 4}
                        y={i * 28 + 27}
                        textAnchor={pos ? "start" : "end"}
                        fontSize="9"
                        fill={color}
                        fontFamily="'JetBrains Mono',monospace"
                      >
                        {f.contrib >= 0 ? "+" : ""}
                        {round(f.contrib, 3)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default GlobalVsLocal;
