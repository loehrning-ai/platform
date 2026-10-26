"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { WithTerms } from "./term";

interface GlossaryTerm {
  readonly term: string;
  readonly text: string;
}

/**
 * The caption in the dock: what just happened and why it matters
 * (language-standard B.6). On a short phone it shows three lines and a
 * "Weiterlesen" pill when the text runs longer, so the tub keeps its room;
 * the pill opens the rest in place. Screen readers always get the whole
 * caption (the clamp is visual only). A new caption closes it again.
 */
export function DockCaption({ sentences, more, less, extra, terms = [] }: { readonly sentences: readonly string[]; readonly more: string; readonly less: string; readonly extra?: ReactNode; readonly terms?: readonly GlossaryTerm[] }) {
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
    <div className="w03-caption" data-open={open ? "" : undefined} data-w03-caption="">
      <div ref={box} className="w03-caption-text" aria-live="polite">
        {sentences.map((sentence, index) => {
          // Each glossary term is explained where it first appears in the caption, once.
          const earlier = sentences.slice(0, index).join(" ");
          const fresh = terms.filter((entry) => !earlier.includes(entry.term));
          return (
            <p key={sentence}>
              <WithTerms text={sentence} terms={fresh} />
            </p>
          );
        })}
      </div>
      <div className="w03-caption-row">
        {overflows || open ? (
          <button type="button" className="w03-caption-more" aria-expanded={open} onClick={() => setOpen((value) => !value)} data-w03-caption-more="">
            {open ? less : more}
          </button>
        ) : null}
        {extra}
      </div>
    </div>
  );
}
