"use client";

import { useState } from "react";
import { useDataScienceLocale } from "@/components/data-science/locale-context";
import { Panel } from "@/components/data-science/shared/primitives";
import { inkOf } from "@/lib/data-science/sim-kit";

interface SkewStep {
  readonly label: string;
  readonly color: string;
  readonly train: string;
  readonly serve: string;
  readonly note: string;
}

const SKEW_STEPS: readonly SkewStep[] = [
  {
    label: "Raw SQL query",
    color: "#FF9F6B",
    train: "SELECT AVG(spend_7d) FROM events WHERE ts > NOW() - 7d",
    serve: "SELECT spend FROM user_profile WHERE user_id = ?",
    note: "Training uses a 7-day rolling mean; serving reads a stale daily snapshot.",
  },
  {
    label: "Normalisation",
    color: "#FF9F6B",
    train: "StandardScaler fitted on 2023 data",
    serve: "Manual min-max with hardcoded values from 2021",
    note: "Different scaling → feature values live in different numerical ranges.",
  },
  {
    label: "Missing imputation",
    color: "#FF9F6B",
    train: "median impute (per-cohort)",
    serve: "fill with global 0",
    note: "Model learned cohort medians; serving fills zeros → systematic bias.",
  },
];

const SKEW_STEPS_DE: readonly SkewStep[] = [
  {
    label: "Rohe SQL-Abfrage",
    color: "#FF9F6B",
    train: "SELECT AVG(spend_7d) FROM events WHERE ts > NOW() - 7d",
    serve: "SELECT spend FROM user_profile WHERE user_id = ?",
    note: "Das Training verwendet einen rollierenden 7-Tage-Mittelwert; die Bereitstellung liest einen veralteten täglichen Snapshot.",
  },
  {
    label: "Normalisierung",
    color: "#FF9F6B",
    train: "StandardScaler fitted on 2023 data",
    serve: "Manual min-max with hardcoded values from 2021",
    note: "Unterschiedliche Skalierung führt zu Merkmalswerten in verschiedenen numerischen Bereichen.",
  },
  {
    label: "Imputation fehlender Werte",
    color: "#FF9F6B",
    train: "median impute (per-cohort)",
    serve: "fill with global 0",
    note: "Das Modell hat Kohortenmediane gelernt; die Bereitstellung setzt Nullen ein und erzeugt systematische Verzerrungen.",
  },
];

export function FeatureStoreDiagram() {
  const { locale, text } = useDataScienceLocale();
  const skewSteps = locale === "de" ? SKEW_STEPS_DE : SKEW_STEPS;
  const [fsOn, setFsOn] = useState(false);
  const skewScore = fsOn ? 0.04 : 0.61;
  const skewColor = fsOn ? "#64E2B5" : "#FF6B80";

  return (
    <Panel
      eyebrow={text("DIAGRAM", "DIAGRAMM")}
      title={text(
        "Feature store & training-serving skew",
        "Feature Store und Training-Serving-Skew",
      )}
      caption={text(
        "The toggle swaps two hard-coded teaching scenarios; it does not run a feature store or measure skew. Shared definitions can reduce duplicated logic, but parity still depends on versions, data freshness, point-in-time joins, and online/offline tests.",
        "Der Schalter wechselt zwischen zwei fest programmierten Lehrszenarien; er führt keinen Feature Store aus und misst keinen Skew. Gemeinsame Definitionen können doppelte Logik reduzieren, doch Parität hängt weiterhin von Versionen, Datenfrische, zeitpunktkorrekten Joins und Online-/Offline-Tests ab.",
      )}
    >
      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div style={{ flex: "0 0 200px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
              Feature Store
            </span>
            <button
              type="button"
              className="btn"
              style={{
                background: fsOn ? "#64E2B5" : "transparent",
                color: fsOn ? "#0D0D0C" : "var(--coral-ink)",
                borderColor: fsOn ? "#64E2B5" : "#FF6B80",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                padding: "4px 10px",
              }}
              onClick={() => setFsOn((f) => !f)}
            >
              {fsOn ? "ON" : "OFF"}
            </button>
          </div>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: "rgba(244,242,236,0.04)",
              border: `1px solid ${skewColor}44`,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink-3)",
                marginBottom: 6,
              }}
            >
              {text(
                "Illustrative skew indicator",
                "Illustrativer Skew-Indikator",
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 28,
                fontWeight: 700,
                color: inkOf(skewColor),
                transition: "color 0.3s",
              }}
            >
              {skewScore.toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 4 }}>
              {fsOn
                ? text(
                    "Shared definition in this diagram.",
                    "Gemeinsame Definition in diesem Diagramm.",
                  )
                : text(
                    "Feature pipelines diverged.",
                    "Die Feature-Pipelines weichen voneinander ab.",
                  )}
            </div>
          </div>
          {!fsOn && (
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                lineHeight: 1.55,
              }}
            >
              {text(
                "Separate training and serving implementations can diverge. Detect the mismatch with contract tests and representative online/offline comparisons.",
                "Getrennte Implementierungen für Training und Serving können auseinanderlaufen. Vertragsprüfungen und repräsentative Online-/Offline-Vergleiche machen Abweichungen sichtbar.",
              )}
            </div>
          )}
          {fsOn && (
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                lineHeight: 1.55,
              }}
            >
              {text(
                "A shared feature layer reduces one source of duplication. It does not guarantee matching event time, freshness, backfills, dependencies, or transformation versions.",
                "Eine gemeinsame Feature-Schicht reduziert eine Quelle doppelter Logik. Sie garantiert keine übereinstimmende Ereigniszeit, Frische, Backfills, Abhängigkeiten oder Transformationsversionen.",
              )}
            </div>
          )}
        </div>
        <div style={{ flex: "1 1 280px" }}>
          <svg viewBox="0 0 440 180" style={{ width: "100%" }}>
            <text
              x="10"
              y="16"
              fill="#8A8680"
              fontSize="9"
              fontFamily="'JetBrains Mono',monospace"
              letterSpacing="0.08em"
              style={{ textTransform: "uppercase" }}
            >
              {text("TRAINING PIPELINE", "TRAINING-PIPELINE")}
            </text>
            <rect
              x="10"
              y="22"
              width="90"
              height="30"
              rx="5"
              fill="rgba(244,242,236,0.06)"
              stroke="rgba(244,242,236,0.2)"
            />
            <text
              x="55"
              y="42"
              textAnchor="middle"
              fill="var(--ink-2)"
              fontSize="9.5"
              fontFamily="'JetBrains Mono',monospace"
            >
              {text("Raw Data", "Rohdaten")}
            </text>
            <line
              x1="100"
              y1="37"
              x2="130"
              y2="37"
              stroke="rgba(244,242,236,0.2)"
              strokeWidth="1.5"
              markerEnd="url(#arr)"
            />
            <rect
              x="130"
              y="22"
              width="90"
              height="30"
              rx="5"
              fill={fsOn ? "rgba(100,226,181,0.12)" : "rgba(255,159,107,0.12)"}
              stroke={fsOn ? "#64E2B5" : "#FF9F6B"}
            />
            <text
              x="175"
              y="42"
              textAnchor="middle"
              fill={fsOn ? "#64E2B5" : "#FF9F6B"}
              fontSize="9.5"
              fontFamily="'JetBrains Mono',monospace"
            >
              {fsOn ? "Feature Store" : text("Transform A", "Transformation A")}
            </text>
            <line
              x1="220"
              y1="37"
              x2="250"
              y2="37"
              stroke="rgba(244,242,236,0.2)"
              strokeWidth="1.5"
              markerEnd="url(#arr)"
            />
            <rect
              x="250"
              y="22"
              width="80"
              height="30"
              rx="5"
              fill="rgba(244,242,236,0.06)"
              stroke="rgba(244,242,236,0.2)"
            />
            <text
              x="290"
              y="42"
              textAnchor="middle"
              fill="var(--ink-2)"
              fontSize="9.5"
              fontFamily="'JetBrains Mono',monospace"
            >
              {text("Model Train", "Modelltraining")}
            </text>
            <text
              x="10"
              y="90"
              fill="#8A8680"
              fontSize="9"
              fontFamily="'JetBrains Mono',monospace"
              letterSpacing="0.08em"
            >
              {text("SERVING PIPELINE", "BEREITSTELLUNGS-PIPELINE")}
            </text>
            <rect
              x="10"
              y="96"
              width="90"
              height="30"
              rx="5"
              fill="rgba(244,242,236,0.06)"
              stroke="rgba(244,242,236,0.2)"
            />
            <text
              x="55"
              y="116"
              textAnchor="middle"
              fill="var(--ink-2)"
              fontSize="9.5"
              fontFamily="'JetBrains Mono',monospace"
            >
              {text("Live Request", "Live-Anfrage")}
            </text>
            <line
              x1="100"
              y1="111"
              x2="130"
              y2="111"
              stroke="rgba(244,242,236,0.2)"
              strokeWidth="1.5"
              markerEnd="url(#arr)"
            />
            <rect
              x="130"
              y="96"
              width="90"
              height="30"
              rx="5"
              fill={fsOn ? "rgba(100,226,181,0.12)" : "rgba(255,107,128,0.12)"}
              stroke={fsOn ? "#64E2B5" : "#FF6B80"}
            />
            <text
              x="175"
              y="116"
              textAnchor="middle"
              fill={fsOn ? "#64E2B5" : "#FF6B80"}
              fontSize="9.5"
              fontFamily="'JetBrains Mono',monospace"
            >
              {fsOn ? "Feature Store" : text("Transform B", "Transformation B")}
            </text>
            <line
              x1="220"
              y1="111"
              x2="250"
              y2="111"
              stroke="rgba(244,242,236,0.2)"
              strokeWidth="1.5"
              markerEnd="url(#arr)"
            />
            <rect
              x="250"
              y="96"
              width="80"
              height="30"
              rx="5"
              fill="rgba(244,242,236,0.06)"
              stroke="rgba(244,242,236,0.2)"
            />
            <text
              x="290"
              y="116"
              textAnchor="middle"
              fill="var(--ink-2)"
              fontSize="9.5"
              fontFamily="'JetBrains Mono',monospace"
            >
              {text("Prediction", "Vorhersage")}
            </text>
            {!fsOn && (
              <>
                <line
                  x1="175"
                  y1="52"
                  x2="175"
                  y2="96"
                  stroke="#FF6B80"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.6"
                />
                <text
                  x="180"
                  y="80"
                  fill="#FF6B80"
                  fontSize="8.5"
                  fontFamily="'JetBrains Mono',monospace"
                >
                  SKEW
                </text>
              </>
            )}
            {fsOn && (
              <>
                <line
                  x1="175"
                  y1="52"
                  x2="175"
                  y2="96"
                  stroke="#64E2B5"
                  strokeWidth="2"
                  opacity="0.7"
                />
                <text
                  x="180"
                  y="80"
                  fill="#64E2B5"
                  fontSize="8.5"
                  fontFamily="'JetBrains Mono',monospace"
                >
                  {text("SHARED", "GEMEINSAM")}
                </text>
              </>
            )}
            {!fsOn &&
              skewSteps.slice(0, 2).map((s, i) => (
                <g key={i}>
                  <circle cx="12" cy={148 + i * 14} r="3" fill={s.color} />
                  <text
                    x="20"
                    y={151 + i * 14}
                    fill="var(--ink-3)"
                    fontSize="9"
                    fontFamily="'JetBrains Mono',monospace"
                  >
                    {s.label}: {s.train.slice(0, 28)}…
                  </text>
                </g>
              ))}
          </svg>
        </div>
      </div>
      {!fsOn && (
        <div
          style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          {skewSteps.map((s, i) => (
            <div
              key={i}
              style={{
                flex: "1 1 160px",
                padding: "9px 12px",
                borderRadius: 7,
                background: "rgba(255,107,128,0.06)",
                border: "1px solid rgba(255,107,128,0.2)",
                fontSize: 12,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--orange-ink)",
                  marginBottom: 5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
              <div style={{ color: "var(--ink-3)", lineHeight: 1.45 }}>
                {s.note}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default FeatureStoreDiagram;
