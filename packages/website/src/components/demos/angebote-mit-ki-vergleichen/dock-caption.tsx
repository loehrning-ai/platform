"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * The caption in the dock: what just happened and why it matters. On a short
 * phone (under 760px tall) it shows three lines and a "Mehr" pill when the
 * text runs longer, so the data keeps its room; the pill opens the rest in
 * place. Screen readers always get the whole caption (the clamp is visual).
 * A new caption closes it again.
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

  return (
    <div className="av4-caption" data-open={open ? "" : undefined} data-av4-caption="">
      <div ref={box} className="av4-caption-text" aria-live="polite">
        {sentences.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}
      </div>
      {overflows || open ? (
        <button type="button" className="av4-caption-more" aria-expanded={open} onClick={() => setOpen((value) => !value)} data-av4-caption-more="">
          {open ? less : more}
        </button>
      ) : null}
    </div>
  );
}
