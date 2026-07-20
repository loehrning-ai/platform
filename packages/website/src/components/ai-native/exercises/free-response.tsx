"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  ExerciseShell,
  ExerciseResetButton,
  submitExercise,
} from "./_shell";
import type { ModuleId } from "@/lib/ai-native/types";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/**
 * Free-response exercise — single long-form textarea graded entirely by
 * Claude Haiku against an authored rubric. No rule-based grader; if the
 * AI endpoint is unavailable the exercise marks completed with a null
 * score + honest "AI gerade nicht verfügbar" summary.
 *
 * Draft persistence: sessionStorage (not localStorage — free-response
 * text is PII per the §3 privacy constraint).
 */

export interface FreeResponseRubricItem {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

export interface FreeResponseSpec {
  readonly exerciseId: string;
  readonly lessonId: string;
  readonly moduleId: ModuleId;
  readonly title: string;
  readonly scenario: string;
  readonly rubric: readonly FreeResponseRubricItem[];
  readonly maxLength?: number;
  readonly passThreshold?: number;
  readonly placeholder?: string;
}

interface ApiResponse {
  readonly score: number;
  readonly rubric: ReadonlyArray<{
    readonly id: string;
    readonly passed: boolean;
    readonly rationale: string;
  }>;
  readonly summary: string;
  readonly cached?: boolean;
}

export function FreeResponseExercise(props: FreeResponseSpec): JSX.Element {
  return (
    <ExerciseShell
      moduleId={props.moduleId}
      lessonId={props.lessonId}
      exerciseId={props.exerciseId}
      kind="exercise-free-response"
      title={props.title}
      scenario={props.scenario}
    >
      <FreeResponseBody {...props} />
    </ExerciseShell>
  );
}

function FreeResponseBody({
  exerciseId,
  lessonId,
  moduleId,
  rubric,
  maxLength = 2000,
  passThreshold = 0.6,
  placeholder,
}: FreeResponseSpec): JSX.Element {
  const storageKey = `ai-native-exercise-draft-${lessonId}-${exerciseId}`;
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw !== null) setDraft(raw);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

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

  const saveDraft = () => {
    try {
      sessionStorage.setItem(storageKey, draft);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async () => {
    saveDraft();
    setGrading(true);
    setUnavailable(false);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/ai-native/grade-exercise", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "exercise-free-response",
          lessonId,
          exerciseId,
          userInput: draft,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as ApiResponse;
      setResult(data);
      setSubmitted(true);
      submitExercise({
        moduleId,
        lessonId,
        exerciseId,
        kind: "exercise-free-response",
        score: data.score,
        aiFeedback: data.rubric,
        summary: data.summary,
        gradingSource: "ai",
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      // No fallback grader for free-response; mark completed with null score.
      setUnavailable(true);
      setSubmitted(true);
      submitExercise({
        moduleId,
        lessonId,
        exerciseId,
        kind: "exercise-free-response",
        score: null,
        summary: "AI-Bewertung gerade nicht verfügbar. Versuch's später nochmal.",
        gradingSource: "fallback",
      });
    } finally {
      setGrading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setResult(null);
    setUnavailable(false);
    setDraft("");
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  };

  const passed = result != null && result.score >= passThreshold;

  return (
    <div>
      <label
        htmlFor={`${exerciseId}-textarea`}
        className="mb-2 block font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
      >
        Deine Antwort
      </label>
      <textarea
        id={`${exerciseId}-textarea`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={saveDraft}
        maxLength={maxLength}
        rows={9}
        disabled={submitted || grading}
        placeholder={placeholder ?? "Schreib deine Antwort hier …"}
        className={cn(
          "w-full resize-y border border-border bg-background p-3.5 font-mono text-[13px] leading-[1.6] text-foreground outline-none",
          submitted || grading
            ? "cursor-not-allowed opacity-80"
            : "focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange",
        )}
      />
      <div className="mt-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        <span>
          {draft.length} / {maxLength}
        </span>
        {submitted && result != null && (
          <span className={passed ? "text-[#22c55e]" : "text-brand-amber"}>
            Score {Math.round(result.score * 100)}% ·{" "}
            {passed ? "Passed" : "Review"}
          </span>
        )}
      </div>

      {/* Rubric feedback panel */}
      <AnimatePresence>
        {submitted && result != null && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="mt-4 space-y-3"
          >
            <div
              className={cn(
                "border-l-[3px] px-4 py-3",
                passed
                  ? "border-[#22c55e] bg-[#22c55e]/5"
                  : "border-brand-amber bg-brand-amber/5",
              )}
            >
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-foreground">
                AI-Zusammenfassung
              </p>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-foreground">
                {result.summary}
              </p>
            </div>
            <ul className="space-y-1.5">
              {result.rubric.map((entry) => {
                const spec = rubric.find((r) => r.id === entry.id);
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
                      <span className="mt-1 block text-[12.5px] text-muted-foreground">
                        {entry.rationale}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {result.cached && (
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Cache-Hit · identische Eingabe
              </p>
            )}
          </m.div>
        )}
        {submitted && unavailable && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className="mt-4 border-l-[3px] border-brand-amber bg-brand-amber/5 px-4 py-3"
          >
            <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-amber">
              AI-Bewertung nicht verfügbar
            </p>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-foreground">
              Deine Antwort ist gespeichert, die Bewertung kommt beim
              nächsten Versuch automatisch.
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
            disabled={draft.trim().length < 20 || grading}
            className={cn(
              "inline-flex items-center gap-1.5 border-2 border-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-[background-color,border-color,color,opacity,transform,box-shadow]",
              draft.trim().length < 20 || grading
                ? "cursor-not-allowed bg-muted-foreground opacity-60"
                : "bg-brand-orange shadow-[3px_3px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]",
            )}
          >
            {grading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                AI bewertet …
              </>
            ) : (
              "Antwort einreichen"
            )}
          </button>
        ) : (
          <ExerciseResetButton onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
