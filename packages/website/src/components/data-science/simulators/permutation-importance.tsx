"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp, mulberry32, round } from "@/lib/data-science/sim-kit";
import { useDataScienceLocale } from "../locale-context";

// ─── PermutationImportance ──────────────────────────
//
// Typed port of Ch07_Interpret.js's `PermutationImportance`: a
// feature-shuffle importance demo. Seeded with `mulberry32(seed * 31337)`.
// The "Shuffle" button uses a bare `setTimeout` with no cleanup on
// unmount — ported exactly as source does (no `clearTimeout`, no ref to
// the timeout id); React 18 does not warn on a state update after
// unmount, so this has no observable effect.

interface PermFeature {
  readonly key: string;
  readonly label: string;
  readonly trueImportance: number;
}

const PERM_FEATURES: readonly PermFeature[] = [
  { key: "credit_score", label: "Credit score", trueImportance: 0.21 },
  { key: "income", label: "Annual income", trueImportance: 0.14 },
  { key: "debt_ratio", label: "Debt ratio", trueImportance: 0.11 },
  { key: "employment_yrs", label: "Employment yrs", trueImportance: 0.07 },
  { key: "savings", label: "Savings", trueImportance: 0.04 },
];
const PERM_LABELS_DE: Readonly<Record<string, string>> = {
  credit_score: "Kredit-Score",
  income: "Jahreseinkommen",
  debt_ratio: "Schuldenquote",
  employment_yrs: "Beschäftigungsjahre",
  savings: "Ersparnisse",
};

const PERM_BASELINE = 0.847;
const BAR_W = 280;

export function PermutationImportance() {
  const { locale, text } = useDataScienceLocale();
  const [seed, setSeed] = useState(1);
  const [running, setRunning] = useState(false);

  const results = useMemo(() => {
    const rng = mulberry32(seed * 31337);
    return PERM_FEATURES.map((f) => {
      const noise = (rng() - 0.5) * 0.025;
      const drop = clamp(f.trueImportance + noise, 5e-3, 0.35);
      const shuffledAcc = clamp(PERM_BASELINE - drop, 0.45, 0.99);
      return { ...f, drop, shuffledAcc };
    });
  }, [seed]);

  const maxDrop = Math.max(...results.map((r) => r.drop));

  function handleShuffle() {
    setRunning(true);
    setTimeout(() => {
      setSeed((s) => s + 1);
      setRunning(false);
    }, 600);
  }

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text("Permutation importance", "Permutationswichtigkeit")}
      meta={text(
        `baseline accuracy ${PERM_BASELINE.toFixed(3)}`,
        `Ausgangsgenauigkeit ${PERM_BASELINE.toFixed(3)}`,
      )}
      caption={text(
        "This panel does not fit a model or shuffle a dataset. It adds seeded jitter to five fixed accuracy-drop values to illustrate how permutation importance is read. In real data, the result depends on the metric, sample, feature dependence, and repeat scheme.",
        "Dieses Panel passt kein Modell an und permutiert keinen Datensatz. Es ergänzt fünf feste Genauigkeitsrückgänge um initialisiertes Rauschen, um die Lesart der Permutationswichtigkeit zu zeigen. Bei echten Daten hängt das Ergebnis von Metrik, Stichprobe, Merkmalsabhängigkeit und Wiederholung ab.",
      )}
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div className="sim-stats">
            <div>
              <div className="k">
                {text("Baseline acc", "Ausgangsgenauigkeit")}
              </div>
              <div className="v" style={{ color: "var(--good-ink)" }}>
                {PERM_BASELINE.toFixed(3)}
              </div>
            </div>
            <div>
              <div className="k">
                {text("Top feature", "Wichtigstes Merkmal")}
              </div>
              <div
                className="v"
                style={{ color: "var(--warn-ink)", fontSize: 12 }}
              >
                {locale === "de"
                  ? PERM_LABELS_DE[
                      results.reduce((a, b) => (a.drop > b.drop ? a : b)).key
                    ]
                  : results.reduce((a, b) => (a.drop > b.drop ? a : b)).label}
              </div>
            </div>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${running ? "btn-primary" : ""}`}
            style={{ marginTop: 16 }}
            onClick={handleShuffle}
            disabled={running}
          >
            {running
              ? text("↻ Shuffling…", "↻ Permutation läuft…")
              : text("⎘ Shuffle features", "⎘ Merkmale permutieren")}
          </button>
          <p
            className="prose"
            style={{ fontSize: 12, marginTop: 10, lineHeight: 1.5 }}
          >
            {text(
              "The ranking is stable here because the fixed gaps exceed the seeded jitter. That construction is not evidence that an empirical ranking would be stable.",
              "Die Rangfolge bleibt hier stabil, weil die festen Abstände größer als das initialisierte Rauschen sind. Diese Konstruktion belegt keine stabile Rangfolge in empirischen Daten.",
            )}
          </p>
        </div>
        <div className="plot-wrap" style={{ flex: 1 }}>
          <div className="sim-plot-head">
            {text("Accuracy after shuffle", "Genauigkeit nach Permutation")}
            <span className="hint">
              {text(
                "red = post-shuffle · line = baseline",
                "rot = nach Permutation · Linie = Ausgangswert",
              )}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${BAR_W + 80} ${results.length * 46 + 30}`}
            style={{ width: "100%" }}
          >
            {results.map((f, i) => {
              const barFull = (f.shuffledAcc / PERM_BASELINE) * BAR_W;
              const baseBarFull = BAR_W;
              const y = 16 + i * 46;
              const isTop = f.drop === maxDrop;
              return (
                <g key={f.key}>
                  <text
                    x={0}
                    y={y + 12}
                    fontSize="10"
                    fill={isTop ? "#E8A031" : "#C7C4BC"}
                    fontFamily="'JetBrains Mono',monospace"
                    fontWeight={isTop ? "700" : "400"}
                  >
                    {locale === "de" ? PERM_LABELS_DE[f.key] : f.label}
                  </text>
                  <rect
                    x={0}
                    y={y + 17}
                    width={baseBarFull}
                    height={10}
                    fill="rgba(164,157,154,0.15)"
                    rx="2"
                  />
                  <rect
                    x={0}
                    y={y + 17}
                    width={Math.max(barFull, 2)}
                    height={10}
                    fill={isTop ? "#E8A031" : "#D83A3A"}
                    rx="2"
                    opacity="0.85"
                    style={{ transition: "width 400ms ease" }}
                  />
                  <line
                    x1={baseBarFull}
                    y1={y + 14}
                    x2={baseBarFull}
                    y2={y + 30}
                    stroke="rgba(244,242,236,0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                  />
                  <text
                    x={baseBarFull + 4}
                    y={y + 26}
                    fontSize="10"
                    fill={isTop ? "#E8A031" : "#D83A3A"}
                    fontFamily="'JetBrains Mono',monospace"
                  >
                    −{round(f.drop, 3)}
                  </text>
                </g>
              );
            })}
            <line
              x1={0}
              y1={results.length * 46 + 10}
              x2={BAR_W}
              y2={results.length * 46 + 10}
              stroke="#A49D9A"
              strokeWidth="0.6"
            />
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default PermutationImportance;
