"use client";

import { cx } from "@/components/werk/cx";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { useBeatClock } from "./beat-clock";

/**
 * The beat rail: one mark per beat, each a 44px button, never gated (a
 * skipped commit shows the kit default). Horizontal on a phone (28px of
 * visible height, the hit area overhangs), vertical in the desktop column.
 * The current mark is an ink bar with a Mennige foot; done marks are ink,
 * open marks a hairline, so the state never rests on colour alone.
 */
export function BeatRail({
  orientation,
  className,
}: {
  readonly orientation: "horizontal" | "vertical";
  readonly className?: string;
}) {
  const { beats, index, locale, seek } = useBeatClock();
  const copy = DEMOS_PAGE_COPY[locale].shell;
  const vertical = orientation === "vertical";
  return (
    <nav aria-label={copy.beats} className={cx("demo-rail", className)} data-beat-rail={orientation}>
      <ol className={cx("demo-rail-list", vertical && "is-vertical")}>
        {beats.map((beat, position) => {
          const state = position === index ? "current" : position < index ? "done" : "open";
          const label = beat.label[locale];
          return (
            <li key={beat.id} className="demo-rail-item">
              <button
                type="button"
                className="demo-rail-mark"
                data-state={state}
                data-beat-mark={beat.id}
                aria-current={state === "current" ? "step" : undefined}
                aria-label={copy.beatMark(position + 1, beats.length, label)}
                onClick={() => seek(position, "user")}
              >
                <span className="demo-rail-bar" aria-hidden="true" />
                <span className={cx("demo-rail-label", !vertical && "max-sm:sr-only")}>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
