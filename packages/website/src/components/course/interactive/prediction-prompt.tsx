"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  handleRovingFocusKeyDown,
  rovingTabIndex,
} from "@/lib/a11y/roving-focus";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/*
 * PredictionPrompt — the learner commits to an answer before the lesson gives
 * one.
 *
 * A deep lesson defaults to prose in which every claim arrives already
 * resolved, so nothing is ever at stake and the reader skims. This block
 * withholds the resolution until a guess exists. It is deliberately not
 * graded: course/kurs/lesson-quiz.tsx already scores right and wrong, and a
 * prediction about real numbers has no score, only a gap worth reading.
 *
 * Self-contained by design — local state, no network, no progress store, no
 * course data types — so any reader can drop it into a lesson.
 *
 * Chrome copy is bilingual here. `question`, `context`, `placeholder` and
 * `kicker` come from the callsite, which owns their translations.
 */

export interface PredictionOption {
  readonly id: string;
  readonly label: string;
}

export interface PredictionAnswer {
  /** The chosen option, or null when the learner typed a free answer. */
  readonly optionId: string | null;
  /** What the learner committed to, ready to render. */
  readonly text: string;
}

export interface PredictionPromptProps {
  /** What the learner is asked to predict. */
  readonly question: string;
  /**
   * Revealed once the learner has committed. A plain node renders from a
   * server component; a function receives the committed answer and therefore
   * needs a client callsite (functions do not cross the server boundary).
   */
  readonly children: ReactNode | ((answer: PredictionAnswer) => ReactNode);
  readonly locale: Locale;
  /** Fixed choices. Omit for a free-text estimate. */
  readonly options?: readonly PredictionOption[];
  /** One line of setup above the question, e.g. the claim being tested. */
  readonly context?: string;
  /** Free-text mode only. */
  readonly placeholder?: string;
  /** Replaces the default "Erst schätzen" kicker. */
  readonly kicker?: string;
  readonly className?: string;
}

interface PromptCopy {
  readonly kicker: string;
  readonly commit: string;
  readonly reset: string;
  readonly placeholder: string;
  readonly revealLabel: string;
}

const COPY: Readonly<Record<Locale, PromptCopy>> = {
  de: {
    kicker: "Erst schätzen",
    commit: "Auflösen",
    reset: "Nochmal schätzen",
    placeholder: "Deine Schätzung",
    revealLabel: "Auflösung",
  },
  en: {
    kicker: "Predict first",
    commit: "Reveal",
    reset: "Predict again",
    placeholder: "Your estimate",
    revealLabel: "Revealed answer",
  },
};

const CONTROL_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function resolveAnswer(
  selected: PredictionOption | null,
  typed: string,
): PredictionAnswer | null {
  if (selected) return { optionId: selected.id, text: selected.label };
  if (typed.length > 0) return { optionId: null, text: typed };
  return null;
}

function renderReveal(
  children: PredictionPromptProps["children"],
  answer: PredictionAnswer,
): ReactNode {
  return typeof children === "function" ? children(answer) : children;
}

export function PredictionPrompt({
  question,
  children,
  locale,
  options,
  context,
  placeholder,
  kicker,
  className,
}: PredictionPromptProps) {
  const copy = COPY[locale];
  const baseId = useId();
  const questionId = `${baseId}-question`;
  const revealId = `${baseId}-reveal`;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [committed, setCommitted] = useState(false);

  const optionList = options ?? [];
  const selectedIndex = optionList.findIndex(
    (option) => option.id === selectedId,
  );
  const selected = selectedIndex >= 0 ? optionList[selectedIndex] : null;
  const answer = resolveAnswer(selected, draft.trim());
  const revealed = committed && answer !== null;

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || committed || answer === null) return;
    event.preventDefault();
    setCommitted(true);
  };

  return (
    <div
      className={cn(
        "border-l-[3px] border-brand-orange bg-card/40 p-5 md:p-6",
        className,
      )}
      data-prediction-prompt
      data-revealed={revealed ? "1" : "0"}
    >
      <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        <span aria-hidden="true">◆ </span>
        {kicker ?? copy.kicker}
      </p>

      {context && (
        <p className="mt-3 max-w-[640px] text-[14px] leading-[1.6] text-muted-foreground">
          {context}
        </p>
      )}
      <p
        id={questionId}
        className="mt-3 max-w-[640px] text-[17px] font-semibold leading-[1.35] tracking-[-0.01em] text-foreground"
      >
        {question}
      </p>

      {optionList.length > 0 ? (
        <div
          role="radiogroup"
          aria-labelledby={questionId}
          data-roving-group
          className="mt-4 flex flex-wrap gap-2"
        >
          {optionList.map((option, index) => {
            const active = option.id === selectedId;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={committed}
                data-roving-item
                tabIndex={rovingTabIndex(
                  selectedIndex >= 0 ? selectedIndex : null,
                  index,
                )}
                onClick={() => setSelectedId(option.id)}
                onKeyDown={(event) =>
                  handleRovingFocusKeyDown(event, {
                    currentIndex: index,
                    itemCount: optionList.length,
                    onMove: (next) => setSelectedId(optionList[next].id),
                  })
                }
                className={cn(
                  "min-h-11 border-2 px-4 py-2 text-left text-[14px] leading-[1.4] text-foreground transition-colors",
                  CONTROL_FOCUS,
                  active
                    ? "border-brand-orange bg-brand-orange/10 font-semibold"
                    : "border-border bg-background",
                  // A committed pill is disabled, and :hover still matches on
                  // disabled buttons — so the hover cue has to be withdrawn.
                  !active && !committed && "hover:border-brand-orange/60",
                  committed ? "cursor-default" : "cursor-pointer",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleInputKeyDown}
          readOnly={committed}
          aria-labelledby={questionId}
          placeholder={placeholder ?? copy.placeholder}
          className={cn(
            "mt-4 block min-h-11 w-full max-w-[420px] border-2 border-border bg-background px-3 py-2 text-[15px] leading-[1.5] text-foreground placeholder:text-muted-foreground",
            "focus-visible:border-brand-orange focus-visible:outline-none",
          )}
        />
      )}

      <button
        type="button"
        onClick={() => setCommitted((value) => !value)}
        disabled={!committed && answer === null}
        aria-expanded={revealed}
        aria-controls={revealId}
        className={cn(
          "mt-5 inline-flex min-h-11 cursor-pointer items-center border-2 px-5 py-2.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.14em] transition-[transform,box-shadow,border-color,background-color]",
          CONTROL_FOCUS,
          "disabled:pointer-events-none disabled:opacity-40",
          committed
            ? "border-border bg-card text-foreground hover:border-foreground/40"
            : "border-foreground bg-brand-orange text-white shadow-[3px_3px_0_0_var(--color-foreground)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)] active:translate-y-0 active:shadow-[2px_2px_0_0_var(--color-foreground)]",
        )}
      >
        {committed ? copy.reset : copy.commit}
      </button>

      {/* Kept mounted so `aria-controls` always resolves; `hidden` takes it out
          of the accessibility tree until the learner has committed. */}
      <div
        id={revealId}
        role="group"
        aria-label={copy.revealLabel}
        hidden={!revealed}
        className="mt-5"
      >
        {revealed && answer ? renderReveal(children, answer) : null}
      </div>
    </div>
  );
}
