"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  CircleX,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import type {
  WorkshopDecisionFeedback,
  WorkshopDecisionLabConfig,
  WorkshopDecisionOption,
} from "@/lib/workshops";
import type { Locale } from "@/lib/i18n/locale";

interface WorkshopDecisionLabProps {
  readonly config: WorkshopDecisionLabConfig;
  readonly locale: Locale;
}

type ValidationError = "decision" | "evidence" | null;
type Outcome = "correct" | "partial" | "wrong";
type OptionMark = "correct" | "wrong-pick" | "other" | null;

const LAB_COPY = {
  en: {
    outcome: {
      correct: "Correct",
      partial: "Almost",
      wrong: "Not quite",
    },
    correctOption: "Correct answer",
    yourCorrectPick: "Your pick · correct",
    yourWrongPick: "Your pick · not the strongest",
    resetAfterCorrect: "Reset",
    validation: {
      decision: "Select one decision before checking the result.",
      evidence: "Select the strongest evidence before checking the result.",
    },
    loading: "The choices unlock once JavaScript has loaded.",
    noScript:
      "JavaScript is required for this exercise. You can still read the course and download its materials without it.",
  },
  de: {
    outcome: {
      correct: "Richtig",
      partial: "Fast richtig",
      wrong: "Noch nicht richtig",
    },
    correctOption: "Richtige Antwort",
    yourCorrectPick: "Deine Wahl · richtig",
    yourWrongPick: "Deine Wahl · nicht die stärkste",
    resetAfterCorrect: "Zurücksetzen",
    validation: {
      decision: "Wähle eine Entscheidung aus, bevor du das Ergebnis prüfst.",
      evidence: "Wähle den stärksten Beleg aus, bevor du das Ergebnis prüfst.",
    },
    loading: "Die Auswahl wird freigeschaltet, sobald JavaScript geladen ist.",
    noScript:
      "Diese Übung benötigt JavaScript. Du kannst den Kurs und seine Materialien auch ohne JavaScript lesen und herunterladen.",
  },
} as const;

/**
 * Stable 32-bit FNV-1a hash. The option order must be identical on the server
 * and in the first client render, so it may only depend on the config and the
 * attempt number, never on Math.random or time.
 */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  // mulberry32
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

interface OptionOrder {
  readonly choices: readonly WorkshopDecisionOption[];
  readonly evidence: readonly WorkshopDecisionOption[];
}

/**
 * Deterministic option order per attempt. The authored order always lists the
 * recommended answers first, so the first attempt moves both away from the
 * top (and apart from each other), and every retry changes the order again so
 * a remembered position is not a strategy.
 */
export function orderDecisionOptions(
  config: WorkshopDecisionLabConfig,
  attempt: number,
  previous?: OptionOrder,
): OptionOrder {
  const seed = hashString(
    [
      config.title,
      ...config.choices.map(({ id }) => id),
      ...config.evidence.map(({ id }) => id),
    ].join("|"),
  );
  const positionOf = (
    options: readonly WorkshopDecisionOption[],
    id: string,
  ) => options.findIndex((option) => option.id === id);
  const signature = (order: OptionOrder) =>
    [...order.choices, ...order.evidence].map(({ id }) => id).join("|");

  for (let tryIndex = 0; tryIndex < 64; tryIndex += 1) {
    const round = hashString(`${seed}:${attempt}:${tryIndex}`);
    const candidate: OptionOrder = {
      choices: seededShuffle(config.choices, round),
      evidence: seededShuffle(config.evidence, hashString(`${round}:evidence`)),
    };
    const choiceAt = positionOf(candidate.choices, config.recommendedChoiceId);
    const evidenceAt = positionOf(
      candidate.evidence,
      config.strongestEvidenceId,
    );
    const acceptable =
      attempt === 0
        ? choiceAt !== 0 &&
          evidenceAt !== 0 &&
          (Math.min(candidate.choices.length, candidate.evidence.length) < 3 ||
            choiceAt !== evidenceAt)
        : !previous ||
          (signature(candidate) !== signature(previous) &&
            (choiceAt !==
              positionOf(previous.choices, config.recommendedChoiceId) ||
              evidenceAt !==
                positionOf(previous.evidence, config.strongestEvidenceId)));
    if (acceptable) return candidate;
  }
  // Unreachable for three or more options; keep a stable rotation fallback.
  const rotate = (options: readonly WorkshopDecisionOption[]) =>
    options.map((_, index) => options[(index + attempt + 1) % options.length]);
  return { choices: rotate(config.choices), evidence: rotate(config.evidence) };
}

function optionClass(selected: boolean, mark: OptionMark): string {
  const tone =
    mark === "correct"
      ? "border-2 border-brand-teal bg-brand-teal/10"
      : mark === "wrong-pick"
        ? "border-2 border-destructive bg-destructive/5"
        : mark === "other"
          ? "border-border bg-background text-muted-foreground hover:border-foreground/50"
          : selected
            ? "border-brand-orange bg-brand-orange/10"
            : "border-border bg-background hover:border-foreground/50";
  return [
    "flex min-h-12 cursor-pointer items-start gap-3 border p-3 text-left transition-colors",
    tone,
  ].join(" ");
}

function DecisionOption({
  option,
  name,
  selected,
  mark,
  copy,
  onSelect,
  inputRef,
}: {
  readonly option: WorkshopDecisionOption;
  readonly name: string;
  readonly selected: boolean;
  readonly mark: OptionMark;
  readonly copy: (typeof LAB_COPY)[Locale];
  readonly onSelect: (id: string) => void;
  readonly inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const inputId = `${name}-${option.id}`;
  const markId = `${inputId}-mark`;
  const markText =
    mark === "correct"
      ? selected
        ? copy.yourCorrectPick
        : copy.correctOption
      : mark === "wrong-pick"
        ? copy.yourWrongPick
        : null;

  return (
    <label
      className={optionClass(selected, mark)}
      htmlFor={inputId}
      data-option-mark={mark ?? undefined}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="radio"
        name={name}
        value={option.id}
        checked={selected}
        required
        onChange={() => onSelect(option.id)}
        aria-describedby={markText ? markId : undefined}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand-orange)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
      />
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-medium leading-snug ${
            mark === "other" ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {option.label}
        </span>
        {markText ? (
          <span
            id={markId}
            // Kept out of the radio's name (the option label stays the name);
            // aria-describedby still announces it as the description.
            aria-hidden="true"
            className={`mt-1.5 flex items-center gap-1.5 text-xs font-bold ${
              mark === "correct" ? "text-brand-teal" : "text-destructive"
            }`}
          >
            {mark === "correct" ? (
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <X className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {markText}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function selectFeedback(
  config: WorkshopDecisionLabConfig,
  choiceId: string,
  evidenceId: string,
): { readonly outcome: Outcome; readonly feedback: WorkshopDecisionFeedback } {
  const decisionAligned = choiceId === config.recommendedChoiceId;
  const evidenceAligned = evidenceId === config.strongestEvidenceId;

  if (decisionAligned && evidenceAligned)
    return { outcome: "correct", feedback: config.feedback.aligned };
  if (decisionAligned)
    return { outcome: "partial", feedback: config.feedback.decisionOnly };
  const specific = config.feedback.byChoice?.[choiceId];
  if (evidenceAligned)
    return {
      outcome: "wrong",
      feedback: specific?.evidenceOnly ?? config.feedback.evidenceOnly,
    };
  return {
    outcome: "wrong",
    feedback: specific?.unsupported ?? config.feedback.unsupported,
  };
}

const OUTCOME_STYLE: Record<
  Outcome,
  { readonly border: string; readonly text: string; readonly Icon: typeof CircleCheck }
> = {
  correct: { border: "border-brand-teal", text: "text-brand-teal", Icon: CircleCheck },
  partial: { border: "border-brand-amber", text: "text-brand-amber", Icon: CircleAlert },
  wrong: { border: "border-destructive", text: "text-destructive", Icon: CircleX },
};

export function WorkshopDecisionLab({
  config,
  locale,
}: WorkshopDecisionLabProps) {
  const copy = LAB_COPY[locale];
  const decisionName = `workshop-decision-${useId().replaceAll(":", "")}`;
  const evidenceName = `workshop-evidence-${useId().replaceAll(":", "")}`;
  const validationId = `${decisionName}-validation`;
  const readinessId = `${decisionName}-readiness`;
  const firstChoiceRef = useRef<HTMLInputElement>(null);
  const firstEvidenceRef = useRef<HTMLInputElement>(null);
  const resetActionRef = useRef<HTMLButtonElement>(null);
  const resetFocusPending = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [choiceId, setChoiceId] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<ValidationError>(null);
  // The first order is a pure function of the config, so the server render
  // and the hydrating client render agree. Retries reorder on the client only.
  const [arrangement, setArrangement] = useState(() => ({
    attempt: 0,
    order: orderDecisionOptions(config, 0),
  }));
  const { attempt, order } = arrangement;
  const result = submitted
    ? selectFeedback(config, choiceId, evidenceId)
    : null;
  const feedback = result?.feedback ?? null;
  const outcomeStyle = result ? OUTCOME_STYLE[result.outcome] : null;
  const markFor = (
    option: WorkshopDecisionOption,
    correctId: string,
    selectedId: string,
  ): OptionMark => {
    if (!submitted) return null;
    if (option.id === correctId) return "correct";
    return option.id === selectedId ? "wrong-pick" : "other";
  };

  useEffect(() => {
    // SSR must not expose a native form submission before React owns it.
    // Keep both the answers and submit control inert until this island is ready.
    setHydrated(true);
  }, []);

  useLayoutEffect(() => {
    // Submission replaces its native button. Transfer focus to the new
    // action instead of leaving keyboard users on the document body.
    if (submitted) resetActionRef.current?.focus({ preventScroll: true });
  }, [submitted]);

  useLayoutEffect(() => {
    if (!resetFocusPending.current) return;
    resetFocusPending.current = false;
    const frame = window.requestAnimationFrame(() => {
      const firstChoice = firstChoiceRef.current;
      firstChoice?.focus({ preventScroll: true });
      firstChoice?.scrollIntoView?.({ block: "center", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [choiceId, evidenceId, submitted, attempt]);

  useLayoutEffect(() => {
    if (!validationError) return;
    const target =
      validationError === "decision"
        ? firstChoiceRef.current
        : firstEvidenceRef.current;
    target?.focus({ preventScroll: true });
  }, [validationError]);

  function reviseChoice(id: string) {
    setChoiceId(id);
    setSubmitted(false);
    setValidationError((current) => (current === "decision" ? null : current));
  }

  function reviseEvidence(id: string) {
    setEvidenceId(id);
    setSubmitted(false);
    setValidationError((current) => (current === "evidence" ? null : current));
  }

  function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hydrated) return;
    if (!choiceId) {
      setValidationError("decision");
      return;
    }
    if (!evidenceId) {
      setValidationError("evidence");
      return;
    }
    setValidationError(null);
    setSubmitted(true);
  }

  function resetDecision() {
    resetFocusPending.current = true;
    setArrangement((current) => ({
      attempt: current.attempt + 1,
      order: orderDecisionOptions(config, current.attempt + 1, current.order),
    }));
    setChoiceId("");
    setEvidenceId("");
    setSubmitted(false);
    setValidationError(null);
  }

  return (
    <section
      aria-labelledby={`${decisionName}-title`}
      data-workshop-decision-lab
      className="border border-foreground border-t-[3px] border-t-brand-orange bg-background"
    >
      <div className="grid lg:grid-cols-[minmax(16rem,0.72fr)_minmax(0,1.28fr)]">
        <header className="border-b border-border p-4 sm:p-5 lg:border-b-0 lg:border-r">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
            {config.kicker}
          </p>
          <h2
            id={`${decisionName}-title`}
            className="mt-2 max-w-xl text-2xl font-black leading-tight tracking-[-0.035em] sm:text-3xl"
          >
            {config.title}
          </h2>
          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
            {config.prompt}
          </p>
          <ul className="mt-4 grid grid-cols-1 border-y border-border sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {config.facts.map((fact) => (
              <li
                key={fact}
                className="break-words border-t border-border px-2 py-2 font-mono text-xs font-semibold leading-snug text-foreground first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0 lg:border-l-0 lg:border-t lg:first:border-t-0 xl:border-l xl:border-t-0 xl:first:border-l-0"
              >
                {fact}
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange"
            />
            {config.privacyNote}
          </p>
        </header>

        <form
          className="bg-card/25 p-4 sm:p-5"
          aria-busy={!hydrated}
          onSubmit={submitDecision}
          onReset={resetDecision}
          noValidate
        >
          {!hydrated ? (
            <p id={readinessId} className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {copy.loading}
            </p>
          ) : null}
          <noscript>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {copy.noScript}
            </p>
          </noscript>
          <div className="grid gap-5 xl:grid-cols-2">
            <fieldset
              disabled={!hydrated}
              className="min-w-0"
              aria-invalid={validationError === "decision" || undefined}
              aria-describedby={
                !hydrated ? readinessId : validationError === "decision" ? validationId : undefined
              }
            >
              <legend className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                {config.decisionLegend}
              </legend>
              <div className="grid gap-2">
                {order.choices.map((option, index) => (
                  <DecisionOption
                    key={option.id}
                    option={option}
                    name={decisionName}
                    selected={choiceId === option.id}
                    mark={markFor(option, config.recommendedChoiceId, choiceId)}
                    copy={copy}
                    onSelect={reviseChoice}
                    inputRef={index === 0 ? firstChoiceRef : undefined}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset
              disabled={!hydrated}
              className="min-w-0"
              aria-invalid={validationError === "evidence" || undefined}
              aria-describedby={
                !hydrated ? readinessId : validationError === "evidence" ? validationId : undefined
              }
            >
              <legend className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                {config.evidenceLegend}
              </legend>
              <div className="grid gap-2">
                {order.evidence.map((option, index) => (
                  <DecisionOption
                    key={option.id}
                    option={option}
                    name={evidenceName}
                    selected={evidenceId === option.id}
                    mark={markFor(option, config.strongestEvidenceId, evidenceId)}
                    copy={copy}
                    onSelect={reviseEvidence}
                    inputRef={index === 0 ? firstEvidenceRef : undefined}
                  />
                ))}
              </div>
            </fieldset>
          </div>

          {validationError ? (
            <p
              id={validationId}
              role="alert"
              aria-atomic="true"
              className="mt-4 border-l-[3px] border-destructive bg-background px-4 py-3 text-sm font-semibold text-destructive"
            >
              {copy.validation[validationError]}
            </p>
          ) : null}

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label={config.resultLabel}
            className="mt-4 min-h-0"
          >
            {feedback && result && outcomeStyle ? (
              <div
                data-outcome={result.outcome}
                className={`border-l-[4px] ${outcomeStyle.border} bg-background p-4`}
              >
                <p
                  className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] ${outcomeStyle.text}`}
                >
                  <outcomeStyle.Icon
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  {copy.outcome[result.outcome]}
                </p>
                <p className="mt-2 text-base font-bold leading-snug text-foreground">
                  {feedback.title}
                </p>
                <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-foreground/80">
                  {feedback.body}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex border-t border-border pt-4">
            {submitted ? (
              <button
                key="reset"
                ref={resetActionRef}
                type="reset"
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-foreground bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {result?.outcome === "correct"
                  ? copy.resetAfterCorrect
                  : config.resetLabel}
              </button>
            ) : (
              <button
                key="submit"
                type="submit"
                disabled={!hydrated}
                className="inline-flex min-h-11 items-center justify-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-foreground disabled:cursor-wait disabled:opacity-60"
              >
                {config.submitLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
