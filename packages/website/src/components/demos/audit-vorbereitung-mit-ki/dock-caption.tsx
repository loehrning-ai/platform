"use client";

import { useState } from "react";

/**
 * The caption in the dock. On a phone it shows its first sentence and a
 * "Weiterlesen" pill for the rest, so the Claude window and the board keep
 * their room; the pill opens the rest in place. Screen readers always get the
 * whole caption (the rest is hidden visually only). A new caption folds again.
 */
export function DockCaption({
  sentences,
  more,
  less,
}: {
  readonly sentences: readonly string[];
  readonly more: string;
  readonly less: string;
}) {
  const text = sentences.join(" ");
  const [open, setOpen] = useState(false);
  const [shownText, setShownText] = useState(text);
  if (shownText !== text) {
    setShownText(text);
    setOpen(false);
  }
  if (sentences.length === 0) return null;
  const rest = sentences.slice(1);
  return (
    <div className="w05-caption" data-open={open ? "" : undefined} data-w05-caption="">
      <div className="w05-caption-text" aria-live="polite">
        <p>{sentences[0]}</p>
        {rest.length > 0 ? <p className="w05-caption-rest">{rest.join(" ")}</p> : null}
      </div>
      {rest.length > 0 ? (
        <button type="button" className="w05-caption-more" aria-expanded={open} onClick={() => setOpen((value) => !value)} data-w05-caption-more="">
          {open ? less : more}
        </button>
      ) : null}
    </div>
  );
}
