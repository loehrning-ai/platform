"use client";

import { useCallback, useRef, useState } from "react";
import { useDataScienceLocale } from "@/components/data-science/locale-context";
import { Panel } from "@/components/data-science/shared/primitives";

interface PipelineStep {
  readonly label: string;
  readonly icon: string;
  readonly log: readonly string[];
}

const PIPELINE_STEPS: readonly PipelineStep[] = [
  {
    label: "Load & Inspect",
    icon: "📦",
    log: [
      "> Loading creditcard.csv …",
      "> Rows: 284,807  Columns: 31",
      "> Features: Time, V1-V28 (PCA), Amount, Class",
      "> Fraud transactions: 492 (0.172%)",
      "> No missing values detected.",
      "✓ Dataset loaded.",
    ],
  },
  {
    label: "Feature Engineering",
    icon: "🔧",
    log: [
      "> V1-V28: PCA-transformed (already anonymised)",
      "> Amount: raw transaction value in EUR",
      "> Time: seconds elapsed since first transaction",
      "> Adding: log1p(Amount) to reduce skew",
      "> Adding: hour_of_day from Time feature",
      "✓ Feature matrix shape: (284807, 33)",
    ],
  },
  {
    label: "Scale Amount & Time",
    icon: "⚖️",
    log: [
      "> StandardScaler on Amount and Time (not V1-V28)",
      "> Amount mean: 88.35 → scaled: 0.00",
      "> Amount std:  250.12",
      "> Time mean:   94813 → scaled: 0.00",
      "> Scaler fitted on train split only (no leakage)",
      "✓ Scaling complete.",
    ],
  },
  {
    label: "Train/Test Split",
    icon: "✂️",
    log: [
      "> Stratified split: 80% train / 20% test",
      "> Train: 227,845 rows  (fraud: 394)",
      "> Test:   56,962 rows  (fraud:  98)",
      "> Fraud rate train: 0.173%  test: 0.172%",
      "> Stratification preserved class ratio ✓",
      "✓ Split complete.",
    ],
  },
  {
    label: "Fit XGBoost",
    icon: "🌲",
    log: [
      "> XGBClassifier(n_estimators=300, max_depth=6,",
      '    scale_pos_weight=578, eval_metric="aucpr")',
      "> Training …",
      "> [100]  train-aucpr: 0.8812",
      "> [200]  train-aucpr: 0.9143",
      "> [300]  train-aucpr: 0.9271",
      "✓ Model fitted in 18.4s",
    ],
  },
  {
    label: "Evaluate",
    icon: "📊",
    log: [
      "> Threshold: 0.30",
      "> Precision:  0.871",
      "> Recall:     0.918",
      "> F1:         0.894",
      "> PR-AUC:     0.934",
      "> ROC-AUC:    0.981",
      "✓ Model ready for threshold tuning.",
    ],
  },
];

const PIPELINE_STEPS_DE: readonly PipelineStep[] = [
  {
    label: "Laden und prüfen",
    icon: "📦",
    log: [
      "> creditcard.csv wird geladen …",
      "> Zeilen: 284,807  Spalten: 31",
      "> Merkmale: Time, V1-V28 (PCA), Amount, Class",
      "> Betrugstransaktionen: 492 (0.172%)",
      "> Keine fehlenden Werte erkannt.",
      "✓ Datensatz geladen.",
    ],
  },
  {
    label: "Feature Engineering",
    icon: "🔧",
    log: [
      "> V1-V28: PCA-transformiert (bereits anonymisiert)",
      "> Amount: roher Transaktionswert in EUR",
      "> Time: Sekunden seit der ersten Transaktion",
      "> Ergänzung: log1p(Amount), um Schiefe zu reduzieren",
      "> Ergänzung: hour_of_day aus dem Merkmal Time",
      "✓ Form der Merkmalsmatrix: (284807, 33)",
    ],
  },
  {
    label: "Amount und Time skalieren",
    icon: "⚖️",
    log: [
      "> StandardScaler für Amount und Time (nicht V1-V28)",
      "> Mittelwert Amount: 88.35 → skaliert: 0.00",
      "> Standardabweichung Amount:  250.12",
      "> Mittelwert Time:   94813 → skaliert: 0.00",
      "> Scaler nur am Trainingssplit angepasst (kein Leakage)",
      "✓ Skalierung abgeschlossen.",
    ],
  },
  {
    label: "Train/Test-Split",
    icon: "✂️",
    log: [
      "> Stratifizierter Split: 80% Training / 20% Test",
      "> Training: 227,845 Zeilen  (Betrug: 394)",
      "> Test:      56,962 Zeilen  (Betrug:  98)",
      "> Betrugsquote Training: 0.173%  Test: 0.172%",
      "> Stratifizierung erhält das Klassenverhältnis ✓",
      "✓ Split abgeschlossen.",
    ],
  },
  {
    label: "XGBoost anpassen",
    icon: "🌲",
    log: [
      "> XGBClassifier(n_estimators=300, max_depth=6,",
      '    scale_pos_weight=578, eval_metric="aucpr")',
      "> Training …",
      "> [100]  train-aucpr: 0.8812",
      "> [200]  train-aucpr: 0.9143",
      "> [300]  train-aucpr: 0.9271",
      "✓ Modell in 18.4s angepasst",
    ],
  },
  {
    label: "Auswerten",
    icon: "📊",
    log: [
      "> Schwellenwert: 0.30",
      "> Präzision:     0.871",
      "> Recall:        0.918",
      "> F1:            0.894",
      "> PR-AUC:        0.934",
      "> ROC-AUC:       0.981",
      "✓ Modell bereit für die Abstimmung des Schwellenwerts.",
    ],
  },
];

export function PipelineProgress() {
  const { locale, text } = useDataScienceLocale();
  const steps = locale === "de" ? PIPELINE_STEPS_DE : PIPELINE_STEPS;
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<ReadonlySet<number>>(
    new Set(),
  );
  const [logLines, setLogLines] = useState<readonly string[]>([]);
  const [running, setRunning] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  const runStep = useCallback(() => {
    if (running) return;
    const step = steps[currentStep]!;
    setRunning(true);
    setLogLines([]);
    let i = 0;
    const interval = setInterval(() => {
      if (i < step.log.length) {
        const line = step.log[i]!;
        setLogLines((prev) => [...prev, line]);
        i++;
        if (logRef.current)
          logRef.current.scrollTop = logRef.current.scrollHeight;
      } else {
        clearInterval(interval);
        setCompletedSteps((prev) => new Set([...prev, currentStep]));
        setRunning(false);
        if (currentStep < steps.length - 1) setCurrentStep((c) => c + 1);
      }
    }, 200);
  }, [currentStep, running, steps]);

  const reset = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setLogLines([]);
    setRunning(false);
  };

  return (
    <Panel
      eyebrow={text("SIMULATOR", "SIMULATOR")}
      title={text(
        "ML pipeline, step-by-step",
        "ML-Pipeline, Schritt für Schritt",
      )}
      meta={`${text("Step", "Schritt")} ${currentStep + 1} / ${steps.length}`}
      caption={text(
        "Each step is a real decision point. Run them in order, the output of each step feeds the next.",
        "Jeder Schritt enthält eine konkrete Entscheidung. Die Schritte nacheinander ausführen; jede Ausgabe fließt in den nächsten Schritt.",
      )}
    >
      <div className="sim-row">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minWidth: 170,
          }}
        >
          {steps.map((step, i) => {
            const done = completedSteps.has(i);
            const active = i === currentStep;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  background: active ? "var(--bg-hi)" : "transparent",
                  border: active
                    ? "1px solid var(--hair-2)"
                    : "1px solid transparent",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    background: done
                      ? "rgba(100,226,181,0.2)"
                      : active
                        ? "rgba(209,255,58,0.15)"
                        : "rgba(255,255,255,0.05)",
                    border: done
                      ? "1px solid rgba(100,226,181,0.5)"
                      : active
                        ? "1px solid rgba(209,255,58,0.4)"
                        : "1px solid var(--hair)",
                    color: done
                      ? "var(--mint-ink)"
                      : active
                        ? "var(--lime-ink)"
                        : "var(--ink-4)",
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: done
                      ? "var(--mint-ink)"
                      : active
                        ? "var(--ink-1)"
                        : "var(--ink-4)",
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div
            ref={logRef}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              lineHeight: 1.8,
              color: "#D8D3CC",
              background: "#17151C",
              borderRadius: 8,
              border: "1px solid var(--hair)",
              padding: "14px 16px",
              minHeight: 160,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {logLines.length === 0 && (
              <span style={{ color: "#A39E98" }}>
                //{" "}
                {text(
                  'Click "Run step" to execute',
                  'Zum Ausführen auf "Schritt ausführen" klicken',
                )}
                : {steps[currentStep]!.label}
              </span>
            )}
            {logLines.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.startsWith("✓")
                    ? "#64E2B5"
                    : line.startsWith(">")
                      ? "#D8D3CC"
                      : "#9FE06B",
                }}
              >
                {line}
              </div>
            ))}
            {running && (
              <span style={{ color: "#9FE06B", animation: "none" }}>▋</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={runStep}
              disabled={running || completedSteps.size === steps.length}
              style={{
                padding: "10px 22px",
                borderRadius: 7,
                cursor: running ? "wait" : "pointer",
                background: running ? "var(--bg-hi)" : "var(--lime)",
                color: "#000",
                border: "none",
                font: "inherit",
                fontSize: 13,
                fontWeight: 700,
                opacity: completedSteps.size === steps.length ? 0.4 : 1,
              }}
            >
              {running
                ? text("Running…", "Wird ausgeführt …")
                : completedSteps.size === steps.length
                  ? text("Done ✓", "Fertig ✓")
                  : `${text("Run step", "Schritt ausführen")} ${currentStep + 1}`}
            </button>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 18px",
                borderRadius: 7,
                cursor: "pointer",
                background: "transparent",
                color: "var(--ink-3)",
                border: "1px solid var(--hair)",
                font: "inherit",
                fontSize: 13,
              }}
            >
              {text("Reset", "Zurücksetzen")}
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default PipelineProgress;
