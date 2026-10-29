"use client";

import { toSentences } from "@/lib/demo-sentences";
import { Icon } from "./file-chip";

/**
 * The caption on a phone: one line in the dock (the first sentence, at most
 * two lines tall) that opens the whole caption, and the check by hand when
 * the step has one, as a sheet. The chat keeps the room; screen readers get
 * the whole caption as it changes.
 */
export function CaptionLine({
  sentences,
  action,
  label,
  attention = false,
  onOpen,
}: {
  readonly sentences: readonly string[];
  /** The pill's word: "Prüfen" when a check waits, "Mehr" otherwise. */
  readonly action: string;
  /** The accessible name of the line. */
  readonly label: string;
  /** The check waits and has not been opened yet: the pill pulses once (never with reduced motion). */
  readonly attention?: boolean;
  readonly onOpen: () => void;
}) {
  const parts = toSentences(sentences);
  if (parts.length === 0) return null;
  return (
    <div className="w4a-capline-wrap">
      <button type="button" className="w4a-capline" aria-haspopup="dialog" aria-label={`${parts[0]} ${action}: ${label}`} onClick={onOpen} data-w4a-capline="">
        <span className="w4a-capline-text" aria-hidden="true">
          {parts[0]}
        </span>
        <span className="w4a-capline-pill" aria-hidden="true" data-attention={attention ? "" : undefined}>
          {action}
          <Icon name="forward" size={14} />
        </span>
      </button>
      <p className="sr-only" aria-live="polite" data-w4-caption="">
        {parts.join(" ")}
      </p>
    </div>
  );
}
