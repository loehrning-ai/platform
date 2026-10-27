"use client";

import { useState } from "react";
import { toSentences } from "@/lib/demo-sentences";

/**
 * The caption in the dock: what just happened and why it matters. On a short
 * phone (under 760px tall) it shows its first sentence whole and a "Mehr"
 * pill for the rest, so the data keeps its room and no word is ever cut; the
 * pill opens the rest in place. Screen readers always get the whole caption
 * (the rest is hidden visually only). A new caption closes it again.
 */
export function DockCaption({ sentences, more, less }: { readonly sentences: readonly string[]; readonly more: string; readonly less: string }) {
  const parts = toSentences(sentences);
  const text = parts.join(" ");
  const [open, setOpen] = useState(false);
  const [shownText, setShownText] = useState(text);

  if (shownText !== text) {
    setShownText(text);
    setOpen(false);
  }

  const rest = parts.slice(1);
  return (
    <div className="w02-caption" data-open={open ? "" : undefined} data-w02-caption="">
      <div className="w02-caption-text" aria-live="polite">
        <p>{parts[0]}</p>
        {rest.length > 0 ? <p className="w02-caption-rest">{rest.join(" ")}</p> : null}
      </div>
      {rest.length > 0 ? (
        <button type="button" className="w02-caption-more" aria-expanded={open} onClick={() => setOpen((value) => !value)} data-w02-caption-more="">
          {open ? less : more}
        </button>
      ) : null}
    </div>
  );
}
