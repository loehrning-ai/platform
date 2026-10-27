"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const POP_WIDTH = 280;
const GUTTER = 12;

/** Where the bubble sits: above the term when there is room, else below, always inside the viewport. */
function placeFor(button: HTMLElement): { readonly left: number; readonly top: number; readonly below: boolean } {
  const box = button.getBoundingClientRect();
  const width = Math.min(POP_WIDTH, window.innerWidth - 2 * GUTTER);
  const left = Math.max(GUTTER, Math.min(box.left, window.innerWidth - width - GUTTER));
  const below = box.top < 120;
  return { left, top: below ? box.bottom + 6 : box.top - 6, below };
}

/**
 * A term with its glossary definition (language-standard C.3, word for
 * word): underlined in the sentence, the definition on hover, focus or tap,
 * on a frosted bubble (content, not glass). The bubble is drawn on the page
 * body, so a clamped caption or a scrolling stage never cuts it off. The
 * definition is also the button's description for screen readers.
 */
export function Term({ term, text }: { readonly term: string; readonly text: string }) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const [place, setPlace] = useState<ReturnType<typeof placeFor> | null>(null);
  const open = place !== null;
  const show = () => {
    if (button.current) setPlace(placeFor(button.current));
  };
  const hide = () => setPlace(null);

  // A scroll or resize moves the term away from its bubble: the bubble closes.
  useEffect(() => {
    if (!open) return;
    const close = () => setPlace(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const bubble = (
    <span
      id={id}
      role="tooltip"
      className="w03-term-pop"
      hidden={!open}
      data-w03-term-pop=""
      data-below={place?.below ? "" : undefined}
      style={place ? { left: place.left, top: place.top } : undefined}
    >
      {text}
    </span>
  );
  return (
    <span className="w03-term-wrap" onPointerEnter={(event) => event.pointerType === "mouse" && show()} onPointerLeave={hide}>
      <button ref={button} type="button" className="w03-term" aria-describedby={id} aria-expanded={open} onClick={() => (open ? hide() : show())} onBlur={hide} data-w03-term="">
        {term}
      </button>
      {open && typeof document !== "undefined" ? createPortal(bubble, document.body) : bubble}
    </span>
  );
}

/**
 * A sentence with its glossary terms underlined: every first appearance of a
 * term from `terms` becomes a Term. Plain text otherwise.
 */
export function WithTerms({ text, terms }: { readonly text: string; readonly terms: readonly { readonly term: string; readonly text: string }[] }) {
  const parts: (string | { readonly term: string; readonly text: string })[] = [text];
  for (const entry of terms) {
    const index = parts.findIndex((part) => typeof part === "string" && part.includes(entry.term));
    if (index < 0) continue;
    const part = parts[index] as string;
    const at = part.indexOf(entry.term);
    parts.splice(index, 1, part.slice(0, at), entry, part.slice(at + entry.term.length));
  }
  return (
    <>
      {parts.map((part, index) => (typeof part === "string" ? part : <Term key={`${part.term}-${index}`} term={part.term} text={part.text} />))}
    </>
  );
}
