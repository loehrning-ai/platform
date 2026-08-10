"use client";

import { useEffect, useState, type JSX } from "react";
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
import { useDemoLocale } from "@/components/demos/demo-locale";
import {
  getLearningOwnerContext,
  getOwnedSessionLearningItem,
  removeOwnedSessionLearningItem,
  setOwnedSessionLearningItem,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";

/**
 * RCTFC Checklist — fill in Role/Context/Task/Format/Constraints for a
 * scenario, get per-field rubric feedback. RCTFC is the arbeitskurs's core
 * prompt-scaffold vocabulary.
 *
 * Grading: each field checked against minimum-length + optional required
 * keywords. Score = fields-passed / fields-total. Pure.
 *
 * See: AI-native lesson system.
 */

type FieldKey = "role" | "context" | "task" | "format" | "constraints";

function emptyValues(): Record<FieldKey, string> {
  return {
    role: "",
    context: "",
    task: "",
    format: "",
    constraints: "",
  };
}

export interface RctfcFieldCriteria {
  readonly minChars: number;
  /** Optional substring (case-insensitive) that must appear. */
  readonly mustInclude?: string;
  /** Hint shown above the textarea. */
  readonly hint: string;
}

export interface RctfcSpec {
  readonly exerciseId: string;
  readonly lessonId: string;
  readonly moduleId: ModuleId;
  readonly title: string;
  readonly scenario: string;
  readonly criteria: Record<FieldKey, RctfcFieldCriteria>;
}

const FIELD_ORDER: readonly FieldKey[] = [
  "role",
  "context",
  "task",
  "format",
  "constraints",
];

const FIELD_LABELS: Record<FieldKey, string> = {
  role: "Rolle",
  context: "Kontext",
  task: "Aufgabe",
  format: "Format",
  constraints: "Constraints",
};

const FIELD_LABELS_EN: Record<FieldKey, string> = {
  role: "Role",
  context: "Context",
  task: "Task",
  format: "Format",
  constraints: "Constraints",
};

function gradeField(
  value: string,
  spec: RctfcFieldCriteria,
  isEnglish = false,
): { readonly passed: boolean; readonly reason: string } {
  const trimmed = value.trim();
  if (trimmed.length < spec.minChars) {
    return {
      passed: false,
      reason: isEnglish
        ? `Too short (${trimmed.length} / minimum ${spec.minChars} characters).`
        : `Zu kurz (${trimmed.length} / min. ${spec.minChars} Zeichen).`,
    };
  }
  if (spec.mustInclude && !trimmed.toLowerCase().includes(spec.mustInclude.toLowerCase())) {
    return {
      passed: false,
      reason: isEnglish
        ? `Must mention “${spec.mustInclude}”.`
        : `Sollte „${spec.mustInclude}" erwähnen.`,
    };
  }
  return {
    passed: true,
    reason: isEnglish ? "Criterion met." : "Kriterium erfüllt.",
  };
}

export function RctfcChecklistExercise(props: RctfcSpec): JSX.Element {
  return (
    <ExerciseShell
      moduleId={props.moduleId}
      lessonId={props.lessonId}
      exerciseId={props.exerciseId}
      kind="exercise-rctfc-checklist"
      title={props.title}
      scenario={props.scenario}
    >
      <RctfcBody {...props} />
    </ExerciseShell>
  );
}

function RctfcBody({
  exerciseId,
  lessonId,
  moduleId,
  criteria,
}: RctfcSpec): JSX.Element {
  const { locale, text } = useDemoLocale();
  const isEnglish = locale === "en";
  const [values, setValues] =
    useState<Record<FieldKey, string>>(emptyValues);
  const [submitted, setSubmitted] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [aiResult, setAiResult] = useState<GradeWithAIResult | null>(null);
  const [ownerGeneration, setOwnerGeneration] = useState(
    () => getLearningOwnerContext().generation,
  );
  const storageKey = `ai-native-exercise-draft-${lessonId}-${exerciseId}`;

  // Load draft on mount
  useEffect(() => {
    const loadOwnedDraft = () => {
      setOwnerGeneration(getLearningOwnerContext().generation);
      setValues(emptyValues());
      setSubmitted(false);
      setIsGrading(false);
      setAiResult(null);
      try {
        const raw = getOwnedSessionLearningItem(storageKey);
        if (raw) setValues(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    };
    loadOwnedDraft();
    return subscribeLearningOwner(loadOwnedDraft);
  }, [storageKey]);

  const saveDraft = () => {
    setOwnedSessionLearningItem(
      storageKey,
      JSON.stringify(values),
      ownerGeneration,
    );
  };

  const handleSubmit = async () => {
    const ownerGeneration = getLearningOwnerContext().generation;
    saveDraft();
    setIsGrading(true);

    const grades = FIELD_ORDER.map((k) => ({
      key: k,
      ...gradeField(values[k], criteria[k], isEnglish),
    }));
    const passCount = grades.filter((g) => g.passed).length;
    const fallbackScore = passCount / FIELD_ORDER.length;
    const fallbackRubric: readonly AiRubricEntry[] = grades.map((g) => ({
      id: g.key,
      passed: g.passed,
      rationale: g.reason,
    }));
    const fallbackSummary = isEnglish
      ? `Rule-based evaluation: ${passCount}/${FIELD_ORDER.length} fields meet the minimum criteria.`
      : `Regel-basierte Auswertung: ${passCount}/${FIELD_ORDER.length} Felder erfüllen die Mindestkriterien.`;

    const result = await gradeWithAI({
      kind: "exercise-rctfc-checklist",
      lessonId,
      exerciseId,
      userInput: values,
      fallbackScore,
      fallbackRubric,
      fallbackSummary,
    });

    if (getLearningOwnerContext().generation !== ownerGeneration) return;
    setAiResult(result);
    setSubmitted(true);
    setIsGrading(false);
    submitExercise({
      moduleId,
      lessonId,
      exerciseId,
      kind: "exercise-rctfc-checklist",
      score: result.score,
      aiFeedback: result.rubric,
      summary: result.summary,
      gradingSource: result.source === "ai" ? "ai" : "fallback",
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setAiResult(null);
    setValues(emptyValues());
    removeOwnedSessionLearningItem(storageKey, ownerGeneration);
  };

  // Display either AI rubric entries or the rule-based grades.
  const aiByKey = new Map(
    (aiResult?.rubric ?? []).map((r) => [r.id, r]),
  );
  const grades = submitted
    ? FIELD_ORDER.map((k) => {
        const ai = aiByKey.get(k);
        if (ai) {
          return { key: k, passed: ai.passed, reason: ai.rationale };
        }
        return { key: k, ...gradeField(values[k], criteria[k], isEnglish) };
      })
    : null;
  const score = aiResult?.score ?? 0;
  const passed = score >= 0.8;

  return (
    <div>
      <div className="space-y-3">
        {FIELD_ORDER.map((k) => {
          const spec = criteria[k];
          const grade = grades?.find((g) => g.key === k);
          return (
            <div key={k}>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor={`${exerciseId}-${k}`}
                  className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-orange"
                >
                  {(isEnglish ? FIELD_LABELS_EN : FIELD_LABELS)[k]}
                </label>
                {grade && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-mono text-[10px]",
                      grade.passed ? "text-risk-green" : "text-brand-amber",
                    )}
                  >
                    {grade.passed ? (
                      <CheckCircle2 size={11} />
                    ) : (
                      <XCircle size={11} />
                    )}
                    {grade.passed ? "OK" : grade.reason}
                  </span>
                )}
              </div>
              <p className="mb-1 text-[12px] text-muted-foreground">{spec.hint}</p>
              <textarea
                id={`${exerciseId}-${k}`}
                value={values[k]}
                onChange={(e) => setValues({ ...values, [k]: e.target.value })}
                onBlur={saveDraft}
                maxLength={800}
                rows={2}
                disabled={submitted || isGrading}
                className={cn(
                  "w-full resize-y border border-border bg-background p-2.5 font-mono text-[13px] leading-[1.5] text-foreground outline-none",
                  submitted || isGrading
                    ? "cursor-not-allowed opacity-80"
                    : "focus-visible:border-brand-orange focus-visible:ring-2 focus-visible:ring-brand-orange",
                  grade?.passed === false && "border-brand-amber/60",
                  grade?.passed === true && "border-risk-green/60",
                )}
              />
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {submitted && aiResult != null && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className={cn(
              "mt-4 border-l-[3px] px-4 py-3",
              passed
                ? "border-risk-green bg-risk-green/5"
                : "border-brand-amber bg-brand-amber/5",
            )}
          >
            <div className="flex flex-wrap items-center gap-3">
              <p
                className={cn(
                  "font-mono text-[11px] font-bold uppercase tracking-[0.14em]",
                  passed ? "text-risk-green" : "text-brand-amber",
                )}
              >
                Score {Math.round(score * 100)}%
              </p>
              {aiResult.source === "ai" ? (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-brand-orange">
                  <Sparkles size={11} /> AI
                </span>
              ) : (
                <span className="font-mono text-[10px] text-muted-foreground">
                  Rule-based
                </span>
              )}
              {aiResult.cached && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  · cached
                </span>
              )}
            </div>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-foreground">
              {aiResult.summary}
            </p>
          </m.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isGrading}
            className={cn(
              "inline-flex items-center gap-1.5 border-2 border-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-[background-color,border-color,color,opacity,transform,box-shadow]",
              isGrading
                ? "cursor-not-allowed bg-muted-foreground opacity-60"
                : "bg-brand-orange shadow-[3px_3px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]",
            )}
          >
            {isGrading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                {text("AI bewertet …", "AI is evaluating …")}
              </>
            ) : (
              text("Prüfen", "Evaluate")
            )}
          </button>
        ) : (
          <ExerciseResetButton onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

export { gradeField };
