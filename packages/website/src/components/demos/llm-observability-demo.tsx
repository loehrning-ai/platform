"use client";

import { useState, type CSSProperties, type JSX } from "react";
import { DEMO } from "@/lib/demo-tokens";
import { DEMO_HEIGHT } from "./demo-utils";
import { useDemoLocale } from "./demo-locale";
import type { Locale } from "@/lib/i18n/locale";

/**
 * LlmObservabilityDemo — honest rebuild of the observability concept.
 *
 * Teaches: how to measure LLM output quality over time (Eval-Metriken,
 * Drift-Indikator, Feedback-Loop). Uses fixed seed scenarios — no live
 * monitoring, no Math.random in grading logic.
 *
 * Failure-mode beat: a prompt where the automated eval scores "hoch" but a
 * human reviewer flags the output as misleading — showing that automated
 * scores are not a substitute for human review.
 *
 * Evidence: synthetic. External action: none.
 */

interface EvalRow {
  readonly id: string;
  readonly prompt: string;
  readonly output: string;
  readonly autoScore: "hoch" | "mittel" | "niedrig";
  readonly humanScore: "hoch" | "mittel" | "niedrig" | null;
  readonly driftFlag: boolean;
  readonly note: string;
}

// Fixed seed eval scenarios — no randomness
const EVAL_ROWS: readonly EvalRow[] = [
  {
    id: "r1",
    prompt: "Erkläre den Unterschied zwischen GDPR und EU AI Act.",
    output:
      "GDPR schützt personenbezogene Daten seit 2018. Der EU AI Act reguliert ab 2026 KI-Systeme nach Risikostufen, Hochrisiko-Anwendungen wie Biometrie unterliegen strengeren Pflichten.",
    autoScore: "hoch",
    humanScore: "hoch",
    driftFlag: false,
    note: "Konsistente Bewertung, Ausgabe faktisch korrekt und klar strukturiert.",
  },
  {
    id: "r2",
    prompt: "Wie lange gilt ein Vertrag nach Ablauf der Kündigungsfrist?",
    output:
      "Ohne spezifische Vertragsbestimmungen verlängert sich ein Vertrag in Deutschland in der Regel automatisch um die ursprüngliche Laufzeit, sofern keine Partei widerspricht.",
    autoScore: "mittel",
    humanScore: "niedrig",
    driftFlag: false,
    note: "Auto-Eval bewertet Fluenz und Länge, nicht Rechtsgenauigkeit. Der Satz ist missverständlich, Anwalt notwendig.",
  },
  {
    id: "r3",
    prompt: "Welche Risikostufe gilt für einen KI-Chatbot im Kundensupport?",
    output:
      "Ein allgemeiner Kundensupport-Chatbot fällt in der Regel unter Minimalrisiko. Sobald er Kreditentscheidungen oder medizinische Empfehlungen gibt, steigt das Risiko auf Hochrisiko.",
    autoScore: "hoch",
    humanScore: null,
    driftFlag: true,
    note: "Drift-Indikator ausgelöst: dieses Prompt-Muster gab vor 30 Tagen konsistent 'mittel' zurück. Möglicherweise Modellwechsel.",
  },
  {
    id: "r4",
    prompt: "Beschreibe, wie ein Multi-Agent-System Aufgaben aufteilt.",
    output:
      "Ein Orchestrator-Agent delegiert Teilaufgaben an spezialisierte Sub-Agenten (z. B. Recherche, Analyse, Redaktion). Jeder Agent bearbeitet seinen Teil und sendet Ergebnisse zurück.",
    autoScore: "hoch",
    humanScore: "mittel",
    driftFlag: false,
    note: "Divergenz: Reviewer findet Output zu allgemein, fehlt Hinweis auf Fehlerbehandlung und Halluzinationsrisiko in Agent-Ketten.",
  },
];

const ENGLISH_EVAL_ROWS: readonly EvalRow[] = [
  {
    id: "r1",
    prompt: "Explain the difference between the GDPR and the EU AI Act.",
    output:
      "The GDPR governs personal-data processing. The EU AI Act regulates AI systems through risk-based duties. A deployment may be subject to both regimes.",
    autoScore: "hoch",
    humanScore: "hoch",
    driftFlag: false,
    note: "Automated and human ratings agree; the answer is concise and distinguishes the two regulatory scopes.",
  },
  {
    id: "r2",
    prompt: "How long does a contract continue after a cancellation deadline?",
    output:
      "Without specific contract terms, a German contract generally renews for its original duration unless one party objects.",
    autoScore: "mittel",
    humanScore: "niedrig",
    driftFlag: false,
    note: "The automated check rates fluency and length, not legal accuracy. The statement is overgeneralized and requires legal review.",
  },
  {
    id: "r3",
    prompt: "Which risk category applies to an AI customer-support chatbot?",
    output:
      "A general support chatbot may have transparency duties. Its classification depends on purpose and context; credit or medical uses require a separate assessment.",
    autoScore: "hoch",
    humanScore: null,
    driftFlag: true,
    note: "The seeded drift flag marks a change from the prior baseline. It does not identify a cause or a live model change.",
  },
  {
    id: "r4",
    prompt: "Describe how a multi-agent system divides work.",
    output:
      "An orchestrator delegates research, analysis, and editing tasks to specialist agents, then combines their outputs.",
    autoScore: "hoch",
    humanScore: "mittel",
    driftFlag: false,
    note: "The reviewer marks missing error handling, source checks, and propagation risk despite the high automated score.",
  },
];

// Fixed, non-theme-reactive pairings — this engine renders a constant light
// workbench surface regardless of site theme (matching every sibling DEMO.*
// engine), so status colors are literal hex, not CSS custom properties.
const SCORE_COLORS: Readonly<
  Record<"hoch" | "mittel" | "niedrig", { fg: string; bg: string }>
> = {
  hoch: { fg: "#166534", bg: "#dcfce7" },
  mittel: { fg: "#78350f", bg: "rgba(120,53,15,0.12)" },
  niedrig: { fg: "#991b1b", bg: "rgba(153,27,27,0.1)" },
};

const SCORE_LABELS: Readonly<Record<"hoch" | "mittel" | "niedrig", string>> = {
  hoch: "HOCH",
  mittel: "MITTEL",
  niedrig: "NIEDRIG",
};

function ScoreChip({
  score,
  label,
  locale,
}: {
  readonly score: "hoch" | "mittel" | "niedrig";
  readonly label: string;
  readonly locale: Locale;
}): JSX.Element {
  const c = SCORE_COLORS[score];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: `1px solid ${c.fg}`,
        background: c.bg,
        color: c.fg,
        padding: "2px 8px",
        fontFamily: DEMO.font.mono,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      {label}:{" "}
      {locale === "de"
        ? SCORE_LABELS[score]
        : ({ hoch: "HIGH", mittel: "MEDIUM", niedrig: "LOW" } as const)[score]}
    </span>
  );
}

export function LlmObservabilityDemo(): JSX.Element {
  const { locale, text } = useDemoLocale();
  const rows = locale === "de" ? EVAL_ROWS : ENGLISH_EVAL_ROWS;
  const [selectedId, setSelectedId] = useState<string>(rows[0].id);
  const [showFailureBeat, setShowFailureBeat] = useState(false);

  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];

  // Failure-mode beat: Row r2 and r4 show Auto/Human divergence.
  // The explicit failure beat focuses on r3 (drift) and r4 (human disagrees with high auto-score).
  const divergenceRows = rows.filter(
    (r) => r.humanScore !== null && r.humanScore !== r.autoScore,
  );

  return (
    <div
      data-demo-id="llm-observability"
      role="region"
      aria-label={text(
        "LLM-Qualitätsmessung Praxisbeispiel",
        "LLM quality measurement practice example",
      )}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
        minHeight: DEMO_HEIGHT,
        width: "100%",
        minWidth: 0,
      }}
    >
      <style>{`
        [data-demo-id="llm-observability"] .demo-llmobs-kpis {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        @media (min-width: 640px) {
          [data-demo-id="llm-observability"] .demo-llmobs-kpis {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (min-width: 768px) {
          [data-demo-id="llm-observability"] .demo-llmobs-kpis {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
      `}</style>

      {/* Summary KPIs */}
      <div className="demo-llmobs-kpis">
        {(
          [
            {
              label: text("Eval-Läufe (Beispiel)", "Evaluation runs (sample)"),
              value: "4",
              sub: text("Seed-Szenarien", "Seeded scenarios"),
              accent: false,
            },
            {
              label: text("Drift-Ereignisse", "Drift flags"),
              value: "1",
              sub: text("Flagge gesetzt", "One flag set"),
              accent: true,
            },
            {
              label: text(
                "Auto/Mensch Abweichung",
                "Automated/human mismatch",
              ),
              value: "2",
              sub: text("von 3 bewertet", "of 3 reviewed"),
              accent: true,
            },
            {
              label: text("Ø Auto-Score", "Average automated rating"),
              value: text("hoch", "high"),
              sub: text("3× hoch, 1× mittel", "3 high, 1 medium"),
              accent: false,
            },
          ] as const
        ).map(({ label, value, sub, accent }) => (
          <div
            key={label}
            style={{
              minWidth: 0,
              border: `1px solid ${DEMO.leinen}`,
              borderLeft: `3px solid ${accent ? DEMO.statusAmber : DEMO.schiefer}`,
              background: DEMO.birke,
              padding: 14,
            }}
          >
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: DEMO.schiefer,
              }}
            >
              {label}
            </div>
            <div
              style={{
                marginTop: 4,
                fontFamily: DEMO.font.mono,
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: DEMO.ink,
              }}
            >
              {value}
            </div>
            <div
              style={{
                marginTop: 4,
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
              }}
            >
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Eval row picker */}
      <div>
        <div
          style={{
            marginBottom: 8,
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "var(--color-brand-orange)",
          }}
        >
          {text("Eval-Szenarien (Beispiele)", "Evaluation scenarios (samples)")}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map((row) => {
            const active = selectedId === row.id;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                aria-pressed={active}
                style={{
                  display: "flex",
                  minHeight: 44,
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                  border: `1px solid ${active ? "var(--color-brand-orange)" : DEMO.leinen}`,
                  background: active ? DEMO.ink : DEMO.birke,
                  color: active ? DEMO.kalk : DEMO.ink,
                  padding: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "background-color 120ms, border-color 120ms",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      overflowWrap: "anywhere",
                      fontSize: 12,
                      fontWeight: 700,
                      lineHeight: 1.35,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {row.prompt}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexShrink: 0,
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                  }}
                >
                  {row.driftFlag && (
                    <span
                      style={{
                        border: `1px solid ${DEMO.statusAmber}`,
                        background: "rgba(234,179,8,0.12)",
                        color: DEMO.statusAmber,
                        padding: "1px 6px",
                        fontFamily: DEMO.font.mono,
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      DRIFT
                    </span>
                  )}
                  {row.humanScore !== null &&
                    row.humanScore !== row.autoScore && (
                      <span
                        style={{
                          border: `1px solid ${DEMO.statusRed}`,
                          background: "rgba(239,68,68,0.12)",
                          color: DEMO.statusRed,
                          padding: "1px 6px",
                          fontFamily: DEMO.font.mono,
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {text("DIVERGENZ", "MISMATCH")}
                      </span>
                    )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected row detail */}
      <div
        style={{
          border: `1px solid ${DEMO.leinen}`,
          background: DEMO.birke,
          padding: 16,
        }}
      >
        <div
          style={{
            fontFamily: DEMO.font.mono,
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: DEMO.schiefer,
          }}
        >
          {text("Beispiel-Output", "Sample output")}
        </div>
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            lineHeight: 1.7,
            color: DEMO.ink,
          }}
        >
          {selected.output}
        </p>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <ScoreChip
            score={selected.autoScore}
            label={text("Auto-Eval", "Automated evaluation")}
            locale={locale}
          />
          {selected.humanScore !== null ? (
            <ScoreChip
              score={selected.humanScore}
              label={text("Mensch", "Human review")}
              locale={locale}
            />
          ) : (
            <span
              style={{
                border: `1px solid ${DEMO.leinen}`,
                padding: "2px 8px",
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: DEMO.schiefer,
              }}
            >
              {text("Mensch: ausstehend", "Human review: pending")}
            </span>
          )}
          {selected.driftFlag && (
            <span
              style={{
                border: `1px solid ${DEMO.statusAmber}`,
                background: "rgba(234,179,8,0.12)",
                color: DEMO.statusAmber,
                padding: "2px 8px",
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {text("DRIFT-INDIKATOR AKTIV", "DRIFT FLAG ACTIVE")}
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 12,
            borderLeft: `2px solid ${DEMO.leinen}`,
            background: "rgba(11,9,8,0.03)",
            padding: 12,
          }}
        >
          <p style={{ fontSize: 12, lineHeight: 1.6, color: DEMO.schiefer }}>
            {selected.note}
          </p>
        </div>
      </div>

      {/* Failure-mode beat */}
      <div
        style={{
          border: `1px solid ${DEMO.leinen}`,
          background: "rgba(11,9,8,0.02)",
          padding: 16,
        }}
      >
        <button
          type="button"
          onClick={() => setShowFailureBeat((v) => !v)}
          aria-expanded={showFailureBeat}
          style={
            {
              all: "unset",
              display: "block",
              minHeight: 44,
              width: "100%",
              cursor: "pointer",
              boxSizing: "border-box",
            } as CSSProperties
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div
              style={{
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "var(--color-brand-orange)",
              }}
            >
              {text(
                "Grenzfall: Was passiert, wenn Auto-Eval und Mensch sich widersprechen?",
                "Boundary case: what happens when automated and human ratings disagree?",
              )}
            </div>
            <span
              aria-hidden="true"
              style={{
                flexShrink: 0,
                fontFamily: DEMO.font.mono,
                fontSize: 12,
                color: DEMO.schiefer,
              }}
            >
              {showFailureBeat ? "▲" : "▼"}
            </span>
          </div>
        </button>
        {showFailureBeat && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p style={{ fontSize: 13, lineHeight: 1.6, color: DEMO.ink }}>
              {locale === "de"
                ? `In ${divergenceRows.length} von ${rows.filter((r) => r.humanScore !== null).length} bewerteten Beispielen widerspricht die menschliche Einschätzung dem automatischen Score:`
                : `Human review disagrees with the automated score in ${divergenceRows.length} of ${rows.filter((r) => r.humanScore !== null).length} reviewed examples:`}
            </p>
            {divergenceRows.map((row) => (
              <div
                key={row.id}
                style={{
                  border: "1px solid rgba(153,27,27,0.3)",
                  background: "rgba(153,27,27,0.05)",
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: DEMO.ink }}>
                  {row.prompt}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <ScoreChip
                    score={row.autoScore}
                    label={text("Auto-Eval", "Automated evaluation")}
                    locale={locale}
                  />
                  {row.humanScore && (
                    <ScoreChip
                      score={row.humanScore}
                      label={text("Mensch", "Human review")}
                      locale={locale}
                    />
                  )}
                </div>
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: DEMO.schiefer,
                  }}
                >
                  {row.note}
                </p>
              </div>
            ))}
            <div
              style={{
                borderLeft: "2px solid var(--color-brand-orange)",
                background: "rgba(249,115,22,0.05)",
                padding: 12,
              }}
            >
              <p style={{ fontSize: 12, lineHeight: 1.6, color: DEMO.ink }}>
                <strong>{text("Lernpunkt:", "Learning point:")}</strong>{" "}
                {text(
                  "Automatische Eval-Scores messen Fluenz, Länge und Muster. Sie erfassen keine Rechtsgenauigkeit, Sicherheitsrisiken oder fachliche Tiefe. Produktionssysteme brauchen einen menschlichen Review-Zyklus.",
                  "Automated scores measure fluency, length, and patterns. They do not establish legal accuracy, safety, or subject-matter depth. Production systems need a human review cycle.",
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LlmObservabilityDemo;
