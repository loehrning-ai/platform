"use client";

import { useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  ExerciseShell,
  ExerciseResetButton,
  submitExercise,
} from "./_shell";
import type { ModuleId } from "@/lib/ai-native/types";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useDemoLocale } from "@/components/demos/demo-locale";

/**
 * Prompt-Diff-Triage — 3 prompts side-by-side, user picks the best one,
 * reveals authored critique for each. Score is binary (1 for correct choice,
 * 0 otherwise).
 *
 * Pure grading.
 * See: AI-native lesson system.
 */

export interface PromptCandidate {
  readonly label: string;
  readonly prompt: string;
  readonly critique: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
}

export interface PromptDiffSpec {
  readonly exerciseId: string;
  readonly lessonId: string;
  readonly moduleId: ModuleId;
  readonly title: string;
  readonly scenario: string;
  /** Exactly 3 candidates; exactly one should have the highest rating. */
  readonly candidates: readonly [PromptCandidate, PromptCandidate, PromptCandidate];
}

function bestIndex(
  candidates: readonly PromptCandidate[],
): number {
  let best = 0;
  let max = candidates[0]?.rating ?? 0;
  candidates.forEach((c, i) => {
    if (c.rating > max) {
      max = c.rating;
      best = i;
    }
  });
  return best;
}

export function PromptDiffExercise(props: PromptDiffSpec): JSX.Element {
  return (
    <ExerciseShell
      moduleId={props.moduleId}
      lessonId={props.lessonId}
      exerciseId={props.exerciseId}
      kind="exercise-prompt-diff"
      title={props.title}
      scenario={props.scenario}
    >
      <PromptDiffBody {...props} />
    </ExerciseShell>
  );
}

function PromptDiffBody({
  exerciseId,
  lessonId,
  moduleId,
  candidates,
}: PromptDiffSpec): JSX.Element {
  const { text } = useDemoLocale();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correctIdx = bestIndex(candidates);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    submitExercise({
      moduleId,
      lessonId,
      exerciseId,
      kind: "exercise-prompt-diff",
      score: selected === correctIdx ? 1 : 0,
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setSelected(null);
  };

  const correct = selected === correctIdx;

  return (
    <div>
      <p className="mb-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {text(
          "Welcher Prompt ist am besten? Wähle einen aus.",
          "Which prompt is strongest? Select one.",
        )}
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {candidates.map((c, i) => {
          const isSelected = selected === i;
          const isCorrect = submitted && i === correctIdx;
          const isWrongPick = submitted && isSelected && i !== correctIdx;
          return (
            <button
              key={i}
              type="button"
              onClick={() => !submitted && setSelected(i)}
              disabled={submitted}
              aria-pressed={isSelected}
              className={cn(
                "flex h-full flex-col border p-4 text-left transition-[background-color,border-color,opacity,transform,box-shadow]",
                submitted
                  ? isCorrect
                    ? "border-risk-green border-t-[3px] border-t-risk-green bg-risk-green/5"
                    : isWrongPick
                      ? "border-destructive border-t-[3px] border-t-destructive bg-destructive/5"
                      : "border-border bg-card/40 opacity-60"
                  : isSelected
                    ? "border-brand-orange border-t-[3px] border-t-brand-orange bg-brand-orange/5"
                    : "border-border bg-card/40 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-foreground hover:shadow-[3px_3px_0_0_var(--color-foreground)]",
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  Option {String.fromCharCode(65 + i)}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {c.label}
                </span>
              </div>
              <pre className="flex-1 whitespace-pre-wrap break-words font-mono text-[12px] leading-[1.55] text-foreground">
                {c.prompt}
              </pre>
              {submitted && (
                <m.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                  className="mt-3 border-t border-dashed border-border pt-2"
                >
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-brand-amber">
                    {text("Kritik", "Critique")}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-[1.5] text-muted-foreground">
                    {c.critique}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <span
                        key={r}
                        className={cn(
                          "h-1 w-4",
                          r <= c.rating ? "bg-brand-orange" : "bg-border",
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </m.div>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {submitted && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className={cn(
              "mt-4 border-l-[3px] px-4 py-3",
              correct ? "border-risk-green bg-risk-green/5" : "border-brand-amber bg-brand-amber/5",
            )}
          >
            <div className="flex items-center gap-2">
              {correct ? (
                <CheckCircle2 size={16} className="text-risk-green" />
              ) : (
                <XCircle size={16} className="text-brand-amber" />
              )}
              <p
                className={cn(
                  "font-mono text-[11px] font-bold uppercase tracking-[0.14em]",
                  correct ? "text-risk-green" : "text-brand-amber",
                )}
              >
                {correct
                  ? text(
                      `Richtig erkannt: Option ${String.fromCharCode(65 + correctIdx)}`,
                      `Correct: option ${String.fromCharCode(65 + correctIdx)}`,
                    )
                  : text(
                      `Option ${String.fromCharCode(65 + correctIdx)} wäre die beste Wahl`,
                      `Option ${String.fromCharCode(65 + correctIdx)} is the strongest choice`,
                    )}
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected === null}
            className={cn(
              "inline-flex items-center gap-1.5 border-2 border-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-[background-color,border-color,color,opacity,transform,box-shadow]",
              selected === null
                ? "cursor-not-allowed bg-muted-foreground opacity-60"
                : "bg-brand-orange shadow-[3px_3px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]",
            )}
          >
            {text("Prüfen", "Evaluate")}
          </button>
        ) : (
          <ExerciseResetButton onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

export { bestIndex };
