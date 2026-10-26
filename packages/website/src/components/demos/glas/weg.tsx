"use client";

import type { ReactNode } from "react";
import { cx } from "@/components/werk/cx";
import { GlasButton } from "./button";
import { GlasChip } from "./chip";

export interface WegStep {
  readonly id: string;
  /** The step's name ("Schätzen"), used for the dot's accessible name. */
  readonly label: string;
}

export interface WegCopy {
  /** "Schritt {n} von {total}" for the dot names. */
  readonly stepOf: (n: number, total: number) => string;
  readonly prev: string;
  /** Next with the step's name when there is one ("Weiter: die Spanne"). */
  readonly next: string;
  /** A short "Weiter" a compact dock shows on a phone; the long one stays the accessible name. */
  readonly nextShort?: string;
  readonly toGuide: string;
  readonly nav: string;
}

/**
 * Weg (glass-spec 4.9): the guided path. One dot per step, the current one a
 * Mennige capsule, done steps filled, upcoming ones rings (shape, never
 * colour alone). Next to it the step as a sentence. "Weiter" turns prominent
 * when the step is done. In free play it collapses into the "Zur Führung"
 * chip. It is drawn as fills: put it inside the dock (one glass surface).
 */
export function GlasWeg({
  steps,
  current,
  doneUpTo,
  sentence,
  onJump,
  onPrev,
  onNext,
  nextReady,
  canNext = true,
  free,
  onToGuide,
  copy,
  className,
  trailing,
}: {
  readonly steps: readonly WegStep[];
  readonly current: number;
  /** Steps before this index count as done. */
  readonly doneUpTo: number;
  /** The step as a full sentence ("Schritt 2 von 5: Du setzt die Gewichte."). */
  readonly sentence: ReactNode;
  readonly onJump: (index: number) => void;
  readonly onPrev: () => void;
  readonly onNext: () => void;
  /** The step is done: "Weiter" becomes the prominent action. */
  readonly nextReady: boolean;
  readonly canNext?: boolean;
  readonly free: boolean;
  readonly onToGuide: () => void;
  readonly copy: WegCopy;
  readonly className?: string;
  /** Extra controls at the end of the row (desktop). */
  readonly trailing?: ReactNode;
}) {
  if (free) {
    return (
      <div className={cx("glas-weg", className)} data-weg-free="">
        <GlasButton variant="fill" size="compact" icon="back" onClick={onToGuide} data-weg-guide="">
          {copy.toGuide}
        </GlasButton>
        {trailing}
      </div>
    );
  }
  return (
    <nav className={cx("glas-weg", className)} aria-label={copy.nav} data-weg="">
      <ol className="glas-weg-dots">
        {steps.map((step, index) => {
          const state = index === current ? "current" : index < doneUpTo ? "done" : "next";
          return (
            <li key={step.id}>
              <button
                type="button"
                className="glas-weg-dot"
                data-state={state}
                aria-current={index === current ? "step" : undefined}
                aria-label={`${copy.stepOf(index + 1, steps.length)}: ${step.label}`}
                onClick={() => onJump(index)}
              >
                <span />
              </button>
            </li>
          );
        })}
      </ol>
      <p className="glas-weg-step" aria-live="polite">
        {sentence}
      </p>
      <span className="glas-weg-buttons">
        <GlasButton variant="icon" size="compact" icon="back" label={copy.prev} onClick={onPrev} disabled={current === 0} aria-keyshortcuts="ArrowLeft" data-demo-prev="" />
        {canNext ? (
          <GlasButton
            variant={nextReady ? "prominent" : "fill"}
            size="compact"
            trailingIcon="forward"
            onClick={onNext}
            aria-keyshortcuts="ArrowRight"
            data-demo-next=""
          >
            {copy.nextShort ? (
              <>
                <span className="glas-weg-next-long">{copy.next}</span>
                <span className="glas-weg-next-short" aria-hidden="true">
                  {copy.nextShort}
                </span>
              </>
            ) : (
              copy.next
            )}
          </GlasButton>
        ) : null}
      </span>
      {trailing}
    </nav>
  );
}

/** A status chip pair the demos reuse: "Vorschlag übernommen" after a skipped estimate. */
export function SkippedCommitChip({ children }: { readonly children: ReactNode }) {
  return <GlasChip kind="status">{children}</GlasChip>;
}
