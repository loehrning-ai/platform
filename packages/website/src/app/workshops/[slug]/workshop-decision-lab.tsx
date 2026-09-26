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
import { Chip, cx, Pictogram } from "@/components/werk";
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

const OPTION_ROW =
  "flex min-h-12 cursor-pointer items-start gap-3 border-b border-hairline px-2 py-3 text-left transition-colors duration-[120ms] hover:bg-card has-[:checked]:bg-card";

/**
 * Square radio, the same shape as the Route's current station: an ink frame
 * that fills when checked, leaving a card-coloured square inside. Native
 * input, so keyboard and screen-reader behaviour stay as they are.
 */
const RADIO =
  "mt-0.5 size-5 shrink-0 cursor-pointer appearance-none border-2 border-foreground bg-card checked:border-[6px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-orange disabled:cursor-wait";

/**
 * After a check the strongest-evidence square gets the lab's one Mennige
 * mark. It is a non-text outline (4.55:1 on Beton), and the option also
 * carries the pass pictogram and a word, so colour is never the only cue.
 */
const STRONGEST_MARK = "outline outline-2 outline-offset-2 outline-mennige";

function DecisionOption({
  option,
  name,
  selected,
  mark,
  strongest,
  copy,
  onSelect,
  inputRef,
}: {
  readonly option: WorkshopDecisionOption;
  readonly name: string;
  readonly selected: boolean;
  readonly mark: OptionMark;
  /** True for the strongest-evidence option once the result is shown. */
  readonly strongest: boolean;
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
      className={OPTION_ROW}
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
        data-strongest-mark={strongest ? "" : undefined}
        className={cx(RADIO, strongest && STRONGEST_MARK)}
      />
      <span className="min-w-0 flex-1">
        <span
          className={cx(
            "block text-[0.9375rem] leading-snug",
            selected ? "font-semibold" : "font-normal",
            mark === "other" ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {option.label}
        </span>
        {markText ? (
          <span
            id={markId}
            // Kept out of the radio's name (the option label stays the name);
            // aria-describedby still announces it as the description.
            aria-hidden="true"
            className={cx(
              "mt-1.5 flex items-center gap-1.5 text-label",
              mark === "correct" ? "text-pass" : "text-foreground",
            )}
          >
            <Pictogram
              name={mark === "correct" ? "pass" : "fail"}
              className="size-4"
            />
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

/**
 * Verdict chip per outcome: pass (green, icon and word), partial (dashed ink
 * with the gap pictogram), wrong (ink with the fail pictogram). The word is
 * always there, so the colour is never the only cue.
 */
function VerdictChip({
  outcome,
  children,
}: {
  readonly outcome: Outcome;
  readonly children: string;
}) {
  if (outcome === "correct") return <Chip variant="pass">{children}</Chip>;
  if (outcome === "partial") return <Chip variant="gap">{children}</Chip>;
  return (
    <span className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap border border-foreground px-2.5 text-label text-foreground">
      <Pictogram name="fail" className="size-3.5" />
      {children}
    </span>
  );
}

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
      className="border-t-2 border-foreground bg-inset"
    >
      <div className="mx-auto grid max-w-[75rem] gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <header className="min-w-0">
          <p className="text-label text-muted-foreground tabular-nums">
            {config.kicker}
          </p>
          <h2
            id={`${decisionName}-title`}
            className="mt-3 max-w-[20ch] text-fluid-h2 font-bold text-foreground text-balance"
          >
            {config.title}
          </h2>
          <p className="mt-4 max-w-[52ch] text-body text-muted-foreground text-pretty">
            {config.prompt}
          </p>
          <ul className="mt-6 grid grid-cols-1 border-t border-hairline sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {config.facts.map((fact) => (
              <li
                key={fact}
                className="break-words border-b border-hairline py-2.5 text-label text-foreground tabular-nums sm:border-b-0 sm:pr-3 lg:border-b xl:border-b-0"
              >
                {fact}
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-start gap-2 text-caption text-muted-foreground">
            <Pictogram name="shield" className="mt-0.5 size-4" />
            <span>{config.privacyNote}</span>
          </p>
        </header>

        <form
          className="min-w-0"
          aria-busy={!hydrated}
          onSubmit={submitDecision}
          onReset={resetDecision}
          noValidate
        >
          {!hydrated ? (
            <p id={readinessId} className="mb-4 text-caption text-muted-foreground">
              {copy.loading}
            </p>
          ) : null}
          <noscript>
            <p className="mb-4 text-body text-muted-foreground">
              {copy.noScript}
            </p>
          </noscript>
          <div className="grid gap-8">
            <fieldset
              disabled={!hydrated}
              className="min-w-0"
              aria-invalid={validationError === "decision" || undefined}
              aria-describedby={
                !hydrated ? readinessId : validationError === "decision" ? validationId : undefined
              }
            >
              <legend className="mb-2 text-label text-foreground">
                {config.decisionLegend}
              </legend>
              <div className="border-t border-hairline">
                {order.choices.map((option, index) => (
                  <DecisionOption
                    key={option.id}
                    option={option}
                    name={decisionName}
                    selected={choiceId === option.id}
                    mark={markFor(option, config.recommendedChoiceId, choiceId)}
                    strongest={false}
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
              <legend className="mb-2 text-label text-foreground">
                {config.evidenceLegend}
              </legend>
              <div className="border-t border-hairline">
                {order.evidence.map((option, index) => (
                  <DecisionOption
                    key={option.id}
                    option={option}
                    name={evidenceName}
                    selected={evidenceId === option.id}
                    mark={markFor(option, config.strongestEvidenceId, evidenceId)}
                    strongest={submitted && option.id === config.strongestEvidenceId}
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
              className="mt-4 flex items-start gap-2 text-[0.9375rem] font-semibold text-destructive"
            >
              <Pictogram name="fail" className="mt-0.5 size-4" />
              <span>{copy.validation[validationError]}</span>
            </p>
          ) : null}

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label={config.resultLabel}
            className="mt-4 min-h-0"
          >
            {feedback && result ? (
              <div
                data-outcome={result.outcome}
                className="border-t border-foreground pt-4"
              >
                <VerdictChip outcome={result.outcome}>
                  {copy.outcome[result.outcome]}
                </VerdictChip>
                <p className="mt-3 text-[1.0625rem] font-bold leading-snug text-foreground">
                  {feedback.title}
                </p>
                <p className="mt-2 max-w-[64ch] text-body text-muted-foreground">
                  {feedback.body}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            {submitted ? (
              <button
                key="reset"
                ref={resetActionRef}
                type="reset"
                className="inline-flex min-h-11 items-center font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors duration-[120ms] hover:decoration-foreground focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
              >
                {result?.outcome === "correct"
                  ? copy.resetAfterCorrect
                  : config.resetLabel}
              </button>
            ) : (
              <button
                key="submit"
                type="submit"
                disabled={!hydrated}
                className="inline-flex min-h-11 items-center justify-center bg-foreground px-5 text-[0.9375rem] font-semibold text-background transition-colors duration-[120ms] hover:bg-muted-foreground focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-orange disabled:cursor-wait disabled:opacity-60"
              >
                {config.submitLabel}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
