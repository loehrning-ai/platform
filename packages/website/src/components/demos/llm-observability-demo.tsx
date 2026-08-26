"use client";

import { useState, type JSX } from "react";
import { cn } from "@/lib/utils";
import { SimulationDisclosure } from "./evidence-badge";
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

const SCORE_COLORS: Readonly<Record<"hoch" | "mittel" | "niedrig", string>> = {
  hoch: "text-[#166534] border-[#166534] bg-[#dcfce7]",
  mittel: "text-brand-amber border-brand-amber bg-brand-amber/10",
  niedrig: "text-destructive border-destructive bg-destructive/10",
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
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.1em]",
        SCORE_COLORS[score],
      )}
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
      className="flex flex-col gap-5"
      role="region"
      aria-label={text(
        "LLM-Qualitätsmessung Praxisbeispiel",
        "LLM quality measurement practice example",
      )}
    >
      <SimulationDisclosure>
        {text(
          "Dieses Praxisbeispiel zeigt keine Live-Telemetrie. Alle Eval-Scores und Drift-Indikatoren sind feste Beispieldaten.",
          "This example shows no live telemetry. All evaluation scores and drift indicators are fixed sample data.",
        )}
      </SimulationDisclosure>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
        {[
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
            label: text("Auto/Mensch Abweichung", "Automated/human mismatch"),
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
        ].map(({ label, value, sub, accent }) => (
          <div
            key={label}
            className={cn(
              "border border-l-[3px] bg-background p-3.5",
              accent ? "border-l-brand-amber" : "border-l-foreground/30",
            )}
          >
            <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 font-mono text-[20px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
              {value}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Eval row picker */}
      <div>
        <div className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
          {text("Eval-Szenarien (Beispiele)", "Evaluation scenarios (samples)")}
        </div>
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => {
            const active = selectedId === row.id;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-11 items-start justify-between gap-3 border p-3 text-left transition-colors",
                  active
                    ? "border-brand-orange bg-foreground text-background"
                    : "border-border bg-card/60 text-foreground hover:border-foreground",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="break-words text-[12px] font-bold leading-[1.35] tracking-[-0.01em]">
                    {row.prompt}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {row.driftFlag && (
                    <span className="border border-brand-amber bg-brand-amber/10 px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-amber">
                      DRIFT
                    </span>
                  )}
                  {row.humanScore !== null &&
                    row.humanScore !== row.autoScore && (
                      <span className="border border-destructive bg-destructive/10 px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-destructive">
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
      <div className="border border-border bg-background p-4">
        <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {text("Beispiel-Output", "Sample output")}
        </div>
        <p className="mt-2 text-[13px] leading-[1.7] text-foreground">
          {selected.output}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
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
            <span className="border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              {text("Mensch: ausstehend", "Human review: pending")}
            </span>
          )}
          {selected.driftFlag && (
            <span className="border border-brand-amber bg-brand-amber/10 px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-amber">
              {text("DRIFT-INDIKATOR AKTIV", "DRIFT FLAG ACTIVE")}
            </span>
          )}
        </div>
        <div className="mt-3 border-l-2 border-border bg-card/30 p-3">
          <p className="text-[12px] leading-[1.6] text-muted-foreground">
            {selected.note}
          </p>
        </div>
      </div>

      {/* Failure-mode beat */}
      <div className="border border-border bg-card/10 p-4">
        <button
          type="button"
          onClick={() => setShowFailureBeat((v) => !v)}
          className="min-h-11 w-full text-left"
          aria-expanded={showFailureBeat}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              {text(
                "Grenzfall: Was passiert, wenn Auto-Eval und Mensch sich widersprechen?",
                "Boundary case: what happens when automated and human ratings disagree?",
              )}
            </div>
            <span
              className="shrink-0 font-mono text-xs text-muted-foreground"
              aria-hidden="true"
            >
              {showFailureBeat ? "▲" : "▼"}
            </span>
          </div>
        </button>
        {showFailureBeat && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-[13px] leading-[1.6] text-foreground">
              {locale === "de"
                ? `In ${divergenceRows.length} von ${rows.filter((r) => r.humanScore !== null).length} bewerteten Beispielen widerspricht die menschliche Einschätzung dem automatischen Score:`
                : `Human review disagrees with the automated score in ${divergenceRows.length} of ${rows.filter((r) => r.humanScore !== null).length} reviewed examples:`}
            </p>
            {divergenceRows.map((row) => (
              <div
                key={row.id}
                className="border border-destructive/30 bg-destructive/5 p-3"
              >
                <div className="text-[12px] font-bold text-foreground">
                  {row.prompt}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
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
                <p className="mt-2 text-[12px] leading-[1.5] text-muted-foreground">
                  {row.note}
                </p>
              </div>
            ))}
            <div className="border-l-2 border-brand-orange bg-brand-orange/5 p-3">
              <p className="text-[12px] leading-[1.6] text-foreground">
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
