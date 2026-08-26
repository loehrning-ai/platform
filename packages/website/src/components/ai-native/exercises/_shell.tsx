"use client";

import {
  Component,
  useEffect,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { m } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import {
  getExerciseResult,
  saveExerciseResult,
  isExerciseCompleted,
} from "@/lib/ai-native/progress";
import { getLearningOwnerContext } from "@/lib/progress/browser-learning-storage";
import {
  getOwnerRequiredHint,
  persistForActiveLearningOwner,
  useOwnerAwareProgressReadiness,
} from "@/components/course/owner-aware-progress";
import { reportClientBoundaryError } from "@/lib/observability/client-boundary-error";
import { useDemoLocale } from "@/components/demos/demo-locale";
import type {
  AiRubricEntry,
  ExerciseKind,
  ExerciseResult,
  GradingSource,
  ModuleId,
} from "@/lib/ai-native/types";

/**
 * ExerciseShell — common UI frame for all 7 exercise kinds.
 *
 *  - Draft + completion state live in child exercises; the shell tracks
 *    the final "completed" boolean and score via onSubmit callback.
 *  - Error-boundary: if the exercise throws at render, shell shows an
 *    escape button ("ich hab's verstanden, weiter") that marks the
 *    exercise skipped-complete. Never blocks the lesson.
 *  - Draft persistence (on blur + beforeunload) — handled per exercise
 *    via the `<ExerciseShell.DraftInput>` helpers.
 *  - Reusable by all 7 kinds (AI-native lesson system).
 *
 * See AI-native lesson system.
 */

export interface ExerciseShellProps {
  readonly moduleId: ModuleId;
  readonly lessonId: string;
  readonly exerciseId: string;
  readonly kind: ExerciseKind;
  readonly title: string;
  readonly scenario: string;
  readonly children: ReactNode;
  /** Force-reset signal — bump to reset inner state. */
  readonly resetKey?: number;
}

interface ExerciseSubmitOptions {
  readonly moduleId: ModuleId;
  readonly lessonId: string;
  readonly exerciseId: string;
  readonly kind: ExerciseKind;
  readonly score: number | null;
  readonly skipped?: boolean;
  readonly aiFeedback?: readonly AiRubricEntry[];
  readonly summary?: string;
  readonly gradingSource?: GradingSource;
  readonly expectedOwnerGeneration?: number;
}

export function submitExercise(opts: ExerciseSubmitOptions): boolean {
  const owner = getLearningOwnerContext();
  if (
    owner.kind === "unknown" ||
    (opts.expectedOwnerGeneration !== undefined &&
      owner.generation !== opts.expectedOwnerGeneration)
  ) {
    return false;
  }
  const result: ExerciseResult = {
    exerciseId: opts.exerciseId,
    kind: opts.kind,
    completed: true,
    score: opts.score,
    attempts: 1,
    completedAt: new Date().toISOString(),
    skipped: opts.skipped ?? false,
    ...(opts.aiFeedback ? { aiFeedback: opts.aiFeedback } : {}),
    ...(opts.summary ? { summary: opts.summary } : {}),
    ...(opts.gradingSource ? { gradingSource: opts.gradingSource } : {}),
  };
  let durable = false;
  return persistForActiveLearningOwner(
    () => {
      durable = saveExerciseResult(opts.moduleId, opts.lessonId, result);
    },
    () => durable && isExerciseCompleted(opts.lessonId, opts.exerciseId),
  );
}

export function ExerciseShell({
  moduleId,
  lessonId,
  exerciseId,
  kind,
  title,
  scenario,
  children,
}: ExerciseShellProps): JSX.Element {
  const { locale, text } = useDemoLocale();
  const isEnglish = locale === "en";
  const [completed, setCompleted] = useState(false);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [readyIdentity, setReadyIdentity] = useState<string | null>(null);
  const [loadedOwnerGeneration, setLoadedOwnerGeneration] = useState<
    number | null
  >(null);
  const identity = `ai-native:${lessonId}:${exerciseId}`;
  const readiness = useOwnerAwareProgressReadiness(
    identity,
    readyIdentity,
    loadedOwnerGeneration,
  );

  useEffect(() => {
    const owner = getLearningOwnerContext();
    const resolved = owner.kind !== "unknown";
    const result = resolved
      ? getExerciseResult(lessonId, exerciseId)
      : undefined;
    setCompleted(result?.completed === true);
    setPrevScore(result?.score ?? null);
    if (resolved && isExerciseCompleted(lessonId, exerciseId)) {
      setCompleted(true);
    }
    setLoadedOwnerGeneration(owner.generation);
    setReadyIdentity(identity);
  }, [exerciseId, identity, lessonId, readiness.checkpointKey]);

  const handleSkip = () => {
    if (
      submitExercise({
        moduleId,
        lessonId,
        exerciseId,
        kind,
        score: null,
        skipped: true,
      })
    ) {
      setCompleted(true);
    }
  };

  const exerciseCompleted = readiness.interactionReady && completed;

  return (
    <ExerciseErrorBoundary
      key={readiness.checkpointKey}
      fallback={
        <ExerciseFallback
          title={title}
          onSkip={handleSkip}
          isEnglish={isEnglish}
          interactionReady={readiness.interactionReady}
          ownerHint={getOwnerRequiredHint(locale)}
        />
      }
    >
      <div
        className="border-l-[3px] border-brand-orange bg-card/40 p-5 md:p-6"
        data-exercise-id={exerciseId}
        data-exercise-kind={kind}
      >
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
            ◆ {text("Übung", "Exercise")} · {kindLabel(kind, isEnglish)}
          </p>
          {exerciseCompleted && (
            <m.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-risk-green"
            >
              <CheckCircle2 size={12} />
              {prevScore != null
                ? `${Math.round(prevScore * 100)}%`
                : text("Erledigt", "Completed")}
            </m.span>
          )}
        </div>
        <h3 className="mb-2 text-[18px] font-bold leading-[1.25] tracking-[-0.02em] text-foreground md:text-[20px]">
          {title}
        </h3>
        <p className="mb-5 max-w-[640px] text-[14px] leading-[1.6] text-muted-foreground">
          {scenario}
        </p>
        {readiness.hydrated && !readiness.ownerReady ? (
          <p
            className="mt-4 border-l-2 border-brand-orange pl-3 text-[13px] text-muted-foreground"
            role="status"
          >
            {getOwnerRequiredHint(locale)}
          </p>
        ) : null}
        <fieldset
          className="m-0 min-w-0 border-0 p-0 disabled:opacity-60"
          disabled={!readiness.interactionReady}
          aria-busy={!readiness.hydrated || undefined}
        >
          <div
            className="mt-4"
            inert={!readiness.interactionReady || undefined}
          >
            {children}
          </div>
        </fieldset>

        {/* Escape hatch */}
        {!exerciseCompleted && (
          <div className="mt-5 border-t border-dashed border-border pt-4">
            <button
              type="button"
              onClick={handleSkip}
              disabled={!readiness.interactionReady}
              aria-busy={!readiness.hydrated || undefined}
              className="inline-flex min-h-11 items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-brand-orange"
            >
              {text("Ich hab's verstanden → weiter", "Understood, continue")}
              <ArrowRight size={11} />
            </button>
          </div>
        )}
      </div>
    </ExerciseErrorBoundary>
  );
}

function kindLabel(kind: ExerciseKind, isEnglish: boolean): string {
  const labels: Record<ExerciseKind, string> = {
    "exercise-fix-prompt": "Fix-this-prompt",
    "exercise-pii-spotter": "PII-Spotter",
    "exercise-context-budget": "Context-Budget",
    "exercise-prompt-diff": "Prompt-Diff",
    "exercise-workflow-builder": "Workflow-Builder",
    "exercise-role-scenario": "Role-Scenario",
    "exercise-rctfc-checklist": isEnglish
      ? "RCTFC checklist"
      : "RCTFC-Checkliste",
    "exercise-free-response": isEnglish ? "Free response" : "Freie Antwort",
  };
  return labels[kind];
}

function ExerciseFallback({
  title,
  onSkip,
  isEnglish,
  interactionReady,
  ownerHint,
}: {
  readonly title: string;
  readonly onSkip: () => void;
  readonly isEnglish: boolean;
  readonly interactionReady: boolean;
  readonly ownerHint: string;
}): JSX.Element {
  return (
    <div className="border border-destructive bg-destructive/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" />
        <div className="flex-1">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-destructive">
            {isEnglish
              ? "Exercise currently unavailable"
              : "Übung aktuell nicht verfügbar"}
          </p>
          <h3 className="mt-1 text-[16px] font-bold text-foreground">
            {title}
          </h3>
          <p className="mt-2 text-[13.5px] leading-[1.55] text-muted-foreground">
            {isEnglish
              ? "This exercise cannot be evaluated right now. You can continue; it will be recorded as skipped."
              : "Diese Übung lässt sich gerade nicht auswerten. Du kannst weiterlernen; sie wird als übersprungen markiert."}
          </p>
          {!interactionReady ? (
            <p className="mt-2 text-[13px] text-muted-foreground" role="status">
              {ownerHint}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onSkip}
            disabled={!interactionReady}
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 border border-foreground bg-transparent px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            {isEnglish
              ? "Understood, continue"
              : "Ich hab's verstanden → weiter"}
            <ArrowRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Error boundary for individual exercises. Catches render exceptions
 * (e.g. malformed rubric data) and delegates to the fallback UI.
 */
interface EBState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

class ExerciseErrorBoundary extends Component<
  { readonly children: ReactNode; readonly fallback: ReactNode },
  EBState
> {
  state: EBState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error): void {
    reportClientBoundaryError("ai-native-exercise", error);
  }

  override render(): ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/** Reset button used inside exercise bodies to let user retry. */
export function ExerciseResetButton({
  onReset,
}: {
  readonly onReset: () => void;
}): JSX.Element {
  const { text } = useDemoLocale();
  return (
    <button
      type="button"
      onClick={onReset}
      className="inline-flex min-h-11 items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-brand-orange"
    >
      <RotateCcw size={11} />
      {text("Nochmal", "Try again")}
    </button>
  );
}
