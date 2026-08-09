"use client";

import { useState } from "react";
import { useDataScienceLocale } from "@/components/data-science/locale-context";
import { Panel } from "@/components/data-science/shared/primitives";

interface ChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly desc: string;
}

const CHECKLIST_ITEMS: readonly ChecklistItem[] = [
  {
    id: "model_card",
    label: "Model card written",
    desc: "Document intended use, limitations, training data, and known failure modes.",
  },
  {
    id: "fairness",
    label: "Fairness audit done",
    desc: "Define relevant groups, harms, reference populations, metrics, and review thresholds with domain and legal owners; one ratio is not a universal fairness test.",
  },
  {
    id: "drift",
    label: "Feature drift monitoring set up",
    desc: "Choose monitored inputs, reference windows, cadence, statistical checks, and action thresholds from baseline behavior and the cost of missing a shift.",
  },
  {
    id: "champion",
    label: "Champion/challenger pipeline",
    desc: "Compare an immutable candidate with the current model using predefined outcome metrics, uncertainty, safety guardrails, and a promotion decision owner.",
  },
  {
    id: "rollback",
    label: "Rollback plan documented",
    desc: "One-command revert to prior model version. Test it in staging before going live.",
  },
  {
    id: "sla",
    label: "Service objectives defined",
    desc: "Set latency, throughput, availability, and error objectives from product needs, then verify them with representative load and failure tests.",
  },
  {
    id: "alerts",
    label: "Alert thresholds set",
    desc: "Calibrate actionable outcome, distribution, latency, and error alerts against baselines; assign severity, owner, response, and suppression rules.",
  },
  {
    id: "shadow",
    label: "Pre-promotion evidence collected",
    desc: "Choose replay, batch, shadow, or a staged route from the risk. Define a representative observation window and account for label delay and logging exposure.",
  },
];

const CHECKLIST_ITEMS_DE: readonly ChecklistItem[] = [
  {
    id: "model_card",
    label: "Model Card erstellt",
    desc: "Vorgesehene Nutzung, Grenzen, Trainingsdaten und bekannte Fehlermuster dokumentieren.",
  },
  {
    id: "fairness",
    label: "Fairness-Audit abgeschlossen",
    desc: "Relevante Gruppen, Schäden, Referenzpopulationen, Metriken und Prüfgrenzen mit Fach- und Rechtsverantwortlichen festlegen; ein einzelnes Verhältnis ist kein allgemeiner Fairness-Test.",
  },
  {
    id: "drift",
    label: "Feature-Drift-Monitoring eingerichtet",
    desc: "Überwachte Eingaben, Referenzfenster, Rhythmus, statistische Prüfungen und Aktionsgrenzen aus dem Basisverhalten und den Kosten einer übersehenen Verschiebung ableiten.",
  },
  {
    id: "champion",
    label: "Champion/Challenger-Pipeline",
    desc: "Einen unveränderlichen Kandidaten anhand vorab festgelegter Ergebnismetriken, Unsicherheit, Sicherheitsleitplanken und klarer Freigabeverantwortung mit dem aktuellen Modell vergleichen.",
  },
  {
    id: "rollback",
    label: "Rollback-Plan dokumentiert",
    desc: "Mit einem Befehl zur vorherigen Modellversion zurückkehren. Vor dem Live-Betrieb im Staging testen.",
  },
  {
    id: "sla",
    label: "Serviceziele definiert",
    desc: "Latenz-, Durchsatz-, Verfügbarkeits- und Fehlerziele aus Produktanforderungen ableiten und mit repräsentativen Last- und Fehlertests prüfen.",
  },
  {
    id: "alerts",
    label: "Alarmgrenzen festgelegt",
    desc: "Handlungsfähige Alarme für Ergebnis, Verteilung, Latenz und Fehler gegen Baselines kalibrieren; Schweregrad, Verantwortliche, Reaktion und Unterdrückungsregeln festlegen.",
  },
  {
    id: "shadow",
    label: "Evidenz vor der Freigabe erhoben",
    desc: "Replay, Batch, Shadow oder gestufte Route aus dem Risiko wählen. Ein repräsentatives Beobachtungsfenster definieren und Label-Verzögerung sowie Protokollierungsexposition berücksichtigen.",
  },
];

export function PostDeployChecklist() {
  const { locale, text } = useDataScienceLocale();
  const checklistItems = locale === "de" ? CHECKLIST_ITEMS_DE : CHECKLIST_ITEMS;
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pct = Math.round((checked.size / checklistItems.length) * 100);
  const barColor =
    pct === 100
      ? "var(--mint-ink)"
      : pct >= 50
        ? "var(--lime-ink)"
        : "var(--coral-ink)";

  return (
    <Panel
      eyebrow={text("SIMULATOR", "SIMULATOR")}
      title={text(
        "Production readiness checklist",
        "Checkliste für die Produktionsreife",
      )}
      meta={`${checked.size} / ${checklistItems.length} ${text("complete", "abgeschlossen")}`}
      caption={text(
        "Illustrative review prompts, not a certification. Checking every item records local UI state only; production readiness requires system-specific evidence, named owners, and approval outside this page.",
        "Illustrative Prüffragen, keine Zertifizierung. Alle Häkchen speichern nur lokalen UI-Zustand; Produktionsreife benötigt systemspezifische Evidenz, benannte Verantwortliche und eine Freigabe außerhalb dieser Seite.",
      )}
    >
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--ink-3)",
            }}
          >
            {text("Readiness", "Bereitschaft")}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: barColor,
              fontWeight: 700,
            }}
          >
            {pct}%
            {pct === 100
              ? text(", review recorded.", ", Prüfung erfasst.")
              : ""}
          </span>
        </div>
        <div style={{ height: 6, background: "var(--bg-hi)", borderRadius: 3 }}>
          <div
            style={{
              height: "100%",
              borderRadius: 3,
              width: `${pct}%`,
              background: barColor,
              transition: "width 0.4s ease, background 0.3s ease",
            }}
          />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {checklistItems.map((item) => {
          const done = checked.has(item.id);
          const open = expanded === item.id;
          return (
            <div
              key={item.id}
              style={{
                borderRadius: 8,
                border: done
                  ? "1px solid rgba(100,226,181,0.35)"
                  : "1px solid var(--hair)",
                background: done ? "rgba(100,226,181,0.07)" : "var(--bg-hi)",
                overflow: "hidden",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                }}
              >
                <label
                  htmlFor={`post-deploy-${item.id}`}
                  style={{
                    display: "flex",
                    flex: 1,
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                  }}
                >
                  <input
                    id={`post-deploy-${item.id}`}
                    type="checkbox"
                    checked={done}
                    onChange={() => toggle(item.id)}
                    style={{
                      width: 16,
                      height: 16,
                      cursor: "pointer",
                      accentColor: "var(--mint)",
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      color: done ? "var(--mint-ink)" : "var(--ink-1)",
                      textDecoration: done ? "line-through" : "none",
                      transition: "color 0.2s",
                    }}
                  >
                    {item.label}
                  </span>
                </label>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`post-deploy-details-${item.id}`}
                  aria-label={
                    open
                      ? text(
                          `Hide details for ${item.label}`,
                          `Details zu ${item.label} ausblenden`,
                        )
                      : text(
                          `Show details for ${item.label}`,
                          `Details zu ${item.label} anzeigen`,
                        )
                  }
                  onClick={() => setExpanded(open ? null : item.id)}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "var(--ink-4)",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: 8,
                  }}
                >
                  {open ? "▲" : "▼"}
                </button>
              </div>
              {open && (
                <div
                  id={`post-deploy-details-${item.id}`}
                  style={{
                    padding: "0 14px 12px 42px",
                    fontSize: 12.5,
                    color: "var(--ink-3)",
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

export default PostDeployChecklist;
