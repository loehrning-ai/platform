"use client";

import { useState } from "react";
import { toSentences } from "@/lib/demo-sentences";

/**
 * The caption in the dock: what just happened and why it matters. On a short
 * screen, and while a part is picked, it shows its first sentence whole and a
 * "Weiterlesen" pill for the rest, so the stage keeps its room and no word is
 * ever cut; the pill opens the rest in place. Screen readers always get the
 * whole caption (the rest is hidden visually only). A new caption closes it.
 */
export function DockCaption({
  sentences,
  more,
  less,
  picking = false,
}: {
  readonly sentences: readonly string[];
  readonly more: string;
  readonly less: string;
  /** A part is picked: the caption folds to its first sentence on every screen (the stage needs the room). */
  readonly picking?: boolean;
}) {
  const parts = toSentences(sentences);
  const text = parts.join(" ");
  const [open, setOpen] = useState(false);
  const [shownText, setShownText] = useState(text);

  if (shownText !== text) {
    setShownText(text);
    setOpen(false);
  }

  if (parts.length === 0) return null;
  const rest = parts.slice(1);
  return (
    <div className="w4-caption" data-open={open ? "" : undefined} data-picking={picking ? "" : undefined} data-w4-caption="">
      <div className="w4-caption-text" aria-live="polite">
        <p>{parts[0]}</p>
        {rest.length > 0 ? <p className="w4-caption-rest">{rest.join(" ")}</p> : null}
      </div>
      {rest.length > 0 ? (
        <button type="button" className="w4-caption-more" aria-expanded={open} onClick={() => setOpen((value) => !value)} data-w4-caption-more="">
          {open ? less : more}
        </button>
      ) : null}
    </div>
  );
}
