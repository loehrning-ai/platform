"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { SafeLessonMarkup } from "@/components/safe-lesson-markup";
import { useDataScienceLocale } from "../locale-context";

// ─── EncodingComparison ─────────────────────────────
//
// Typed port of Ch04_Feature.js's `EncodingComparison`: a categorical
// encoding-strategy demo (one-hot / label / target / frequency), no RNG.

type EncodingMode = "onehot" | "label" | "target" | "frequency";

const CITIES = ["New York", "London", "Tokyo", "Paris", "Berlin"];
const CITY_TARGETS = [7.2, 6.8, 8.1, 7.5, 6.4];
const CITY_COUNTS = [38, 22, 18, 12, 10];

const MODES: readonly { key: EncodingMode; label: string }[] = [
  { key: "onehot", label: "One-Hot" },
  { key: "label", label: "Label" },
  { key: "target", label: "Target" },
  { key: "frequency", label: "Frequency" },
];
const MODE_LABELS_DE: Readonly<Record<EncodingMode, string>> = {
  onehot: "One-Hot",
  label: "Label",
  target: "Target",
  frequency: "Häufigkeit",
};

const DESCRIPTIONS: Record<EncodingMode, string> = {
  onehot:
    "Creates one binary column per observed category. It avoids an ordinal-distance assumption but increases width with cardinality and needs an unknown-category policy.",
  label:
    "Assigns each category an integer 1-N. It is compact but <strong>introduces ordering and spacing</strong>: Berlin (5) is not meaningfully greater than London (2). Models that treat the code as numeric can learn that artifact.",
  target:
    "Replaces each category with a target summary. <strong>Estimate it inside each training fold</strong>, with smoothing and an unknown-category rule, so validation rows do not contribute their labels.",
  frequency:
    "Replaces category with its frequency (count or ratio). Preserves cardinality signal without arbitrary ordering. Treats two equally-frequent cities as identical.",
};
const DESCRIPTIONS_DE: Record<EncodingMode, string> = {
  onehot:
    "Erzeugt je beobachteter Kategorie eine binäre Spalte. Das vermeidet eine ordinale Distanzannahme, wächst aber mit der Kardinalität und benötigt eine Regel für unbekannte Kategorien.",
  label:
    "Weist jeder Kategorie eine ganze Zahl von 1-N zu. Das ist kompakt, <strong>erzeugt aber Rangfolge und Abstände</strong>: Berlin (5) ist nicht sinnvoll größer als London (2). Modelle mit numerischer Interpretation können dieses Artefakt lernen.",
  target:
    "Ersetzt jede Kategorie durch eine Zielzusammenfassung. <strong>Innerhalb jedes Trainingsfolds schätzen</strong>, mit Glättung und Regel für unbekannte Kategorien, damit Validierungszeilen ihre Labels nicht beitragen.",
  frequency:
    "Ersetzt jede Kategorie durch ihre Häufigkeit als Anzahl oder Anteil. Das erhält ein Kardinalitätssignal ohne willkürliche Rangfolge, behandelt aber zwei gleich häufige Städte identisch.",
};

interface TableData {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

function buildTableData(mode: EncodingMode): TableData {
  if (mode === "onehot") {
    const headers = ["City (raw)", ...CITIES.map((c) => c.split(" ")[0]!)];
    const rows = CITIES.map((city, i) => [
      city,
      ...CITIES.map((_, j) => (i === j ? "1" : "0")),
    ]);
    return { headers, rows };
  }
  if (mode === "label") {
    return {
      headers: ["City (raw)", "city_encoded"],
      rows: CITIES.map((city, i) => [city, String(i + 1)]),
    };
  }
  if (mode === "target") {
    return {
      headers: ["City (raw)", "city_target_enc"],
      rows: CITIES.map((city, i) => [city, CITY_TARGETS[i]!.toFixed(2)]),
    };
  }
  const total = CITY_COUNTS.reduce((a, v) => a + v, 0);
  return {
    headers: ["City (raw)", "city_count", "city_freq"],
    rows: CITIES.map((city, i) => [
      city,
      String(CITY_COUNTS[i]),
      (CITY_COUNTS[i]! / total).toFixed(2),
    ]),
  };
}

function colorFor(mode: EncodingMode, val: string, colIdx: number): string {
  if (mode === "onehot") return val === "1" ? "#D1FF3A" : "var(--bg-hi)";
  if (mode === "label")
    return colIdx === 1 ? `hsl(${Number(val) * 40}, 60%, 64%)` : "transparent";
  if (mode === "target")
    return colIdx === 1
      ? `hsl(${(Number(val) - 6) * 120}, 55%, 64%)`
      : "transparent";
  if (mode === "frequency")
    return colIdx === 2
      ? `hsl(200, 65%, ${Math.max(60, 84 - Number(val) * 80)}%)`
      : "transparent";
  return "transparent";
}

export function EncodingComparison() {
  const { locale, text } = useDataScienceLocale();
  const [mode, setMode] = useState<EncodingMode>("onehot");
  const tableData = useMemo(() => buildTableData(mode), [mode]);

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text(
        "Categorical encoding methods",
        "Kategoriale Merkmale kodieren",
      )}
      meta={text("City column · 5 categories", "Stadtspalte · 5 Kategorien")}
      caption={text(
        "Fixed five-city lookup, not a fitted encoder. Compare representation shape and assumptions here; choose and fit the real encoder inside validation with explicit missing and unknown-category behavior.",
        "Feste Lookup-Tabelle für fünf Städte, kein angepasster Encoder. Hier werden Form und Annahmen verglichen; den realen Encoder innerhalb der Validierung mit expliziter Behandlung fehlender und unbekannter Kategorien wählen und anpassen.",
      )}
    >
      <div className="sim-row">
        <div className="sim-controls">
          <div className="sim-ctrl">
            <label>{text("Encoding strategy", "Kodierungsverfahren")}</label>
            <div className="seg">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={mode === m.key ? "on" : ""}
                  onClick={() => setMode(m.key)}
                >
                  {locale === "de" ? MODE_LABELS_DE[m.key] : m.label}
                </button>
              ))}
            </div>
          </div>
          <p className="prose" style={{ fontSize: 12.5, margin: 0 }}>
            <SafeLessonMarkup
              html={
                locale === "de" ? DESCRIPTIONS_DE[mode] : DESCRIPTIONS[mode]
              }
            />
          </p>
        </div>
      </div>
      <div
        data-horizontal-scroll
        role="region"
        aria-label={text(
          "Categorical encoding values",
          "Werte der kategorialen Kodierung",
        )}
        tabIndex={0}
        style={{ overflowX: "auto", marginTop: 16 }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              {tableData.headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "6px 10px",
                    borderBottom: "1px solid var(--hair-2)",
                    textAlign: "left",
                    color: "var(--ink-3)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {i === 0 ? text(h, "Stadt (Rohwert)") : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: "1px solid var(--hair)" }}>
                {row.map((cell, ci) => {
                  const bg = colorFor(mode, cell, ci);
                  const isHighlight =
                    bg !== "transparent" && bg !== "var(--bg-hi)";
                  const txt =
                    ci === 0
                      ? "var(--ink-1)"
                      : !isHighlight
                        ? "var(--ink-2)"
                        : "#0A0A0A";
                  return (
                    <td
                      key={ci}
                      style={{
                        padding: "5px 10px",
                        background: ci === 0 ? "transparent" : bg,
                        color: txt,
                        fontWeight: ci === 0 ? 400 : 600,
                        transition: "background 0.3s",
                      }}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mode === "label" && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "rgba(216,58,58,0.08)",
            border: "1px solid rgba(216,58,58,0.3)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--bad-ink)",
          }}
        >
          {text(
            "⚠ Linear models will treat Berlin (5) as 5× New York (1). This ordering is meaningless and injects noise.",
            "⚠ Lineare Modelle behandeln Berlin (5) wie 5× New York (1). Diese Rangfolge hat keine sachliche Bedeutung und erzeugt Rauschen.",
          )}
        </div>
      )}
      {mode === "target" && (
        <div
          style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "rgba(31,175,126,0.08)",
            border: "1px solid rgba(31,175,126,0.3)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--good-ink)",
          }}
        >
          {text(
            "✓ Computed out-of-fold (correct). Values shown are held-out fold means, no target leakage.",
            "✓ Out-of-Fold berechnet. Die Werte sind Mittelwerte aus zurückgehaltenen Folds; es entsteht kein Target Leakage.",
          )}
        </div>
      )}
    </Panel>
  );
}

export default EncodingComparison;
