"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * The caption in the dock: what just happened and why it matters. On a short
 * phone it shows two lines so the stage keeps its room. When the text runs
 * longer, a small "Weiterlesen" mark sits at the end of the last line and the
 * whole caption is its tap target; it opens the rest in place.
 * Screen readers always get the whole caption (the clamp is visual). A new
 * caption closes it again.
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
  /** A part is picked: the caption folds to one line (the stage needs the room). */
  readonly picking?: boolean;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const text = sentences.join(" ");
  const [shownText, setShownText] = useState(text);

  if (shownText !== text) {
    setShownText(text);
    setOpen(false);
  }

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, open, picking]);

  if (sentences.length === 0) return null;
  const foldable = overflows || open;
  return (
    <div className="w4-caption" data-open={open ? "" : undefined} data-picking={picking ? "" : undefined} data-fold={foldable ? "" : undefined} data-w4-caption="">
      <div ref={box} className="w4-caption-text" aria-live="polite">
        {sentences.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}
      </div>
      {foldable ? (
        <button type="button" className="w4-caption-more" aria-expanded={open} onClick={() => setOpen((value) => !value)} data-w4-caption-more="">
          <span className="w4-caption-mark">{open ? less : more}</span>
        </button>
      ) : null}
    </div>
  );
}
