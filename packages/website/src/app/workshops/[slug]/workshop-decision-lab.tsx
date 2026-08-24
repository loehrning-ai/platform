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

function optionClass(selected: boolean): string {
  return [
    "group flex min-h-12 cursor-pointer items-start gap-3 border-2 p-3 text-left",
    "motion-safe:transition-[opacity,transform] motion-safe:duration-150 motion-reduce:transition-none",
    "hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
    selected
      ? "border-brand-orange bg-brand-orange/10"
      : "border-border bg-background",
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
        onChange={() => onSelect(option.id)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand-orange)]"
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
  const firstChoiceRef = useRef<HTMLInputElement>(null);
  const resetFocusPending = useRef(false);
  const [choiceId, setChoiceId] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const feedback = submitted
    ? selectFeedback(config, choiceId, evidenceId)
    : null;
  const canSubmit = choiceId.length > 0 && evidenceId.length > 0;

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

  function reviseChoice(id: string) {
    setChoiceId(id);
    setSubmitted(false);
  }

  function reviseEvidence(id: string) {
    setEvidenceId(id);
    setSubmitted(false);
  }

  function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
  }

  function resetDecision() {
    resetFocusPending.current = true;
    setChoiceId("");
    setEvidenceId("");
    setSubmitted(false);
  }

  return (
    <section
      aria-labelledby={`${decisionName}-title`}
      data-workshop-decision-lab
      className="relative overflow-hidden border-2 border-foreground bg-foreground text-background shadow-[7px_7px_0_0_var(--color-brand-orange)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -top-8 font-mono text-[9rem] font-black leading-none text-background/[0.04] sm:text-[13rem]"
      >
        01
      </div>

      <div className="relative grid gap-0 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <header className="border-b border-background/20 p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-kupfer-light">
            {config.kicker}
          </p>
          <h2
            id={`${decisionName}-title`}
            className="mt-3 max-w-xl text-3xl font-black leading-[0.96] tracking-[-0.045em] sm:text-4xl"
          >
            {config.title}
          </h2>
          <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-background/75">
            {config.prompt}
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-px border border-background/20 bg-background/20 min-[420px]:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {config.facts.map((fact) => (
              <li
                key={fact}
                className="bg-foreground px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-background"
              >
                {fact}
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-[11px] leading-snug text-background/60">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-orange"
            />
            {config.privacyNote}
          </p>
        </header>

        <form
          className="relative bg-card p-5 text-foreground sm:p-7"
          onSubmit={submitDecision}
          onReset={resetDecision}
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <fieldset className="min-w-0">
              <legend className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand-orange">
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

            <fieldset className="min-w-0">
              <legend className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                {config.evidenceLegend}
              </legend>
              <div className="grid gap-2">
                {config.evidence.map((option) => (
                  <DecisionOption
                    key={option.id}
                    option={option}
                    name={evidenceName}
                    selected={evidenceId === option.id}
                    onSelect={reviseEvidence}
                  />
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex min-h-12 items-center justify-center gap-2 border-2 border-foreground bg-brand-orange px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white motion-safe:transition-[opacity,transform] motion-safe:duration-150 enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none motion-reduce:enabled:hover:translate-y-0"
            >
              {config.submitLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            {submitted ? (
              <button
                type="reset"
                className="inline-flex min-h-11 items-center justify-center gap-2 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground underline decoration-border underline-offset-4 motion-safe:transition-[opacity,transform] motion-safe:duration-150 hover:-translate-y-0.5 hover:text-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                {config.resetLabel}
              </button>
            ) : null}
          </div>

          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-label={config.resultLabel}
            className="mt-4 min-h-0"
          >
            {feedback ? (
              <div className="border-l-4 border-brand-orange bg-background p-4 motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-reduce:transition-none">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {feedback.title}
                </p>
                <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-foreground/80">
                  {feedback.body}
                </p>
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
