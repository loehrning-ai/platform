"use client";

import type { ReactNode } from "react";
import { cx } from "@/components/werk/cx";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { useBeatClock } from "./beat-clock";

function RestartGlyph() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" className="size-4 shrink-0">
      <path d="M4.5 9.5a5.5 5.5 0 1 0 1.8-4.1" />
      <path d="M4 2.5v4h4" />
    </svg>
  );
}

/** "Von vorn" / "Start over": the visible restart, the same as r and Shift+R. Top right of the stage. */
export function RestartButton({ className }: { readonly className?: string }) {
  const { restart, locale, rewinding } = useBeatClock();
  return (
    <button
      type="button"
      className={cx("demo-restart", className)}
      data-demo-restart=""
      aria-keyshortcuts="R Shift+R"
      disabled={rewinding}
      onClick={restart}
    >
      <RestartGlyph />
      <span>{DEMOS_PAGE_COPY[locale].shell.restart}</span>
    </button>
  );
}

/**
 * The stage: a fixed-height frame (--demo-stage-h, from the fold), the
 * restart control top right, and the beat caption under it (two lines at
 * most). The demo draws inside as a pure function of the clock.
 */
export function DemoStage({
  children,
  caption,
  label,
  className,
}: {
  readonly children: ReactNode;
  /** The beat caption: one sentence, two lines at most. Beat 1 carries the question. */
  readonly caption?: ReactNode;
  /** Accessible name of the stage. */
  readonly label: string;
  readonly className?: string;
}) {
  const { registerStage } = useBeatClock();
  return (
    <div className="demo-stage-wrap">
      <figure ref={registerStage} className={cx("demo-stage", className)} data-demo-stage="" aria-label={label}>
        {children}
        <RestartButton />
      </figure>
      {caption ? (
        <p className="demo-caption" data-demo-caption="" aria-live="polite">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

/** "Weiter" / "Next": shown once the beat is complete (and committed, for a commit beat). */
export function NextButton() {
  const { canAdvance, next, locale } = useBeatClock();
  if (!canAdvance) return null;
  return (
    <button type="button" className="demo-next" data-demo-next="" aria-keyshortcuts="ArrowRight" onClick={next}>
      <span>{DEMOS_PAGE_COPY[locale].shell.next}</span>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" className="size-4">
        <path d="M3 10h13M11 5l5 5-5 5" />
      </svg>
    </button>
  );
}

/** The plain privacy line, directly under the lever on a phone (the desktop column carries its own). */
export function PrivacyLine({ className }: { readonly className?: string }) {
  const { locale } = useBeatClock();
  return (
    <p className={cx("demo-privacy", className)} data-demo-privacy="">
      {DEMOS_PAGE_COPY[locale].shell.privacy}
    </p>
  );
}

/**
 * The one primary lever, in the thumb zone: the demo's control on the left,
 * "Weiter" on the right, the privacy line under it. Its bottom edge is what
 * the fold test measures at 390 x 664.
 */
export function DemoLever({
  children,
  className,
  rows = 1,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  /** A lever with two rows of 44px choices: on a phone the stage gives up one row, so the lever stays above the fold. */
  readonly rows?: 1 | 2;
}) {
  return (
    <div className="demo-lever-wrap" data-lever-rows={rows === 2 ? "2" : undefined}>
      <div className={cx("demo-lever", className)} data-demo-lever="">
        <div className="demo-lever-control">{children}</div>
        <NextButton />
      </div>
      <PrivacyLine className="lg:hidden" />
    </div>
  );
}
