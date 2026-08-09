"use client";

import { useState } from "react";
import { Panel } from "@/components/data-science/shared/primitives";
import { useDataScienceLocale } from "../locale-context";

// ─── LeakageDetector ────────────────────────────────
//
// Typed port of Ch03_Clean.js's `LeakageDetector`. Feature pool is
// hardcoded (no RNG in source).

interface FeatureDef {
  readonly name: string;
  readonly leaky: boolean;
  readonly reason: string;
}

const FEATURE_POOL: readonly FeatureDef[] = [
  { name: "user_age", leaky: false, reason: "" },
  { name: "session_duration", leaky: false, reason: "" },
  { name: "plan_type", leaky: false, reason: "" },
  { name: "support_tickets", leaky: false, reason: "" },
  { name: "last_login_days_ago", leaky: false, reason: "" },
  {
    name: "target_mean_encoded",
    leaky: true,
    reason:
      "Computed using the target label across all rows, the model literally sees the answer.",
  },
  {
    name: "days_after_churn",
    leaky: true,
    reason:
      "A post-event feature: it is only defined after churn, so it cannot support a pre-churn decision.",
  },
  {
    name: "customer_id_hash",
    leaky: true,
    reason:
      "A high-cardinality ID can support memorization in the training sample without transferring to new users.",
  },
  {
    name: "total_revenue_lifetime",
    leaky: true,
    reason:
      "If computed using future periods, revenue after the churn date leaks into the label window.",
  },
  {
    name: "email_domain_target",
    leaky: true,
    reason:
      "Target-encoded without out-of-fold splits, each row saw its own label during encoding.",
  },
];
const REASONS_DE: Readonly<Record<string, string>> = {
  target_mean_encoded:
    "Die Kodierung wurde mit dem Zielwert über alle Zeilen berechnet. Das Modell sieht damit die gesuchte Antwort.",
  days_after_churn:
    "Dieses Merkmal entsteht erst nach dem Ereignis und ist nur definiert, wenn die Person bereits abgewandert ist. Es kann keine Entscheidung vor der Abwanderung unterstützen.",
  customer_id_hash:
    "Die hochkardinale ID dient als Proxy. Das Modell merkt sich IDs aus dem Training und kann das Muster nicht auf neue Personen übertragen.",
  total_revenue_lifetime:
    "Wird der Lebenszeitumsatz mit zukünftigen Perioden berechnet, fließen Umsätze nach dem Abwanderungsdatum in das Label-Fenster ein.",
  email_domain_target:
    "Die Zielwertkodierung wurde ohne Out-of-Fold-Aufteilung erzeugt. Jede Zeile hat bei der Kodierung ihr eigenes Label gesehen.",
};

const DEFAULT_SELECTED = ["user_age", "session_duration", "plan_type"];

export function LeakageDetector() {
  const { locale, text } = useDataScienceLocale();
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    new Set(DEFAULT_SELECTED),
  );
  const [revealed, setReveal] = useState(false);

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        if (next.size > 1) next.delete(name);
      } else if (next.size < 5) {
        next.add(name);
      }
      return next;
    });
    setReveal(false);
  };

  const selectedFeatures = FEATURE_POOL.filter((f) => selected.has(f.name));
  const leakyCount = selectedFeatures.filter((f) => f.leaky).length;

  return (
    <Panel
      eyebrow={text("SIMULATION", "SIMULATION")}
      title={text("Leakage Detector", "Leakage-Prüfung")}
      meta={text(
        `${selected.size} features selected · ${leakyCount} leaky`,
        `${selected.size} Merkmale ausgewählt · ${leakyCount} mit Leakage`,
      )}
      caption={text(
        "Pick up to five entries, then compare them with this fixed teaching answer key. The checklist flags predefined timing and target-leakage examples; it cannot audit an actual feature pipeline.",
        "Wähle bis zu fünf Einträge und vergleiche sie mit diesem festen Lösungsschlüssel. Die Checkliste markiert vordefinierte Beispiele für Zeit- und Zielwert-Leakage; sie prüft keine reale Feature-Pipeline.",
      )}
    >
      <div className="sim-row" style={{ flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {FEATURE_POOL.map((f) => {
            const isSelected = selected.has(f.name);
            const isLeaky = revealed && isSelected && f.leaky;
            const isSafe = revealed && isSelected && !f.leaky;
            return (
              <button
                key={f.name}
                type="button"
                onClick={() => toggle(f.name)}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 4,
                  border: isLeaky
                    ? "1.5px solid #FF6B80"
                    : isSafe
                      ? "1.5px solid #D1FF3A"
                      : isSelected
                        ? "1.5px solid #4DE2FF"
                        : "1.5px solid #E8E2DA",
                  background: isLeaky
                    ? "#FF6B8018"
                    : isSafe
                      ? "#D1FF3A18"
                      : isSelected
                        ? "#4DE2FF12"
                        : "transparent",
                  color: isLeaky
                    ? "var(--coral-ink)"
                    : isSafe
                      ? "var(--lime-ink)"
                      : isSelected
                        ? "var(--cyan-ink)"
                        : "var(--ink-3)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {f.name}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setReveal(true)}
          >
            {text("Audit features", "Merkmale prüfen")}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setSelected(new Set(DEFAULT_SELECTED));
              setReveal(false);
            }}
          >
            {text("Reset", "Zurücksetzen")}
          </button>
          {revealed && (
            <span
              style={{
                fontSize: 12.5,
                color: leakyCount > 0 ? "var(--coral-ink)" : "var(--lime-ink)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {locale === "de"
                ? leakyCount > 0
                  ? `${leakyCount} Merkmal${leakyCount > 1 ? "e" : ""} mit Leakage gefunden`
                  : "Keine Auffälligkeit"
                : leakyCount > 0
                  ? `${leakyCount} leaky feature${leakyCount > 1 ? "s" : ""} found`
                  : "All clear"}
            </span>
          )}
        </div>
        {revealed && leakyCount > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selectedFeatures
              .filter((f) => f.leaky)
              .map((f) => (
                <div
                  key={f.name}
                  style={{
                    background: "#FF6B8012",
                    border: "1px solid #FF6B8040",
                    borderLeft: "3px solid #FF6B80",
                    borderRadius: 6,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      color: "var(--coral-ink)",
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    {f.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#3A3540" }}>
                    {locale === "de" ? REASONS_DE[f.name] : f.reason}
                  </div>
                </div>
              ))}
          </div>
        )}
        {revealed && leakyCount === 0 && (
          <div
            style={{
              background: "#D1FF3A10",
              border: "1px solid #D1FF3A40",
              borderLeft: "3px solid #D1FF3A",
              borderRadius: 6,
              padding: "10px 14px",
              fontSize: 12.5,
              color: "#3A3540",
            }}
          >
            {text(
              "Clean feature set. No leakage detected, none of the selected features encode future information or the target directly.",
              "Die ausgewählten Merkmale enthalten kein erkennbares Leakage. Keines kodiert zukünftige Informationen oder den Zielwert direkt.",
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

export default LeakageDetector;
