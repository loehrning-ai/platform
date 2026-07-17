"use client";

import { useState, type JSX } from "react";
import { cn } from "@/lib/utils";
import { SimulationDisclosure } from "./evidence-badge";

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
}: {
  readonly score: "hoch" | "mittel" | "niedrig";
  readonly label: string;
}): JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em]",
        SCORE_COLORS[score],
      )}
    >
      {label}: {SCORE_LABELS[score]}
    </span>
  );
}

export function LlmObservabilityDemo(): JSX.Element {
  const [selectedId, setSelectedId] = useState<string>(EVAL_ROWS[0].id);
  const [showFailureBeat, setShowFailureBeat] = useState(false);

  const selected = EVAL_ROWS.find((r) => r.id === selectedId) ?? EVAL_ROWS[0];

  // Failure-mode beat: Row r2 and r4 show Auto/Human divergence.
  // The explicit failure beat focuses on r3 (drift) and r4 (human disagrees with high auto-score).
  const divergenceRows = EVAL_ROWS.filter(
    (r) => r.humanScore !== null && r.humanScore !== r.autoScore,
  );

  return (
    <div
      className="flex flex-col gap-5"
      role="region"
      aria-label="LLM-Qualitätsmessung Praxisbeispiel"
    >
      <SimulationDisclosure>
        Dieses Praxisbeispiel zeigt keine Live-Telemetrie, alle Eval-Scores und Drift-Indikatoren sind feste Beispiel-Szenarien zur Veranschaulichung von Eval-Konzepten.
      </SimulationDisclosure>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          {
            label: "Eval-Läufe (Beispiel)",
            value: "4",
            sub: "Seed-Szenarien",
            accent: false,
          },
          {
            label: "Drift-Ereignisse",
            value: "1",
            sub: "Flagge gesetzt",
            accent: true,
          },
          {
            label: "Auto/Mensch Abweichung",
            value: "2",
            sub: "von 3 bewertet",
            accent: true,
          },
          {
            label: "Ø Auto-Score",
            value: "hoch",
            sub: "3× hoch, 1× mittel",
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
            <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 font-mono text-[20px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
              {value}
            </div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>

      {/* Eval row picker */}
      <div>
        <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
          Eval-Szenarien (Beispiele)
        </div>
        <div className="flex flex-col gap-1.5">
          {EVAL_ROWS.map((row) => {
            const active = selectedId === row.id;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-start justify-between gap-3 border p-3 text-left transition-colors",
                  active
                    ? "border-brand-orange bg-foreground text-background"
                    : "border-border bg-card/60 text-foreground hover:border-foreground",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-bold leading-[1.2] tracking-[-0.01em]">
                    {row.prompt}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {row.driftFlag && (
                    <span className="border border-brand-amber bg-brand-amber/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-brand-amber">
                      DRIFT
                    </span>
                  )}
                  {row.humanScore !== null && row.humanScore !== row.autoScore && (
                    <span className="border border-destructive bg-destructive/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-destructive">
                      DIVERGENZ
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
        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Beispiel-Output
        </div>
        <p className="mt-2 text-[13px] leading-[1.7] text-foreground">{selected.output}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ScoreChip score={selected.autoScore} label="Auto-Eval" />
          {selected.humanScore !== null ? (
            <ScoreChip score={selected.humanScore} label="Mensch" />
          ) : (
            <span className="border border-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              Mensch: ausstehend
            </span>
          )}
          {selected.driftFlag && (
            <span className="border border-brand-amber bg-brand-amber/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-brand-amber">
              DRIFT-INDIKATOR AKTIV
            </span>
          )}
        </div>
        <div className="mt-3 border-l-2 border-border bg-card/30 p-3">
          <p className="text-[12px] leading-[1.6] text-muted-foreground">{selected.note}</p>
        </div>
      </div>

      {/* Failure-mode beat */}
      <div className="border border-border bg-card/10 p-4">
        <button
          type="button"
          onClick={() => setShowFailureBeat((v) => !v)}
          className="w-full text-left"
          aria-expanded={showFailureBeat}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              Grenzfall: Was passiert, wenn Auto-Eval und Mensch sich widersprechen?
            </div>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground" aria-hidden="true">
              {showFailureBeat ? "▲" : "▼"}
            </span>
          </div>
        </button>
        {showFailureBeat && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-[13px] leading-[1.6] text-foreground">
              In {divergenceRows.length} von {EVAL_ROWS.filter((r) => r.humanScore !== null).length} bewerteten Szenarien (Beispiel) widerspricht die menschliche Einschätzung dem automatischen Score:
            </p>
            {divergenceRows.map((row) => (
              <div key={row.id} className="border border-destructive/30 bg-destructive/5 p-3">
                <div className="text-[12px] font-bold text-foreground">{row.prompt}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <ScoreChip score={row.autoScore} label="Auto-Eval" />
                  {row.humanScore && <ScoreChip score={row.humanScore} label="Mensch" />}
                </div>
                <p className="mt-2 text-[12px] leading-[1.5] text-muted-foreground">
                  {row.note}
                </p>
              </div>
            ))}
            <div className="border-l-2 border-brand-orange bg-brand-orange/5 p-3">
              <p className="text-[12px] leading-[1.6] text-foreground">
                <strong>Lernpunkt:</strong> Automatische Eval-Scores messen Fluenz, Länge und Muster, sie erfassen keine Rechtsgenauigkeit, Sicherheitsrisiken oder fachliche Tiefe. Produktionssysteme brauchen einen menschlichen Review-Zyklus, nicht nur automatische Metriken.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LlmObservabilityDemo;
