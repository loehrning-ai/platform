"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { stepCount, stepProgress, type FigureSpecOf } from "@/lib/figures";
import { FigureShell } from "./figure-shell";
import { FigureSvg } from "./figure-svg";
import type { StoryStep } from "./fixtures.provisional";
import { useMediaQuery, usePrefersReducedMotion, useTween } from "./use-motion";

interface WaterfallStoryProps {
  /** The C4 waterfall with its `steps`; step k of the spec belongs to `steps[k]`. */
  readonly spec: FigureSpecOf<"waterfall">;
  readonly steps: readonly StoryStep[];
  readonly provisional?: boolean;
  readonly csvHref?: string;
}

/**
 * Thin band across the viewport: the step card on it is the active one. On a
 * phone the stage covers the top, so the band sits in the text area below it
 * (about 68 percent down); beside the stage it is the middle of the screen.
 */
const BAND_PHONE = "-68% 0px -30% 0px";
const BAND_WIDE = "-50% 0px -49% 0px";
/** One structural reveal between two steps, inside the 250 to 450 ms the motion policy allows. */
const STEP_MS = 400;

/**
 * C4, the one sticky-stage scrollytelling of the book. A single
 * IntersectionObserver on the step cards sets the active step (data-step);
 * the stage draws renderFigure(spec, stepProgress(spec, step)). Step buttons
 * give the keyboard the same path. Reduced motion, no JS (scripting: none) and
 * short viewports stack every step as its own static figure instead; that is
 * decided in CSS only, so hydration never changes the layout.
 */
export function WaterfallStory({ spec, steps, provisional, csvHref }: WaterfallStoryProps) {
  const total = Math.min(stepCount(spec), steps.length);
  const root = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(0);
  const reduced = usePrefersReducedMotion();
  const wide = useMediaQuery("(min-width: 1024px)");
  const progress = useTween(stepProgress(spec, step), STEP_MS, !reduced);
  const current = steps[step];

  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const cards = Array.from(node.querySelectorAll<HTMLElement>("[data-step-index]"));
    const inBand = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.stepIndex);
          if (entry.isIntersecting) inBand.add(index);
          else inBand.delete(index);
        }
        if (inBand.size > 0) setStep(Math.max(...inBand));
      },
      { rootMargin: wide ? BAND_WIDE : BAND_PHONE, threshold: 0 },
    );
    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, [wide]);

  const goTo = useCallback(
    (index: number) => {
      setStep(index);
      const card = root.current?.querySelector<HTMLElement>(`[data-step-index="${index}"]`);
      if (!card) return;
      // Put the card where the observer band reads it: centred beside the stage, or in the text area below it.
      const rect = card.getBoundingClientRect();
      const wanted = wide ? (window.innerHeight - rect.height) / 2 : window.innerHeight * 0.67;
      window.scrollBy({ top: rect.top - wanted, behavior: "auto" });
    },
    [wide],
  );

  return (
    <FigureShell spec={spec} provisional={provisional} csvHref={csvHref} className="bf-wf-figure">
      <div ref={root} className="bf-wf" data-step={step}>
        <div className="bf-wf-stage">
          <p className="bf-wf-count" aria-live="polite">
            Schritt {step + 1} von {total}
            <span className="bf-visually-hidden">: {current?.title}</span>
          </p>
          <p className="bf-wf-readout" aria-hidden="true">
            <span className="bf-wf-num">{current?.readout}</span>
            <span className="bf-wf-numlabel">{current?.readoutLabel}</span>
          </p>
          <div className="bf-wf-chart">
            <FigureSvg spec={spec} progress={progress} layout="compact" />
          </div>
          <nav className="bf-wf-nav" aria-label="Schritte der Abbildung">
            {steps.slice(0, total).map((s, index) => (
              <button
                key={s.id}
                type="button"
                className="bf-chip"
                aria-current={index === step ? "step" : undefined}
                aria-pressed={index === step}
                aria-label={`Schritt ${index + 1}: ${s.title}`}
                onClick={() => goTo(index)}
              >
                <span className="bf-chip-num" aria-hidden="true">{index + 1}</span>
                <span className="bf-chip-label" aria-hidden="true">{spec.steps?.[index]?.label ?? s.title}</span>
              </button>
            ))}
          </nav>
        </div>
        <ol className="bf-wf-steps">
          {steps.slice(0, total).map((s, index) => (
            <li key={s.id} className="bf-wf-step" data-step-index={index} data-active={index === step ? "true" : undefined}>
              <p className="bf-kicker">
                Schritt {index + 1} von {total}
              </p>
              <h3 className="bf-wf-heading">{s.title}</h3>
              <p className="bf-wf-readout bf-wf-readout--card">
                <span className="bf-wf-num">{s.readout}</span>
                <span className="bf-wf-numlabel">{s.readoutLabel}</span>
              </p>
              <p className="bf-wf-body">{s.body}</p>
              <div className="bf-wf-static">
                <FigureSvg
                  spec={{ ...spec, id: `${spec.id}-s${index + 1}`, alt: s.alt, title: `${spec.title}, Schritt ${index + 1}` }}
                  progress={stepProgress(spec, index)}
                  layout="compact"
                />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </FigureShell>
  );
}
