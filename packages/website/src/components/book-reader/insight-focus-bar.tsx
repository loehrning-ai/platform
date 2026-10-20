"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { subscribeStage, type StageState } from "./stage/stage-protocol";
import "./insight-focus-bar.css";

/**
 * The reader bar of an insight chapter below lg (the thumb zone). While a hero
 * stage is pinned in view it IS the step control: Zurück, "Schritt 2 von 4",
 * Weiter, wired to the stage's own buttons so the stage keeps one source of
 * truth. The chapter jump appears only when no stage is in play, and in the
 * stage's last step it takes the place of the step Weiter ("Nächstes Kapitel").
 * The counter always says what it counts: "Kapitel 4 von 9" is a chapter, "Schritt
 * 2 von 4" a step. Without script, and before it runs, the bar is the chapter bar.
 * Hover, focus and press use the anti colours; targets are 48px; no mono type.
 */

const COPY = {
  de: {
    chapter: (n: number, total: number) => `Kapitel ${n} von ${total}`,
    step: (n: number, total: number) => `Schritt ${n} von ${total}`,
    prev: "Zurück",
    next: "Weiter",
    prevAria: (n: number) => `Zurück zu Schritt ${n}`,
    nextAria: (n: number) => `Weiter zu Schritt ${n}`,
    chapterNext: "Nächstes Kapitel",
    overview: "Zur Übersicht",
    stepsAria: "Schritte der Abbildung",
  },
  en: {
    chapter: (n: number, total: number) => `Chapter ${n} of ${total}`,
    step: (n: number, total: number) => `Step ${n} of ${total}`,
    prev: "Back",
    next: "Next",
    prevAria: (n: number) => `Back to step ${n}`,
    nextAria: (n: number) => `Next to step ${n}`,
    chapterNext: "Next chapter",
    overview: "To the overview",
    stepsAria: "Steps of the figure",
  },
} as const;

export interface InsightFocusBarProps {
  readonly locale: "de" | "en";
  readonly chapterNumber: number;
  readonly chapterTotal: number;
  /** The next chapter, or the book overview after the last one. */
  readonly next: { readonly href: string; readonly ariaLabel: string; readonly isOverview: boolean };
}

interface Active {
  readonly root: HTMLElement;
  readonly state: StageState;
}

/** The stage that is in play: the first one that has begun and has not scrolled out of the top. */
function findActive(): HTMLElement | null {
  const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter-stage]"));
  const h = window.innerHeight;
  for (const root of roots) {
    const rect = root.getBoundingClientRect();
    if (rect.top < h * 0.75 && rect.bottom > h * 0.55) return root;
  }
  return null;
}

export function InsightFocusBar({ locale, chapterNumber, chapterTotal, next }: InsightFocusBarProps) {
  const copy = COPY[locale];
  const [active, setActive] = useState<Active | null>(null);

  useEffect(() => {
    let frame = 0;
    let unsubscribe: (() => void) | null = null;
    let current: HTMLElement | null = null;
    const choose = (): void => {
      frame = 0;
      const root = findActive();
      if (root === current) return;
      unsubscribe?.();
      unsubscribe = null;
      current = root;
      if (root) {
        // The bar only shows the step, so a scrub frame that moves the figure but not the step re-renders nothing.
        unsubscribe = subscribeStage(root, (state) =>
          setActive((prev) =>
            prev && prev.root === root && prev.state.step === state.step && prev.state.steps === state.steps && prev.state.mode === state.mode
              ? prev
              : { root, state },
          ),
        );
      } else {
        setActive(null);
      }
    };
    const schedule = (): void => {
      if (frame === 0) frame = window.requestAnimationFrame(choose);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== 0) window.cancelAnimationFrame(frame);
      unsubscribe?.();
    };
  }, []);

  const stage = active && active.state.mode === "scrub" ? active : null;
  const nextLabel = next.isOverview ? copy.overview : copy.chapterNext;

  const press = (root: HTMLElement, which: "prev" | "next"): void => {
    root.querySelector<HTMLElement>(`[data-cs="${which}"]`)?.click();
  };

  const chapterLink = (
    <Link href={next.href} aria-label={next.ariaLabel} data-reader-focus-action className="ifb-btn ifb-btn--primary">
      <span>{nextLabel}</span>
      <ArrowRight aria-hidden="true" className="ifb-icon" />
    </Link>
  );

  let body: React.ReactNode;
  if (stage) {
    const { step, steps } = stage.state;
    const lastStep = step >= steps - 1;
    body = (
      <div role="group" aria-label={copy.stepsAria} className="ifb-row" data-reader-focus-bar-row>
        <button
          type="button"
          className="ifb-btn"
          aria-disabled={step <= 0 ? "true" : undefined}
          aria-label={copy.prevAria(Math.max(1, step))}
          onClick={() => step > 0 && press(stage.root, "prev")}
        >
          <ArrowLeft aria-hidden="true" className="ifb-icon" />
          <span className="ifb-btn-label">{copy.prev}</span>
        </button>
        <p className="ifb-count" aria-live="polite" data-reader-focus-position>
          {copy.step(step + 1, steps)}
        </p>
        {lastStep ? (
          chapterLink
        ) : (
          <button
            type="button"
            className="ifb-btn ifb-btn--primary"
            aria-label={copy.nextAria(step + 2)}
            data-reader-focus-action
            onClick={() => press(stage.root, "next")}
          >
            <span>{copy.next}</span>
            <ArrowRight aria-hidden="true" className="ifb-icon" />
          </button>
        )}
      </div>
    );
  } else {
    body = (
      <div className="ifb-row" data-reader-focus-bar-row>
        <p className="ifb-count ifb-count--start" data-reader-focus-position>
          {copy.chapter(chapterNumber, chapterTotal)}
        </p>
        {chapterLink}
      </div>
    );
  }

  return (
    <div data-reader-focus-bar data-insight-focus-bar data-bar-mode={stage ? "step" : "chapter"} className="ifb no-print">
      {body}
    </div>
  );
}
