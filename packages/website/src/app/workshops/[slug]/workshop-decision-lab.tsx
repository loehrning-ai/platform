"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import type {
  WorkshopDecisionFeedback,
  WorkshopDecisionLabConfig,
  WorkshopDecisionOption,
} from "@/lib/workshops";

interface WorkshopDecisionLabProps {
  readonly config: WorkshopDecisionLabConfig;
}

type ValidationError = "decision" | "evidence" | null;

function getValidationMessage(
  config: WorkshopDecisionLabConfig,
  error: Exclude<ValidationError, null>,
): string {
  const english = config.resultLabel === "Decision feedback";
  if (error === "decision") {
    return english
      ? "Select one decision before checking the result."
      : "Wähle eine Entscheidung aus, bevor du das Ergebnis prüfst.";
  }
  return english
    ? "Select the strongest evidence before checking the result."
    : "Wähle den stärksten Beleg aus, bevor du das Ergebnis prüfst.";
}

function optionClass(selected: boolean): string {
  return [
    "flex min-h-12 cursor-pointer items-start gap-3 border p-3 text-left transition-colors",
    selected
      ? "border-brand-orange bg-brand-orange/10"
      : "border-border bg-background hover:border-foreground/50",
  ].join(" ");
}

function DecisionOption({
  option,
  name,
  selected,
  onSelect,
  inputRef,
}: {
  readonly option: WorkshopDecisionOption;
  readonly name: string;
  readonly selected: boolean;
  readonly onSelect: (id: string) => void;
  readonly inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const inputId = `${name}-${option.id}`;

  return (
    <label className={optionClass(selected)} htmlFor={inputId}>
      <input
        ref={inputRef}
        id={inputId}
        type="radio"
        name={name}
        value={option.id}
        checked={selected}
        required
        onChange={() => onSelect(option.id)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand-orange)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
      />
      <span className="text-sm font-medium leading-snug text-foreground">
        {option.label}
      </span>
    </label>
  );
}

function selectFeedback(
  config: WorkshopDecisionLabConfig,
  choiceId: string,
  evidenceId: string,
): WorkshopDecisionFeedback {
  const decisionAligned = choiceId === config.recommendedChoiceId;
  const evidenceAligned = evidenceId === config.strongestEvidenceId;

  if (decisionAligned && evidenceAligned) return config.feedback.aligned;
  if (decisionAligned) return config.feedback.decisionOnly;
  if (evidenceAligned) return config.feedback.evidenceOnly;
  return config.feedback.unsupported;
}

export function WorkshopDecisionLab({ config }: WorkshopDecisionLabProps) {
  const decisionName = `workshop-decision-${useId().replaceAll(":", "")}`;
  const evidenceName = `workshop-evidence-${useId().replaceAll(":", "")}`;
  const validationId = `${decisionName}-validation`;
  const firstChoiceRef = useRef<HTMLInputElement>(null);
  const firstEvidenceRef = useRef<HTMLInputElement>(null);
  const resetFocusPending = useRef(false);
  const [choiceId, setChoiceId] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<ValidationError>(null);
  const feedback = submitted
    ? selectFeedback(config, choiceId, evidenceId)
    : null;

  useLayoutEffect(() => {
    if (!resetFocusPending.current) return;
    resetFocusPending.current = false;
    const frame = window.requestAnimationFrame(() => {
      const firstChoice = firstChoiceRef.current;
      firstChoice?.focus({ preventScroll: true });
      firstChoice?.scrollIntoView?.({ block: "center", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [choiceId, evidenceId, submitted]);

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
          onSubmit={submitDecision}
          onReset={resetDecision}
          noValidate
        >
          <div className="grid gap-5 xl:grid-cols-2">
            <fieldset
              className="min-w-0"
              aria-invalid={validationError === "decision" || undefined}
              aria-describedby={
                validationError === "decision" ? validationId : undefined
              }
            >
              <legend className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                {config.decisionLegend}
              </legend>
              <div className="grid gap-2">
                {config.choices.map((option, index) => (
                  <DecisionOption
                    key={option.id}
                    option={option}
                    name={decisionName}
                    selected={choiceId === option.id}
                    onSelect={reviseChoice}
                    inputRef={index === 0 ? firstChoiceRef : undefined}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset
              className="min-w-0"
              aria-invalid={validationError === "evidence" || undefined}
              aria-describedby={
                validationError === "evidence" ? validationId : undefined
              }
            >
              <legend className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                {config.evidenceLegend}
              </legend>
              <div className="grid gap-2">
                {config.evidence.map((option, index) => (
                  <DecisionOption
                    key={option.id}
                    option={option}
                    name={evidenceName}
                    selected={evidenceId === option.id}
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
              {getValidationMessage(config, validationError)}
            </p>
          ) : null}

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label={config.resultLabel}
            className="mt-4 min-h-0"
          >
            {feedback ? (
              <div className="border-l-[3px] border-brand-orange bg-background p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
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
                type="reset"
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-foreground bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {config.resetLabel}
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-foreground"
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
