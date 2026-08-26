"use client";

import { useCallback, useState } from "react";
import { useDataScienceLocale } from "@/components/data-science/locale-context";
import { Panel } from "@/components/data-science/shared/primitives";
import {
  clamp,
  mulberry32,
  normInv,
  randn,
  round,
} from "@/lib/data-science/sim-kit";

// ─── PeekingSimulator ──────────────────────────────
//
// Typed port of Ch10_Peeking.js's `PeekingSimulator`: false-positive-
// inflation Monte Carlo demo. Seeded with `mulberry32(seed)`, seed
// starting at 42 and incrementing after each run. The "Run" button uses
// source's own bare `setTimeout` with no cleanup on unmount — ported
// exactly as source has it, not a bug to fix.

const BAD = "#C92424";
const MINT = "#0E7250";
const INK3 = "#5C5650";
const HAIR = "rgba(20,18,22,0.10)";
const BGHT = "var(--panel-hi)";

const FREQ_OPTIONS = [
  { label: "Every 100 observations", step: 100 },
  { label: "Every 300 observations", step: 300 },
  { label: "Every 700 observations", step: 700 },
  { label: "End-only (no peeking)", step: 5000 },
] as const;

const FREQ_LABELS_DE = [
  "Alle 100 Beobachtungen",
  "Alle 300 Beobachtungen",
  "Alle 700 Beobachtungen",
  "Nur am Ende (kein Peeking)",
] as const;

const ALPHA_OPTIONS = [0.05, 0.01] as const;
const N_SIMS = 1000;
const MAX_N = 5000;
const BASE_CONV = 0.1;

interface Results {
  readonly fpr: number;
  readonly nomPct: number;
  readonly alpha: number;
  readonly step: number;
  readonly n: number;
  readonly falsePos: number;
}

function Bar({
  label,
  value,
  max,
  color,
  annotation,
}: {
  readonly label: string;
  readonly value: number;
  readonly max: number;
  readonly color: string;
  readonly annotation?: string;
}) {
  const pct = max > 0 ? clamp(value / max, 0, 1) * 100 : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          marginBottom: 3,
          color: "var(--ink-2)",
        }}
      >
        <span>{label}</span>
        <span style={{ color, fontWeight: 600 }}>
          {annotation || `${round(value, 1)}%`}
        </span>
      </div>
      <div
        style={{
          height: 10,
          background: HAIR,
          borderRadius: 5,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 5,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

export function PeekingSimulator() {
  const { locale, text } = useDataScienceLocale();
  const [freqIdx, setFreqIdx] = useState(0);
  const [alphaIdx, setAlphaIdx] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [running, setRunning] = useState(false);
  const [seed, setSeed] = useState(42);

  const runSim = useCallback(() => {
    setRunning(true);
    setTimeout(() => {
      const step = FREQ_OPTIONS[freqIdx]!.step;
      const alpha = ALPHA_OPTIONS[alphaIdx]!;
      const zCrit = normInv(1 - alpha / 2);
      const rng = mulberry32(seed);
      const obsVar = 2 * BASE_CONV * (1 - BASE_CONV);
      let falsePos = 0;
      for (let s = 0; s < N_SIMS; s++) {
        let hit = false;
        let sumDiff = 0;
        for (let n = step; n <= MAX_N; n += step) {
          sumDiff += randn(rng) * Math.sqrt(step * obsVar);
          const se = Math.sqrt(obsVar / n);
          const z = sumDiff / n / se;
          if (Math.abs(z) > zCrit) {
            hit = true;
            break;
          }
        }
        if (hit) falsePos++;
      }
      const fpr = (falsePos / N_SIMS) * 100;
      const nomPct = alpha * 100;
      setResults({ fpr, nomPct, alpha, step, n: N_SIMS, falsePos });
      setSeed((s) => s + 1);
      setRunning(false);
    }, 20);
  }, [freqIdx, alphaIdx, seed]);

  const inflation = results ? round(results.fpr / results.nomPct, 2) : null;

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text(
        "Peeking False-Positive Inflator",
        "Wie Peeking die Falsch-Positiv-Rate erhöht",
      )}
      caption={text(
        "Monte Carlo estimate from 1 000 seeded normal-approximation A/A runs, capped at 5 000 observations per arm. It counts runs that cross p < α at any configured look; it is not a universal optional-stopping rate.",
        "Monte-Carlo-Schätzung aus 1 000 initialisierten A/A-Läufen mit Normalapproximation und höchstens 5 000 Beobachtungen je Gruppe. Gezählt werden Läufe mit p < α bei einer konfigurierten Prüfung; dies ist keine allgemeine Rate für optionales Stoppen.",
      )}
    >
      <div className="ds-responsive-split">
        <div>
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 12,
                color: INK3,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              {text("Check frequency", "Prüfhäufigkeit")}
            </div>
            {FREQ_OPTIONS.map((f, i) => (
              <label
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                <input
                  type="radio"
                  name="freq"
                  checked={freqIdx === i}
                  onChange={() => setFreqIdx(i)}
                />
                {locale === "de" ? FREQ_LABELS_DE[i] : f.label}
              </label>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 12,
                color: INK3,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}
            >
              {text("Significance threshold (α)", "Signifikanzniveau (α)")}
            </div>
            {ALPHA_OPTIONS.map((a, i) => (
              <label
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                <input
                  type="radio"
                  name="alpha"
                  checked={alphaIdx === i}
                  onChange={() => setAlphaIdx(i)}
                />
                α = {a}
              </label>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={runSim}
            disabled={running}
            style={{ width: "100%" }}
          >
            {running
              ? text("Simulating…", "Simulation läuft …")
              : text("Run 1 000 A/A tests", "1 000 A/A-Tests ausführen")}
          </button>
        </div>
        <div
          style={{
            padding: 16,
            background: BGHT,
            borderRadius: 10,
            border: `1px solid ${HAIR}`,
          }}
        >
          {!results ? (
            <div style={{ color: INK3, fontSize: 13, marginTop: 20 }}>
              {text(
                "Run the simulation to see results.",
                "Simulation ausführen, um Ergebnisse zu sehen.",
              )}
            </div>
          ) : (
            <>
              <div
                className="ds-responsive-metrics"
                style={{ marginBottom: 16 }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: MINT,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    Nominal α
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif,serif)",
                      fontSize: 34,
                      color: MINT,
                    }}
                  >
                    {round(results.nomPct, 1)}%
                  </div>
                  <div style={{ fontSize: 12, color: INK3 }}>
                    {text("stated threshold", "festgelegter Grenzwert")}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: BAD,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {text("Actual FPR", "Tatsächliche FPR")}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-serif,serif)",
                      fontSize: 34,
                      color: BAD,
                    }}
                  >
                    {round(results.fpr, 1)}%
                  </div>
                  <div style={{ fontSize: 12, color: INK3 }}>
                    {text("observed in sim", "in der Simulation beobachtet")}
                  </div>
                </div>
              </div>
              <Bar
                label={text("Nominal FPR", "Nominale FPR")}
                value={results.nomPct}
                max={50}
                color={MINT}
              />
              <Bar
                label={text("Peeking FPR", "FPR mit Peeking")}
                value={results.fpr}
                max={50}
                color={BAD}
              />
              {inflation !== null && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    background: "rgba(239,68,68,0.1)",
                    borderRadius: 8,
                    fontSize: 12.5,
                    color: BAD,
                  }}
                >
                  <strong>
                    {inflation}× {text("inflation", "Anstieg")}
                  </strong>
                  {text(
                    ", peeking multiplied your false-positive rate by ",
                    ", Peeking hat die Falsch-Positiv-Rate um den Faktor ",
                  )}
                  {inflation}×
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 12, color: INK3 }}>
                {results.falsePos} / {results.n}{" "}
                {text(
                  'A/A tests showed a "significant" result despite no real effect.',
                  'A/A-Tests zeigten trotz fehlendem echtem Effekt ein "signifikantes" Ergebnis.',
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default PeekingSimulator;
