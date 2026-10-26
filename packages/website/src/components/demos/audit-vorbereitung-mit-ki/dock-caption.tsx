"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * The caption in the dock: what just happened and why it matters, in full
 * sentences. On a short phone it shows two lines so the board keeps its
 * room; when the text runs longer, "Weiterlesen" opens the rest in place.
 * Screen readers always get the whole caption (the clamp is visual), and a
 * new caption closes it again.
 */
export function DockCaption({ sentences, more, less }: { readonly sentences: readonly string[]; readonly more: string; readonly less: string }) {
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
  }, [text, open]);

  if (sentences.length === 0) return null;
  const foldable = overflows || open;
  return (
    <div className="w05-caption" data-open={open ? "" : undefined} data-w05-caption="">
      <div ref={box} className="w05-caption-text" aria-live="polite">
        {sentences.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}
      </div>
      {foldable ? (
        <button type="button" className="w05-caption-more" aria-expanded={open} onClick={() => setOpen((value) => !value)} data-w05-caption-more="">
          {open ? less : more}
        </button>
      ) : null}
    </div>
  );
}
