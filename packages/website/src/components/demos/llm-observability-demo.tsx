"use client";

import { useState, type CSSProperties, type JSX } from "react";
import { DEMO } from "@/lib/demo-tokens";

import { DEMO_HEIGHT, useSmUp } from "./demo-utils";
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
    note: "Die automatische Bewertung misst nur Sprachfluss und Länge. Die Aussage ist zu pauschal und braucht eine juristische Prüfung.",
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

/**
 * Status marks on the one-accent palette: a mismatch is the page's Mennige
 * mark (text and a 1px border), drift is ink on a dashed ink border (a
 * warning, not an error), agreement is plain ink on a hairline.
 */
export const LLM_OBS_STATUS = {
  mismatch: { fg: "#b73a15", border: "1px solid #b73a15" },
  drift: { fg: "#121212", border: "1px dashed #121212" },
  neutral: { fg: "#121212", border: "1px solid #E3DFD6" },
} as const;

// Fixed, non-theme-reactive pairings — this engine renders a constant light
// workbench surface regardless of site theme (matching every sibling DEMO.*
// engine), so status colors are literal hex, not CSS custom properties.
const SCORE_COLORS: Readonly<
  Record<"hoch" | "mittel" | "niedrig", { fg: string; bg: string }>
> = {
  // Word on a hairline paper chip: the rating reads from the word, not a
  // traffic-light colour. Ink for high, Schiefer for medium and low.
  hoch: { fg: "#121212", bg: DEMO.kalk },
  mittel: { fg: "#4f4640", bg: DEMO.kalk },
  niedrig: { fg: "#4f4640", bg: DEMO.kalk },
};

const SCORE_LABELS: Readonly<Record<"hoch" | "mittel" | "niedrig", string>> = {
  hoch: "hoch",
  mittel: "mittel",
  niedrig: "niedrig",
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
        ...DEMO.label,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        border: LLM_OBS_STATUS.neutral.border,
        background: c.bg,
        color: c.fg,
        padding: "2px 8px",
      }}
    >
      {label}:{" "}
      {locale === "de"
        ? SCORE_LABELS[score]
        : ({ hoch: "high", mittel: "medium", niedrig: "low" } as const)[score]}
    </span>
  );
}

function OutputPanel({
  row,
  locale,
  text,
  inline = false,
}: {
  readonly row: EvalRow;
  readonly locale: Locale;
  readonly text: (de: string, en: string) => string;
  /** Below sm, under its scenario row: no box, indented past the tick. */
  readonly inline?: boolean;
}): JSX.Element {
  return (
    <div
      data-llmobs-output
      className={inline ? "border-b border-[#E3DFD6] py-3 pl-3" : undefined}
      style={
        inline
          ? undefined
          : {
              border: `1px solid ${DEMO.leinen}`,
              background: DEMO.birke,
              padding: 16,
            }
      }
    >
      <div
        style={{
          ...DEMO.label,
          color: DEMO.schiefer,
        }}
      >
        {text("Beispiel-Output", "Sample output")}
      </div>
      <p
        className={inline ? "text-[14px]" : "text-[13px]"}
        style={{
          marginTop: inline ? 4 : 8,
          lineHeight: 1.6,
          color: DEMO.ink,
        }}
      >
        {row.output}
      </p>
      <div
        style={{
          marginTop: inline ? 10 : 16,
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
        {row.humanScore !== null ? (
          <ScoreChip
            score={row.humanScore}
            label={text("Mensch", "Human review")}
            locale={locale}
          />
        ) : (
          <span
            style={{
              ...DEMO.label,
              border: LLM_OBS_STATUS.neutral.border,
              padding: "2px 8px",
              color: DEMO.schiefer,
            }}
          >
            {text("Mensch: ausstehend", "Human review: pending")}
          </span>
        )}
        {row.driftFlag && (
          <span
            data-llmobs-badge="drift"
            style={{
              ...DEMO.label,
              border: LLM_OBS_STATUS.drift.border,
              background: DEMO.kalk,
              color: LLM_OBS_STATUS.drift.fg,
              padding: "2px 8px",
            }}
          >
            {text("Drift-Indikator aktiv", "Drift flag active")}
          </span>
        )}
      </div>
      <div
        style={{
          marginTop: inline ? 10 : 12,
          borderTop: `1px solid ${DEMO.leinen}`,
          paddingTop: inline ? 10 : 12,
        }}
      >
        <p
          className={inline ? "text-[13px]" : "text-[12px]"}
          style={{ lineHeight: 1.6, color: DEMO.schiefer }}
        >
          {row.note}
        </p>
      </div>
    </div>
  );
}

export function LlmObservabilityDemo(): JSX.Element {
  const { locale, text } = useDemoLocale();
  const rows = locale === "de" ? EVAL_ROWS : ENGLISH_EVAL_ROWS;
  // Opens on the first mismatch (the lead's promise) as the worked example.
  const firstMismatch =
    rows.find((r) => r.humanScore !== null && r.humanScore !== r.autoScore) ??
    rows[0];
  const [selectedId, setSelectedId] = useState<string>(firstMismatch.id);
  // Below sm the output opens inline under the tapped scenario (an
  // accordion); from sm up it keeps its own panel under the list.
  const smUp = useSmUp();
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
      // Tighter rhythm below sm so the scenario list reaches the first screen.
      className="gap-3.5 sm:gap-5"
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: DEMO.font.sans,
        color: DEMO.ink,
        minHeight: DEMO_HEIGHT,
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* Below sm the four KPIs are one caption line, so the scenario list
          and its output reach the first screen; from sm up they are tiles. */}
      <style>{`
        [data-demo-id="llm-observability"] .demo-llmobs-kpis {
          display: none;
        }
        @media (min-width: 640px) {
          [data-demo-id="llm-observability"] .demo-llmobs-kpis {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
          }
          [data-demo-id="llm-observability"] .demo-llmobs-kpis > div {
            padding: 14px;
          }
        }
        @media (min-width: 768px) {
          [data-demo-id="llm-observability"] .demo-llmobs-kpis {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
      `}</style>

      {/* Summary KPIs */}
      <p
        className="text-caption sm:hidden"
        data-llmobs-kpi-line
        style={{ margin: 0, color: DEMO.schiefer, fontVariantNumeric: "tabular-nums" }}
      >
        {text(
          "4 Läufe · 1 Drift · 2 Abweichungen · Ø Auto-Score hoch",
          "4 runs · 1 drift flag · 2 mismatches · average automated rating high",
        )}
      </p>
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
              // The mismatch tile is the row's one mark: an ink frame
              // instead of a coloured left rule.
              border: `1px solid ${accent ? DEMO.ink : DEMO.leinen}`,
              background: DEMO.birke,
            }}
          >
            <div
              style={{
                ...DEMO.label,
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
                letterSpacing: "-0.01em",
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
          className="mb-2 max-sm:mb-0 max-sm:border-b max-sm:border-[#0B0908] max-sm:pb-1.5"
          style={{
            ...DEMO.label,
            color: "var(--color-muted-foreground)",
          }}
        >
          {text("Eval-Szenarien (Beispiele)", "Evaluation scenarios (samples)")}
        </div>
        <div
          className="flex flex-col gap-0 sm:gap-1.5"
          data-llmobs-rows
        >
          {rows.map((row) => {
            const active = selectedId === row.id;
            const mismatch =
              row.humanScore !== null && row.humanScore !== row.autoScore;
            const panelId = `llmobs-output-${row.id}`;
            return (
              <div key={row.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  // An accordion row below sm, a pressed chip from sm up.
                  aria-pressed={smUp ? active : undefined}
                  aria-expanded={smUp ? undefined : active}
                  aria-controls={smUp ? undefined : panelId}
                  data-llmobs-row={row.id}
                  className={[
                    "flex min-h-11 w-full cursor-pointer items-start justify-between gap-3 text-left transition-colors duration-[120ms] motion-reduce:transition-none",
                    "max-sm:border-b max-sm:border-l-2 max-sm:border-b-[#E3DFD6] max-sm:bg-transparent max-sm:py-2.5 max-sm:pl-3 max-sm:pr-0",
                    "sm:border sm:p-3",
                    active
                      ? "text-[#0B0908] max-sm:border-l-[#0B0908] sm:border-[#0B0908] sm:bg-[#0B0908] sm:text-[#F3F0E9]"
                      : "text-[#0B0908] max-sm:border-l-transparent sm:border-[#E3DFD6] sm:bg-[#F7F4ED]",
                  ].join(" ")}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      className="text-[14px] sm:text-[12px]"
                      style={{
                        overflowWrap: "anywhere",
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
                        data-llmobs-badge="drift"
                        className={active ? "sm:border-[#F3F0E9]! sm:text-[#F3F0E9]!" : undefined}
                        style={{
                          ...DEMO.label,
                          border: LLM_OBS_STATUS.drift.border,
                          color: LLM_OBS_STATUS.drift.fg,
                          padding: "1px 6px",
                        }}
                      >
                        Drift
                      </span>
                    )}
                    {mismatch && (
                      <span
                        data-llmobs-badge="mismatch"
                        className={active ? "sm:border-[#F3F0E9]! sm:text-[#F3F0E9]!" : undefined}
                        style={{
                          ...DEMO.label,
                          border: LLM_OBS_STATUS.mismatch.border,
                          color: LLM_OBS_STATUS.mismatch.fg,
                          padding: "1px 6px",
                        }}
                      >
                        {text("Abweichung", "Mismatch")}
                      </span>
                    )}
                  </div>
                </button>
                {!smUp && active ? (
                  <div id={panelId} data-llmobs-inline-output>
                    <OutputPanel row={row} locale={locale} text={text} inline />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected row detail (sm up; below sm it opens inline above) */}
      {smUp ? <OutputPanel row={selected} locale={locale} text={text} /> : null}

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
                ...DEMO.label,
                color: "var(--color-muted-foreground)",
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
              {showFailureBeat ? "−" : "+"}
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
                  border: LLM_OBS_STATUS.mismatch.border,
                  background: "transparent",
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
                borderTop: `2px solid ${DEMO.ink}`,
                paddingTop: 12,
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
