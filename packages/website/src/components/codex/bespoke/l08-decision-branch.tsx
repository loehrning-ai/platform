"use client";

import { useState, type JSX } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L08 bespoke interactive — "Decision branch".
 * Ported from `codex/js/lessons/L08.js` (functional parity; the source's
 * animated SVG tree with clickable branches is simplified to plain choice
 * buttons — the graded interaction is picking the right move for each
 * scenario, not the tree-drawing chrome).
 *
 * Three PR scenarios, each with a correct decision (nudge / re-spec /
 * rewrite). Picking correctly advances to the next unsolved scenario;
 * picking wrong shows the "why not" explanation and lets the learner retry.
 * The checkpoint awards once all three scenarios are resolved correctly.
 */

type Decision = "nudge" | "re-spec" | "rewrite";

interface Scenario {
  readonly correct: Decision;
}

const SCENARIOS: readonly Scenario[] = [
  { correct: "nudge" },
  { correct: "re-spec" },
  { correct: "rewrite" },
];

const DECISIONS: readonly Decision[] = ["nudge", "re-spec", "rewrite"];

const COPY: Record<
  Locale,
  {
    readonly eyebrow: string;
    readonly completeTitle: string;
    readonly completeBody: string;
    readonly solved: string;
    readonly decisions: Readonly<Record<Decision, string>>;
    readonly scenarios: readonly {
      readonly text: string;
      readonly explanation: string;
      readonly wrongExplanation: string;
    }[];
  }
> = {
  en: {
    eyebrow: "◆ Exercise · Revision decision",
    completeTitle: "All revision decisions recorded",
    completeBody: "All scenarios have a documented response.",
    solved: "solved",
    decisions: {
      nudge: "targeted correction",
      "re-spec": "re-spec",
      rewrite: "restart",
    },
    scenarios: [
      {
        text: "The focused check has intermittent failures with different error output across runs.",
        explanation:
          "Correct. Request reproduction, preserve each log, and identify whether the failure predates the diff before changing production code.",
        wrongExplanation:
          "A bounded investigation is appropriate because the task contract is still valid and the immediate question is the source of the intermittent failure.",
      },
      {
        text: "The reported checks pass, but the diff adds an unrelated refactor outside the stated scope.",
        explanation:
          "Correct. Re-state the scope and request a clean diff that excludes the unrelated refactor.",
        wrongExplanation:
          "The result mixes separate decisions. Re-specification restores an explicit review boundary.",
      },
      {
        text: "The PR fundamentally misunderstands the module's purpose.",
        explanation:
          "Correct. Discard the diff, re-establish the module contract from repository evidence, and start a new bounded task.",
        wrongExplanation:
          "A local correction cannot repair a diff built on the wrong module contract. Restart from verified context.",
      },
    ],
  },
  de: {
    eyebrow: "◆ Interaktiv · Entscheidungsbaum",
    completeTitle: "Entscheidungen korrekt eingeordnet",
    completeBody: "Du hast alle drei Situationen richtig bewertet.",
    solved: "gelöst",
    decisions: {
      nudge: "gezielt korrigieren",
      "re-spec": "neu spezifizieren",
      rewrite: "neu starten",
    },
    scenarios: [
      {
        text: "Die fokussierte Prüfung schlägt unregelmäßig mit unterschiedlichen Fehlermeldungen fehl.",
        explanation:
          "Richtig. Reproduktion anfordern, jedes Protokoll sichern und vor Änderungen am Produktivcode klären, ob der Fehler bereits vorher bestand.",
        wrongExplanation:
          "Eine begrenzte Untersuchung passt, weil der Aufgabenvertrag gültig bleibt und zunächst die Fehlerursache belegt werden muss.",
      },
      {
        text: "Die gemeldeten Prüfungen bestehen, aber der Diff enthält ein sachfremdes Refactoring außerhalb des vereinbarten Umfangs.",
        explanation:
          "Richtig. Umfang erneut festlegen und einen bereinigten Diff ohne das sachfremde Refactoring anfordern.",
        wrongExplanation:
          "Das Ergebnis koppelt getrennte Entscheidungen. Eine neue Spezifikation stellt die Review-Grenze wieder her.",
      },
      {
        text: "Der PR verkennt den grundlegenden Zweck des Moduls.",
        explanation:
          "Richtig. Diff verwerfen, den Modulvertrag anhand des Repositorys belegen und einen neuen begrenzten Auftrag starten.",
        wrongExplanation:
          "Eine lokale Korrektur repariert keinen Diff, der auf einem falschen Modulvertrag beruht. Mit belegtem Kontext neu starten.",
      },
    ],
  },
};

interface L08DecisionBranchProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly locale?: Locale;
}

export function L08DecisionBranch({
  lessonId,
  cpId,
  locale = "en",
}: L08DecisionBranchProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const copy = COPY[locale];
  const [index, setIndex] = useState(0);
  const [cleared, setCleared] = useState<ReadonlySet<number>>(() => new Set());
  const [feedback, setFeedback] = useState<{
    readonly correct: boolean;
    readonly text: string;
  } | null>(null);

  const allCleared = cleared.size === SCENARIOS.length;
  const scenario = SCENARIOS[index];

  const choose = (choice: Decision) => {
    if (allCleared) return;
    const isCorrect = choice === scenario.correct;
    if (isCorrect) {
      const next = new Set(cleared);
      next.add(index);
      setCleared(next);
      setFeedback({ correct: true, text: copy.scenarios[index].explanation });
      if (next.size === SCENARIOS.length) {
        complete();
      } else {
        let nextIndex = (index + 1) % SCENARIOS.length;
        while (next.has(nextIndex))
          nextIndex = (nextIndex + 1) % SCENARIOS.length;
        setIndex(nextIndex);
      }
    } else {
      setFeedback({
        correct: false,
        text: copy.scenarios[index].wrongExplanation,
      });
    }
  };

  return (
    <div className="min-w-0 max-w-full border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        {copy.eyebrow}
      </p>
      {allCleared ? (
        <div className="min-w-0 border-2 border-risk-green bg-risk-green/10 p-4 text-center">
          <p className="font-mono text-[14px] font-bold text-risk-green">
            {copy.completeTitle} {done ? "✓" : ""}
          </p>
          <p className="mt-1 font-mono text-[12px] text-muted-foreground">
            {copy.completeBody}
          </p>
        </div>
      ) : (
        <>
          <div className="min-w-0 break-words border-2 border-border bg-background p-3 text-center font-mono text-[13px] text-foreground">
            {copy.scenarios[index].text}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DECISIONS.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => choose(choice)}
                className="min-w-0 break-words border-2 border-border bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-foreground transition-colors hover:border-brand-orange"
              >
                {copy.decisions[choice]}
              </button>
            ))}
          </div>
          {feedback && (
            <p
              className={cn(
                "mt-3 break-words font-mono text-[12px]",
                feedback.correct ? "text-risk-green" : "text-destructive",
              )}
            >
              {feedback.text}
            </p>
          )}
          <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
            {copy.solved}: {cleared.size} / {SCENARIOS.length}
          </p>
        </>
      )}
    </div>
  );
}

export default L08DecisionBranch;
