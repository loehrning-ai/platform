"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { clamp } from "@/lib/data-science/sim-kit";
import { useDataScienceLocale } from "../locale-context";

// ─── InteractionTerms ───────────────────────────────
//
// Typed port of Ch04_Feature.js's `InteractionTerms`: an A×B vs A+B
// interaction heatmap, two range sliders, no RNG.

type HeatmapView = "interaction" | "additive";

const GRID = 10;
const W = 240;
const H = 240;
const CELL_W = W / GRID;
const CELL_H = H / GRID;

function heatColor(val: number, max: number): string {
  const t = val / max;
  const r = Math.round(clamp(t * 2 - 0.5, 0, 1) * 210 + 20);
  const g = Math.round(clamp(t * 1.8 - 0.3, 0, 1) * 200 + 10);
  const b = Math.round(clamp((1 - t) * 1.5, 0, 1) * 180 + 20);
  return `rgb(${r},${g},${b})`;
}

export function InteractionTerms() {
  const { locale, text } = useDataScienceLocale();
  const [featureA, setFeatureA] = useState(5);
  const [featureB, setFeatureB] = useState(5);
  const [view, setView] = useState<HeatmapView>("interaction");

  const grid = useMemo(() => {
    return Array.from({ length: GRID }, (_, row) => {
      const b = GRID - 1 - row;
      return Array.from({ length: GRID }, (_2, col) => {
        const a = col;
        return view === "interaction" ? a * b : a + b;
      });
    });
  }, [view]);

  const maxVal = view === "interaction" ? (GRID - 1) ** 2 : (GRID - 1) * 2;
  const currentInteraction = featureA * featureB;
  const currentAdditive = featureA + featureB;
  const delta = currentInteraction - currentAdditive;

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text(
        "Interaction terms: A×B vs A+B",
        "Interaktionsterme: A×B gegen A+B",
      )}
      meta={`A=${featureA}, B=${featureB}`}
      caption={text(
        "This fixed arithmetic example contrasts an additive score A+B with a product term A×B. A product term lets a specified linear model represent one form of interaction; its usefulness and interpretation depend on scale, model family, data, and validation.",
        "Dieses feste Rechenbeispiel vergleicht den additiven Score A+B mit dem Produktterm A×B. Ein Produktterm bildet in einem festgelegten linearen Modell eine Form der Interaktion ab; Nutzen und Interpretation hängen von Skala, Modellfamilie, Daten und Validierung ab.",
      )}
    >
      <div className="sim-row">
        <div className="sim-controls" style={{ flex: "0 0 200px" }}>
          <div className="sim-ctrl">
            <label>
              {text(
                "Feature A (e.g. user age score)",
                "Merkmal A (z. B. Alterswert)",
              )}
              : {featureA}
            </label>
            <input
              type="range"
              min="0"
              max="9"
              value={featureA}
              aria-label={text(
                "Feature A (user age score)",
                "Merkmal A (Alterswert)",
              )}
              onChange={(e) => setFeatureA(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
          <div className="sim-ctrl">
            <label>
              {text(
                "Feature B (e.g. ad relevance)",
                "Merkmal B (z. B. Anzeigenrelevanz)",
              )}
              : {featureB}
            </label>
            <input
              type="range"
              min="0"
              max="9"
              value={featureB}
              aria-label={text(
                "Feature B (ad relevance)",
                "Merkmal B (Anzeigenrelevanz)",
              )}
              onChange={(e) => setFeatureB(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
          <div className="sim-ctrl" style={{ marginTop: 8 }}>
            <label>{text("Heatmap view", "Heatmap-Ansicht")}</label>
            <div className="seg">
              <button
                type="button"
                className={view === "interaction" ? "on" : ""}
                onClick={() => setView("interaction")}
              >
                A×B
              </button>
              <button
                type="button"
                className={view === "additive" ? "on" : ""}
                onClick={() => setView("additive")}
              >
                A+B
              </button>
            </div>
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
            }}
          >
            <div style={{ color: "var(--ink-3)" }}>
              A + B ={" "}
              <span style={{ color: "var(--ink-1)" }}>{currentAdditive}</span>
            </div>
            <div style={{ color: "var(--ink-3)", marginTop: 4 }}>
              A × B ={" "}
              <span style={{ color: "var(--lime-ink)" }}>
                {currentInteraction}
              </span>
            </div>
            <div
              style={{
                marginTop: 6,
                padding: "6px 8px",
                background: "var(--bg-hi)",
                borderRadius: 5,
                fontSize: 12,
                color: delta > 0 ? "var(--lime-ink)" : "var(--bad-ink)",
              }}
            >
              {locale === "de"
                ? delta > 0
                  ? `Interaktion ergänzt +${delta} Signal`
                  : delta < 0
                    ? `Interaktion ergibt ${delta} gegenüber additiv`
                    : "An diesem Punkt gleich"
                : delta > 0
                  ? `Interaction adds +${delta} signal`
                  : delta < 0
                    ? `Interaction gives ${delta} vs additive`
                    : "Equal at this point"}
            </div>
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "var(--ink-3)",
              lineHeight: 1.5,
            }}
          >
            {text("Real example:", "Praxisbeispiel:")}
            <br />
            <span style={{ color: "var(--ink-2)" }}>
              CTR ≈ user_age_score × ad_relevance
            </span>
            <br />
            {text(
              "High relevance + wrong age = low CTR",
              "Hohe Relevanz + falsche Altersgruppe = niedrige CTR",
            )}
            <br />
            {text("Both high =", "Beides hoch =")}{" "}
            <span style={{ color: "var(--lime-ink)" }}>
              {text("disproportionate lift", "überproportionaler Anstieg")}
            </span>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-3)",
              marginBottom: 6,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {view === "interaction"
              ? text("A × B output", "Ausgabe A × B")
              : text("A + B output", "Ausgabe A + B")}{" "}
            (A→ B↑)
          </div>
          <svg
            viewBox={`0 0 ${W + 20} ${H + 20}`}
            style={{ width: Math.min(280, W + 20), display: "block" }}
          >
            {grid.map((row, ri) =>
              row.map((val, ci) => {
                const isCurrentA = ci === featureA;
                const isCurrentB = ri === GRID - 1 - featureB;
                const isCurrent = isCurrentA && isCurrentB;
                return (
                  <g key={`${ri}-${ci}`}>
                    <rect
                      x={ci * CELL_W}
                      y={ri * CELL_H}
                      width={CELL_W}
                      height={CELL_H}
                      fill={heatColor(val, maxVal)}
                      stroke={isCurrent ? "#fff" : "none"}
                      strokeWidth={isCurrent ? 2 : 0}
                    />
                    {isCurrent && (
                      <text
                        x={ci * CELL_W + CELL_W / 2}
                        y={ri * CELL_H + CELL_H / 2 + 4}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="700"
                        fontFamily="'JetBrains Mono', monospace"
                        fill="#fff"
                      >
                        {val}
                      </text>
                    )}
                  </g>
                );
              }),
            )}
            <text
              x={W / 2}
              y={H + 16}
              textAnchor="middle"
              fontSize="9"
              fontFamily="'JetBrains Mono', monospace"
              fill="#555"
            >
              {text("Feature A →", "Merkmal A →")}
            </text>
            <text
              x={W + 14}
              y={H / 2}
              textAnchor="middle"
              fontSize="9"
              fontFamily="'JetBrains Mono', monospace"
              fill="#555"
              transform={`rotate(-90, ${W + 14}, ${H / 2})`}
            >
              {text("Feature B ↑", "Merkmal B ↑")}
            </text>
          </svg>
        </div>
      </div>
    </Panel>
  );
}

export default InteractionTerms;
