"use client";

import { useMemo, useState, type JSX } from "react";
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

/**
 * PII-Spotter — click tokens in a text passage to flag them as
 * DSGVO-sensitive. Compare against the authored ground-truth PII list.
 * Score = F1 (balance of precision + recall) rounded to 0..1.
 *
 * Pure grading — no Date.now / Math.random.
 *
 * See: AI-native lesson system.
 */

export interface PiiToken {
  /** 0-indexed position in the text's word stream. */
  readonly index: number;
  /** True if this token IS sensitive PII (author ground truth). */
  readonly sensitive: boolean;
}

export interface PiiSpotterSpec {
  readonly exerciseId: string;
  readonly lessonId: string;
  readonly moduleId: ModuleId;
  readonly title: string;
  readonly scenario: string;
  /** Text to tokenize on whitespace. */
  readonly text: string;
  /** Indices (0-based across whitespace-split tokens) that ARE PII. */
  readonly piiIndices: readonly number[];
  /** Pass threshold for the F1 score (0..1). Default 0.7. */
  readonly passThreshold?: number;
}

function tokenize(text: string): readonly string[] {
  return text.split(/(\s+)/);
}

function computeF1(
  selected: ReadonlySet<number>,
  truth: ReadonlySet<number>,
): { readonly precision: number; readonly recall: number; readonly f1: number } {
  if (selected.size === 0 && truth.size === 0) {
    return { precision: 1, recall: 1, f1: 1 };
  }
  let tp = 0;
  selected.forEach((i) => {
    if (truth.has(i)) tp++;
  });
  const precision = selected.size === 0 ? 0 : tp / selected.size;
  const recall = truth.size === 0 ? 0 : tp / truth.size;
  const f1 =
    precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { precision, recall, f1 };
}

export function PiiSpotterExercise(props: PiiSpotterSpec): JSX.Element {
  return (
    <ExerciseShell
      moduleId={props.moduleId}
      lessonId={props.lessonId}
      exerciseId={props.exerciseId}
      kind="exercise-pii-spotter"
      title={props.title}
      scenario={props.scenario}
    >
      <PiiSpotterBody {...props} />
    </ExerciseShell>
  );
}

function PiiSpotterBody({
  exerciseId,
  lessonId,
  moduleId,
  text,
  piiIndices,
  passThreshold = 0.7,
}: PiiSpotterSpec): JSX.Element {
  const tokens = useMemo(() => tokenize(text), [text]);
  const truth = useMemo(() => new Set(piiIndices), [piiIndices]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const onlyWordIndices = useMemo(() => {
    // Tokens are split with alternating word/whitespace; word indices are even (0,2,4,...).
    // But piiIndices is 0-based on WORDS (not word+whitespace). Build a mapping:
    const map: number[] = [];
    tokens.forEach((t, i) => {
      if (!/^\s+$/.test(t) && t.length > 0) map.push(i);
    });
    return map;
  }, [tokens]);

  const toggle = (wordPos: number) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(wordPos)) next.delete(wordPos);
      else next.add(wordPos);
      return next;
    });
  };

  const handleSubmit = () => {
    const { f1 } = computeF1(selected, truth);
    setSubmitted(true);
    submitExercise({
      moduleId,
      lessonId,
      exerciseId,
      kind: "exercise-pii-spotter",
      score: f1,
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setSelected(new Set());
  };

  const { precision, recall, f1 } = submitted
    ? computeF1(selected, truth)
    : { precision: 0, recall: 0, f1: 0 };
  const passed = f1 >= passThreshold;

  return (
    <div>
      <p className="mb-2 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Markiere PII / Geschäftsgeheimnis per Klick
      </p>
      <div className="min-h-[100px] border border-border bg-background p-4 text-[14.5px] leading-[1.9] text-foreground">
        {tokens.map((t, i) => {
          if (/^\s+$/.test(t) || t.length === 0) return <span key={i}>{t}</span>;
          const wordPos = onlyWordIndices.indexOf(i);
          const isSelected = selected.has(wordPos);
          const isTruth = truth.has(wordPos);
          const showFeedback = submitted;
          const correct = isSelected && isTruth;
          const missed = !isSelected && isTruth;
          const falsePositive = isSelected && !isTruth;

          return (
            <span
              key={i}
              onClick={() => toggle(wordPos)}
              role="button"
              tabIndex={submitted ? -1 : 0}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !submitted) {
                  e.preventDefault();
                  toggle(wordPos);
                }
              }}
              className={cn(
                "inline-block cursor-pointer rounded-none px-0.5 transition-colors",
                submitted ? "cursor-default" : "hover:bg-brand-orange/10",
                showFeedback && correct && "bg-[#22c55e]/20 ring-1 ring-[#22c55e]",
                showFeedback && missed && "bg-destructive/20 ring-1 ring-destructive",
                showFeedback && falsePositive && "bg-brand-amber/20 ring-1 ring-brand-amber",
                !showFeedback && isSelected && "bg-brand-orange/20 ring-1 ring-brand-orange",
              )}
              aria-pressed={isSelected}
            >
              {t}
            </span>
          );
        })}
      </div>

      {/* Feedback panel */}
      <AnimatePresence>
        {submitted && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className={cn(
              "mt-4 border-l-[3px] p-4",
              passed ? "border-[#22c55e] bg-[#22c55e]/5" : "border-brand-amber bg-brand-amber/5",
            )}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                {passed ? (
                  <CheckCircle2 size={16} className="text-[#22c55e]" />
                ) : (
                  <XCircle size={16} className="text-brand-amber" />
                )}
                <span
                  className={cn(
                    "font-mono text-[11px] font-bold uppercase tracking-[0.14em]",
                    passed ? "text-[#22c55e]" : "text-brand-amber",
                  )}
                >
                  F1 {Math.round(f1 * 100)}% · {passed ? "Passed" : "Review"}
                </span>
              </div>
              <span className="font-mono text-[10.5px] tracking-[0.1em] text-muted-foreground">
                Precision {Math.round(precision * 100)}% · Recall{" "}
                {Math.round(recall * 100)}%
              </span>
              <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">
                {truth.size} sensible Tokens insgesamt
              </span>
            </div>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-foreground">
              Grün = richtig erkannt · Rot = übersehen · Amber = fälschlicherweise
              markiert.
            </p>
          </m.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
          >
            Prüfen ({selected.size} markiert)
          </button>
        ) : (
          <ExerciseResetButton onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

export { computeF1, tokenize };
