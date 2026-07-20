"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import {
  ExerciseShell,
  ExerciseResetButton,
  submitExercise,
} from "./_shell";
import { gradeWithAI, type GradeWithAIResult } from "./_ai-grade";
import type { AiRubricEntry, ModuleId } from "@/lib/ai-native/types";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/**
 * Fix-this-prompt — editable textarea + deterministic rubric check.
 *
 * Rubric criteria are substring-presence checks (case-insensitive) with an
 * optional require-list. Grading is pure: same input → same score.
 *
 * Draft persistence: saves on blur + beforeunload to sessionStorage
 * (NOT localStorage — exercise drafts are PII per §3 privacy constraint).
 */

export interface FixPromptCriterion {
  readonly id: string;
  readonly label: string;
  /** Regex source string OR plain substring (case-insensitive). */
  readonly pattern: string;
  readonly regex?: boolean;
}

export interface FixPromptSpec {
  readonly exerciseId: string;
  readonly lessonId: string;
  readonly moduleId: ModuleId;
  readonly title: string;
  readonly scenario: string;
  readonly startingPrompt: string;
  readonly criteria: readonly FixPromptCriterion[];
  /** Minimum pass threshold (0..1). Default 0.6. */
  readonly passThreshold?: number;
}

function gradeFixPrompt(
  draft: string,
  criteria: readonly FixPromptCriterion[],
): { readonly matches: readonly boolean[]; readonly score: number } {
  const lowered = draft.toLowerCase();
  const matches = criteria.map((c) => {
    if (c.regex) {
      try {
        const re = new RegExp(c.pattern, "i");
        return re.test(draft);
      } catch {
        return false;
      }
    }
    return lowered.includes(c.pattern.toLowerCase());
  });
  const hits = matches.filter(Boolean).length;
  const score = criteria.length === 0 ? 0 : hits / criteria.length;
  return { matches, score };
}

export function FixPromptExercise(props: FixPromptSpec): JSX.Element {
  return (
    <ExerciseShell
      moduleId={props.moduleId}
      lessonId={props.lessonId}
      exerciseId={props.exerciseId}
      kind="exercise-fix-prompt"
      title={props.title}
      scenario={props.scenario}
    >
      <FixPromptBody {...props} />
    </ExerciseShell>
  );
}

function FixPromptBody({
  exerciseId,
  lessonId,
  moduleId,
  startingPrompt,
  criteria,
  passThreshold = 0.6,
}: FixPromptSpec): JSX.Element {
  const storageKey = `ai-native-exercise-draft-${lessonId}-${exerciseId}`;
  const [draft, setDraft] = useState(startingPrompt);
  const [submitted, setSubmitted] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [aiResult, setAiResult] = useState<GradeWithAIResult | null>(null);
  const savedDraftRef = useRef<string>(startingPrompt);

  // Load draft from sessionStorage on mount.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw !== null) {
        setDraft(raw);
        savedDraftRef.current = raw;
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // Save on blur + beforeunload.
  useEffect(() => {
    const onBeforeUnload = () => {
      try {
        sessionStorage.setItem(storageKey, draft);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [draft, storageKey]);

  const grading = useMemo(() => gradeFixPrompt(draft, criteria), [draft, criteria]);
  const passed = grading.score >= passThreshold;

  const saveDraft = () => {
    try {
      sessionStorage.setItem(storageKey, draft);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async () => {
    saveDraft();
    setIsGrading(true);

    // Compute fallback from the existing rule-based grader.
    const fallbackRubric: readonly AiRubricEntry[] = criteria.map((c, i) => ({
      id: c.id,
      passed: grading.matches[i] ?? false,
      rationale: c.label,
    }));
    const fallbackSummary = passed
      ? `Regel-basierte Auswertung: ${Math.round(grading.score * 100)} % der Kriterien erfüllt.`
      : `Regel-basierte Auswertung: ${Math.round(grading.score * 100)} %. Nicht alle Pflichtelemente erkannt.`;

    const result = await gradeWithAI({
      kind: "exercise-fix-prompt",
      lessonId,
      exerciseId,
      userInput: draft,
      fallbackScore: grading.score,
      fallbackRubric,
      fallbackSummary,
    });

    setAiResult(result);
    setSubmitted(true);
    setIsGrading(false);
    submitExercise({
      moduleId,
      lessonId,
      exerciseId,
      kind: "exercise-fix-prompt",
      score: result.score,
      aiFeedback: result.rubric,
      summary: result.summary,
      gradingSource: result.source === "ai" ? "ai" : "fallback",
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setAiResult(null);
    setDraft(startingPrompt);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <label
        htmlFor={`${exerciseId}-textarea`}
        className="mb-2 block font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
      >
        Dein Prompt
      </label>
      <textarea
        id={`${exerciseId}-textarea`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={saveDraft}
        maxLength={5000}
        rows={7}
        disabled={submitted || isGrading}
        className={cn(
          "w-full resize-y border border-border bg-background p-3.5 font-mono text-[13px] leading-[1.6] text-foreground outline-none",
          submitted || isGrading
            ? "cursor-not-allowed opacity-80"
            : "focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange",
        )}
      />
      <div className="mt-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        <span>{draft.length} / 5000</span>
        {submitted && aiResult != null && (
          <span className="flex items-center gap-2">
            <span
              className={
                aiResult.score >= passThreshold
                  ? "text-[#22c55e]"
                  : "text-brand-amber"
              }
            >
              Score: {Math.round(aiResult.score * 100)}% ·{" "}
              {aiResult.score >= passThreshold ? "Passed" : "Review"}
            </span>
            {aiResult.source === "ai" ? (
              <span className="inline-flex items-center gap-1 text-brand-orange">
                <Sparkles size={10} /> AI
              </span>
            ) : (
              <span className="text-muted-foreground">Rule-based</span>
            )}
            {aiResult.cached && <span className="text-muted-foreground">· cached</span>}
          </span>
        )}
      </div>

      {/* AI summary + per-criterion rationale */}
      <AnimatePresence>
        {submitted && aiResult != null && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="mt-4 space-y-3"
          >
            <div
              className={cn(
                "border-l-[3px] px-4 py-3",
                aiResult.score >= passThreshold
                  ? "border-[#22c55e] bg-[#22c55e]/5"
                  : "border-brand-amber bg-brand-amber/5",
              )}
            >
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-foreground">
                {aiResult.source === "ai"
                  ? "AI-Zusammenfassung"
                  : "Zusammenfassung"}
              </p>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-foreground">
                {aiResult.summary}
              </p>
            </div>
            <ul className="space-y-1.5">
              {aiResult.rubric.map((entry) => {
                const spec = criteria.find((c) => c.id === entry.id);
                return (
                  <li
                    key={entry.id}
                    className={cn(
                      "flex items-start gap-2.5 border px-3 py-2 text-[13px]",
                      entry.passed
                        ? "border-[#22c55e]/40 bg-[#22c55e]/5"
                        : "border-brand-amber/40 bg-brand-amber/5",
                    )}
                  >
                    {entry.passed ? (
                      <CheckCircle2
                        size={14}
                        className="mt-0.5 shrink-0 text-[#22c55e]"
                      />
                    ) : (
                      <XCircle
                        size={14}
                        className="mt-0.5 shrink-0 text-brand-amber"
                      />
                    )}
                    <div className="flex-1 leading-[1.45]">
                      <span className="font-semibold text-foreground">
                        {spec?.label ?? entry.id}
                      </span>
                      {entry.rationale && entry.rationale !== spec?.label && (
                        <span className="mt-1 block text-[12.5px] text-muted-foreground">
                          {entry.rationale}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </m.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={draft.trim().length < 10 || isGrading}
            className={cn(
              "inline-flex items-center gap-1.5 border-2 border-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-[background-color,border-color,color,opacity,transform,box-shadow]",
              draft.trim().length < 10 || isGrading
                ? "cursor-not-allowed bg-muted-foreground opacity-60"
                : "bg-brand-orange shadow-[3px_3px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]",
            )}
          >
            {isGrading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                AI bewertet …
              </>
            ) : (
              "Prompt prüfen"
            )}
          </button>
        ) : (
          <ExerciseResetButton onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

export { gradeFixPrompt };
