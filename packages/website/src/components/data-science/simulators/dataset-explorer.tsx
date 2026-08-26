"use client";

import { useState } from "react";
import { useDataScienceLocale } from "@/components/data-science/locale-context";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp } from "@/lib/data-science/sim-kit";

type StrategyKey = "none" | "smote" | "undersample";

interface Strategy {
  readonly label: string;
  readonly legit: number;
  readonly fraud: number;
}

export function DatasetExplorer() {
  const { text } = useDataScienceLocale();
  const [strategy, setStrategy] = useState<StrategyKey>("none");
  const strategies: Record<StrategyKey, Strategy> = {
    none: {
      label: text("None (raw)", "Keine (Rohdaten)"),
      legit: 284315,
      fraud: 492,
    },
    smote: {
      label: text("SMOTE (oversample)", "SMOTE (Oversampling)"),
      legit: 284315,
      fraud: 284315,
    },
    undersample: { label: "Undersampling", legit: 492, fraud: 492 },
  };
  const s = strategies[strategy];
  const total = s.legit + s.fraud;
  const fraudPct = ((s.fraud / total) * 100).toFixed(2);
  const legitPct = ((s.legit / total) * 100).toFixed(2);
  const W = 380;
  const H = 120;
  const legitW = clamp((s.legit / Math.max(total, 1)) * W, 2, W - 2);
  const fraudW = clamp((s.fraud / Math.max(total, 1)) * W, 2, W);
  const naiveAcc = ((284315 / 284807) * 100).toFixed(2);

  return (
    <Panel
      eyebrow={text("SIMULATOR", "SIMULATOR")}
      title={text(
        "Dataset explorer, class imbalance",
        "Datensatz-Explorer: Klassenungleichgewicht",
      )}
      meta={`${text("Strategy", "Strategie")}: ${s.label}`}
      caption={text(
        "The fixed public-dataset counts make a constant legitimate prediction 99.83% accurate while detecting none of the 492 recorded fraud cases. Accuracy alone therefore omits the error of interest; resampling effects still require train-only, model-specific validation.",
        "Bei den festen Zahlen des öffentlichen Datensatzes erreicht eine konstante legitime Vorhersage 99.83% Genauigkeit und erkennt keinen der 492 erfassten Betrugsfälle. Genauigkeit allein lässt damit den relevanten Fehler aus; Resampling muss weiterhin nur im Training und modellspezifisch validiert werden.",
      )}
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div
            className="sim-ctrl"
            role="group"
            aria-label={text("Sampling strategy", "Sampling-Strategie")}
          >
            <label>{text("Sampling strategy", "Sampling-Strategie")}</label>
            {(Object.entries(strategies) as [StrategyKey, Strategy][]).map(
              ([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStrategy(k)}
                  aria-pressed={strategy === k}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    minHeight: 44,
                    marginBottom: 6,
                    borderRadius: 6,
                    background: strategy === k ? "var(--bg-hi)" : "transparent",
                    border:
                      strategy === k
                        ? "1px solid var(--hair-2)"
                        : "1px solid var(--hair)",
                    color: strategy === k ? "var(--lime-ink)" : "var(--ink-3)",
                    font: "inherit",
                    fontSize: 12.5,
                    cursor: "pointer",
                  }}
                >
                  {v.label}
                </button>
              ),
            )}
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 8,
              background: "rgba(209,255,58,0.07)",
              border: "1px solid rgba(209,255,58,0.15)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--lime-ink)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {text("Naive model", "Naives Modell")}
            </div>
            <div
              style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}
            >
              {text("Predict all-legit", "Alles als legitim vorhersagen")} →{" "}
              <strong style={{ color: "var(--ink-1)" }}>
                {naiveAcc}% {text("accuracy", "Genauigkeit")}
              </strong>
              <br />
              {text("Catches", "Erkennt")}{" "}
              <strong style={{ color: "var(--coral-ink)" }}>
                {text("0 of 492 frauds", "0 von 492 Betrugsfällen")}
              </strong>
            </div>
          </div>
        </div>
        <div className="plot-wrap" style={{ flex: 1 }}>
          <svg viewBox={`0 0 ${W} ${H + 60}`} style={{ width: "100%" }}>
            <text
              x="0"
              y="18"
              fill="var(--ink-3)"
              fontSize="10"
              fontFamily="'JetBrains Mono',monospace"
            >
              {text("Legitimate", "Legitim")}
            </text>
            <rect
              x="0"
              y="24"
              width={legitW}
              height="28"
              rx="4"
              fill="rgba(100,226,181,0.35)"
              stroke="rgba(100,226,181,0.6)"
              strokeWidth="1"
              style={{ transition: "width 0.5s ease" }}
            />
            <text
              x={Math.min(legitW + 4, W - 60)}
              y="43"
              fill="var(--mint)"
              fontSize="10"
              fontFamily="'JetBrains Mono',monospace"
            >
              {legitPct}%
            </text>
            <text
              x="0"
              y="76"
              fill="var(--ink-3)"
              fontSize="10"
              fontFamily="'JetBrains Mono',monospace"
            >
              {text("Fraud", "Betrug")}
            </text>
            <rect
              x="0"
              y="82"
              width={fraudW}
              height="28"
              rx="4"
              fill="rgba(255,107,128,0.35)"
              stroke="rgba(255,107,128,0.6)"
              strokeWidth="1"
              style={{ transition: "width 0.5s ease" }}
            />
            <text
              x={Math.min(fraudW + 4, W - 60)}
              y="101"
              fill="#FF6B80"
              fontSize="10"
              fontFamily="'JetBrains Mono',monospace"
            >
              {fraudPct}%
            </text>
            <text
              x="0"
              y="148"
              fill="var(--ink-4)"
              fontSize="9.5"
              fontFamily="'JetBrains Mono',monospace"
            >
              {text("Legit", "Legitim")}: {s.legit.toLocaleString()}{" "}
              {text("Fraud", "Betrug")}: {s.fraud.toLocaleString()}{" "}
              {text("Total", "Gesamt")}: {total.toLocaleString()}
            </text>
          </svg>
          {strategy === "smote" && (
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 4,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "var(--mint-ink)" }}>SMOTE:</strong>{" "}
              {text(
                "Synthetic Minority Oversampling interpolates new fraud samples between existing ones. Balanced dataset, but adds synthetic data risk.",
                "Synthetic Minority Oversampling interpoliert neue Betrugsbeispiele zwischen vorhandenen Fällen. Das gleicht den Datensatz aus, führt aber Risiken durch synthetische Daten ein.",
              )}
            </div>
          )}
          {strategy === "undersample" && (
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 4,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "var(--lime-ink)" }}>
                Undersampling:
              </strong>{" "}
              {text(
                "Drops majority class to match minority. Fast and clean, but discards 99.8% of your legitimate transaction data.",
                "Reduziert die Mehrheitsklasse auf die Größe der Minderheitsklasse. Schnell und einfach, verwirft aber 99.8% der legitimen Transaktionsdaten.",
              )}
            </div>
          )}
          {strategy === "none" && (
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 4,
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "var(--ink-2)" }}>
                {text("Raw data", "Rohdaten")}:
              </strong>{" "}
              0.17%{" "}
              {text(
                "fraud rate. Report precision-recall behavior alongside the base rate, then compare weighting, resampling, and threshold policies inside validation.",
                "Betrugsquote. Precision-Recall-Verhalten zusammen mit der Basisrate berichten; Gewichtung, Resampling und Schwellenwerte innerhalb der Validierung vergleichen.",
              )}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default DatasetExplorer;
