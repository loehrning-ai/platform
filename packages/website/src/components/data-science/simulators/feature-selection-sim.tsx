"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { useDataScienceLocale } from "../locale-context";

// ─── FeatureSelectionSim ────────────────────────────
//
// Typed port of Ch04_Feature.js's `FeatureSelectionSim`: a feature-
// selection method comparison (correlation filter / mutual information /
// LASSO), static hardcoded data, no RNG.

type SelectionMethod = "corr" | "mi" | "lasso";

interface Feature {
  readonly name: string;
  readonly corr: number;
  readonly mi: number;
  readonly lasso: number;
}

const FEATURES: readonly Feature[] = [
  { name: "user_age", corr: 0.72, mi: 0.68, lasso: 0.41 },
  { name: "session_dur", corr: 0.85, mi: 0.81, lasso: 0.53 },
  { name: "page_views", corr: 0.88, mi: 0.76, lasso: 0 },
  { name: "ad_relevance", corr: 0.31, mi: 0.72, lasso: 0.38 },
  { name: "random_noise_1", corr: 0.04, mi: 0.06, lasso: 0 },
  { name: "random_noise_2", corr: 0.02, mi: 0.03, lasso: 0 },
  { name: "device_type", corr: 0.55, mi: 0.49, lasso: 0.22 },
  { name: "time_of_day", corr: 0.38, mi: 0.61, lasso: 0.15 },
];

const CORR_KEEP = [true, true, false, true, false, false, true, true];
const MI_THRESHOLD = 0.1;
const LASSO_THRESHOLD = 0.01;

const METHODS: readonly { key: SelectionMethod; label: string }[] = [
  { key: "corr", label: "Correlation Filter" },
  { key: "mi", label: "Mutual Information" },
  { key: "lasso", label: "LASSO" },
];
const METHOD_LABELS_DE: Readonly<Record<SelectionMethod, string>> = {
  corr: "Korrelationsfilter",
  mi: "Mutual Information",
  lasso: "LASSO",
};

const METHOD_DESC: Record<SelectionMethod, string> = {
  corr: "This heuristic removes entries with low marginal target correlation and one of each correlated pair. It can miss nonlinear or conditional signal.",
  mi: "Mutual information can represent nonlinear marginal dependence, but its estimate depends on sample size and estimator settings and does not capture every conditional contribution.",
  lasso:
    "A regularized linear model sets some fitted coefficients to zero. Selection depends on scaling, penalty tuning, collinearity, sampling variation, and the specified feature basis.",
};
const METHOD_DESC_DE: Record<SelectionMethod, string> = {
  corr: "Diese Heuristik entfernt Einträge mit geringer marginaler Zielkorrelation und je eines aus korrelierten Paaren. Nichtlineare oder bedingte Signale können fehlen.",
  mi: "Mutual Information kann nichtlineare marginale Abhängigkeit abbilden. Die Schätzung hängt jedoch von Stichprobengröße und Verfahrenseinstellungen ab und erfasst nicht jeden bedingten Beitrag.",
  lasso:
    "Ein regularisiertes lineares Modell setzt einige angepasste Koeffizienten auf null. Die Auswahl hängt von Skalierung, Strafterm, Kollinearität, Stichprobenvariation und Merkmalsbasis ab.",
};

function scoreLabelFor(method: SelectionMethod, german: boolean): string {
  if (german)
    return method === "corr"
      ? "|Korrelation mit Ziel|"
      : method === "mi"
        ? "MI-Wert"
        : "LASSO-Koeffizient";
  return method === "corr"
    ? "|corr with target|"
    : method === "mi"
      ? "MI score"
      : "LASSO coef";
}

export function FeatureSelectionSim() {
  const { locale, text } = useDataScienceLocale();
  const [method, setMethod] = useState<SelectionMethod>("corr");

  const kept = useMemo(() => {
    if (method === "corr") return CORR_KEEP;
    if (method === "mi") return FEATURES.map((f) => f.mi > MI_THRESHOLD);
    return FEATURES.map((f) => f.lasso > LASSO_THRESHOLD);
  }, [method]);

  const scores = useMemo(() => {
    if (method === "corr") return FEATURES.map((f) => f.corr);
    if (method === "mi") return FEATURES.map((f) => f.mi);
    return FEATURES.map((f) => f.lasso);
  }, [method]);

  const keptCount = kept.filter(Boolean).length;

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text("Feature selection methods", "Verfahren zur Merkmalsauswahl")}
      meta={text(
        `${keptCount}/8 features kept`,
        `${keptCount}/8 Merkmale behalten`,
      )}
      caption={text(
        "The scores, thresholds, and keep/drop decisions are fixed teaching values, not estimates from a dataset. Compare what each method can represent and validate selection stability inside the full modeling procedure.",
        "Scores, Schwellenwerte und Behalten/Entfernen-Entscheidungen sind feste Lehrwerte, keine Schätzungen aus einem Datensatz. Die darstellbaren Beziehungen vergleichen und die Auswahlstabilität innerhalb des vollständigen Modellverfahrens validieren.",
      )}
    >
      <div className="sim-controls" style={{ marginBottom: 14 }}>
        <div className="sim-ctrl">
          <label>{text("Selection method", "Auswahlverfahren")}</label>
          <div className="seg">
            {METHODS.map((m) => (
              <button
                key={m.key}
                type="button"
                className={method === m.key ? "on" : ""}
                onClick={() => setMethod(m.key)}
              >
                {locale === "de" ? METHOD_LABELS_DE[m.key] : m.label}
              </button>
            ))}
          </div>
        </div>
        <p className="prose" style={{ fontSize: 12.5, margin: "8px 0 0" }}>
          {locale === "de" ? METHOD_DESC_DE[method] : METHOD_DESC[method]}
        </p>
      </div>
      <div className="ds-feature-grid">
        {FEATURES.map((f, i) => {
          const isKept = kept[i];
          const score = scores[i]!;
          const barW = Math.round(score * 100);
          return (
            <div
              key={f.name}
              style={{
                padding: "10px 12px",
                border: `1.5px solid ${isKept ? "rgba(31,175,126,0.4)" : "rgba(216,58,58,0.35)"}`,
                borderRadius: 8,
                background: isKept
                  ? "rgba(31,175,126,0.08)"
                  : "rgba(216,58,58,0.07)",
                transition: "background 0.35s, border-color 0.35s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  height: 3,
                  width: `${barW}%`,
                  background: isKept ? "var(--good)" : "rgba(216,58,58,0.45)",
                  transition: "width 0.4s, background 0.35s",
                }}
              />
              <div className="ds-feature-name-row">
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: isKept ? "var(--good-ink)" : "var(--bad-ink)",
                  }}
                >
                  {f.name}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: isKept ? "var(--ink-2)" : "var(--bad-ink)",
                  }}
                >
                  {score.toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: isKept ? "var(--good-ink)" : "var(--bad-ink)",
                  marginTop: 3,
                }}
              >
                {isKept
                  ? text("✓ KEEP", "✓ BEHALTEN")
                  : text("✗ DROP", "✗ ENTFERNEN")}{" "}
                · {scoreLabelFor(method, locale === "de")}
              </div>
            </div>
          );
        })}
      </div>
      {method === "corr" && (
        <div
          style={{
            marginTop: 10,
            padding: "7px 11px",
            background: "rgba(91,62,232,0.07)",
            border: "1px solid rgba(91,62,232,0.25)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--violet-ink)",
          }}
        >
          {text(
            "page_views dropped: highly correlated with session_dur (r = 0.93). Keeping both adds no information.",
            "page_views entfernt: stark mit session_dur korreliert (r = 0.93). Beide Merkmale zu behalten fügt keine Information hinzu.",
          )}
        </div>
      )}
    </Panel>
  );
}

export default FeatureSelectionSim;
