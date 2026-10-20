import type { CSSProperties, ReactNode } from "react";
import { textWidth } from "@/lib/figures/svg";
import { SourceLine, type SourceLineFields } from "@/components/book-figures/shared/source-line";
import { StageEnhancer } from "./stage-enhancer";
import type { StageStepCopy } from "./stage-protocol";
import "./chapter-stage.css";

/**
 * The hero stage of a chapter (DIRECTION section 3): a pinned stage with the
 * figure, the giant numeral, the claim and the unit line; 3 to 4 step cards
 * that scroll past it; Weiter and Zurück; "Schritt 2 von 4" as real text; the
 * visible source line.
 *
 * The shell is server markup. Its base layout is the scrub layout, and the
 * static layout (steps stacked with their numerals, the figure at progress 1)
 * is a CSS decision for reduced motion, no script, short screens, print and
 * the chapter pause switch, so hydration changes nothing. The only script is
 * <StageEnhancer>, a hostless island that starts after the browser is idle:
 * until then Weiter and Zurück do nothing (and without script the whole control
 * row is hidden: the steps are stacked as text).
 *
 * The figure (children) is the engine's: it learns the step and the progress
 * through the stage protocol (stage-protocol.ts, use-chapter-stage.ts) and
 * draws progress 1 whenever it hears nothing.
 */

export interface ChapterStageProps {
  /** Unique id of the stage in the page, normally the figure id ("h01"). */
  readonly id: string;
  /** Accessible name of the stage. */
  readonly label: string;
  readonly steps: readonly StageStepCopy[];
  /** The figure island, built with its bare option (the shell draws numeral and claim). */
  readonly children: ReactNode;
  readonly source: SourceLineFields;
  readonly locale?: "de" | "en";
  readonly csv?: readonly { readonly href: string; readonly label: string; readonly fileName: string }[];
}

const COPY_BY_LOCALE = {
  de: {
    step: (n: number, total: number) => `Schritt ${n} von ${total}`,
    prev: "Zurück",
    next: "Weiter",
    prevAria: (n: number) => `Zurück zu Schritt ${n}`,
    nextAria: (n: number) => `Weiter zu Schritt ${n}`,
    stepsAria: "Schritte der Abbildung",
  },
  en: {
    step: (n: number, total: number) => `Step ${n} of ${total}`,
    prev: "Back",
    next: "Next",
    prevAria: (n: number) => `Back to step ${n}`,
    nextAria: (n: number) => `Next to step ${n}`,
    stepsAria: "Steps of the figure",
  },
} as const;

export function stepAnchor(id: string, index: number): string {
  return `${id}-schritt-${index + 1}`;
}

/**
 * Width of a numeral in em (an estimate with a safety margin). The stylesheet divides the width of the box the
 * numeral sits in by this, so the whole string, unit sign included ("46 %"), always fits its box: the numeral is
 * scaled down, never clipped and never wrapped.
 */
export function numeralEm(numeral: string): number {
  const letterSpacing = -0.045 * [...numeral].length;
  return Math.round((textWidth(numeral, 1, 700) + letterSpacing) * 1.06 * 100) / 100;
}

const emStyle = (numeral: string): CSSProperties => ({ "--cs-em": numeralEm(numeral) }) as CSSProperties;

export function ChapterStage({ id, label, steps, children, source, csv, locale = "de" }: ChapterStageProps) {
  const COPY = COPY_BY_LOCALE[locale];
  const total = steps.length;
  const last = total - 1;
  return (
    <>
      <section
        className="cs"
        id={`stage-${id}`}
        aria-label={label}
        data-chapter-stage={id}
        data-mode="static"
        data-step={last}
        data-steps={total}
      >
        <div className="cs-pin" data-cs-pin>
          <div className="cs-heads">
            {steps.map((step, i) => (
              <div key={step.id} className="cs-head" data-for={i} style={step.numeral ? emStyle(step.numeral) : undefined}>
                {step.numeral ? (
                  <p className="cs-numeral" data-cs-numeral>
                    {step.numeral}
                  </p>
                ) : null}
                {step.claim ? <p className="cs-claim" data-cs-claim>{step.claim}</p> : null}
              </div>
            ))}
          </div>
          <div className="cs-view" data-chapter-stage-view>
            {children}
          </div>
          {steps.some((s) => s.unit) ? (
            <p className="cs-unit" data-cs-unit>
              {steps.map((step, i) =>
                step.unit ? (
                  <span key={step.id} className="cs-unit-text" data-for={i}>
                    {step.unit}
                  </span>
                ) : null,
              )}
            </p>
          ) : null}
          <div className="cs-ctl" role="group" aria-label={COPY.stepsAria}>
            <button
              type="button"
              className="cs-btn"
              data-cs="prev"
              aria-disabled={last === 0 ? "true" : undefined}
              aria-label={COPY.prevAria(Math.max(1, last))}
            >
              <span aria-hidden="true">←</span> {COPY.prev}
            </button>
            <p className="cs-count" aria-live="polite" data-cs-count>
              {COPY.step(total, total)}
            </p>
            <button type="button" className="cs-btn" data-cs="next" aria-disabled="true" aria-label={COPY.nextAria(total)}>
              {COPY.next} <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        <ol className="cs-steps">
          {steps.map((step, i) => (
            <li key={step.id} id={stepAnchor(id, i)} className="cs-step" data-step-index={i}>
              <div className="cs-card">
                <p className="cs-card-label">{COPY.step(i + 1, total)}</p>
                {step.numeral ? <p className="cs-step-numeral" style={emStyle(step.numeral)}>{step.numeral}</p> : null}
                {step.claim ? <p className="cs-step-claim">{step.claim}</p> : null}
                <p className="cs-card-text">{step.text}</p>
                {step.unit ? <p className="cs-step-unit">{step.unit}</p> : null}
              </div>
            </li>
          ))}
        </ol>
        <div className="cs-source">
          <SourceLine fields={source} csv={csv} />
        </div>
      </section>
      <StageEnhancer stageId={id} />
    </>
  );
}
