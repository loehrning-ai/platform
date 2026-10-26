"use client";

import type { ReactNode } from "react";
import { WithTerms } from "./term";

interface GlossaryTerm {
  readonly term: string;
  readonly text: string;
}

/** The terms that appear in the caption, each once, in the order the caption uses them. */
function usedTerms(sentences: readonly string[], terms: readonly GlossaryTerm[]): readonly GlossaryTerm[] {
  const text = sentences.join(" ");
  return terms.filter((entry) => text.includes(entry.term)).sort((a, b) => text.indexOf(a.term) - text.indexOf(b.term));
}

/**
 * The caption: what just happened and why it matters (language-standard B.6).
 *
 * "full" (the desktop side card) shows every sentence, each glossary term
 * underlined where it first appears, with its definition on hover or tap.
 *
 * "peek" (the phone dock) keeps the dock to one small band so the picture
 * keeps its room: the first two lines, which always start with what to do
 * next, as one button that opens the whole caption in a sheet. Screen readers
 * hear the whole caption through the live region either way.
 */
export function DockCaption({
  sentences,
  extra,
  terms = [],
  mode,
  onPeek,
  peekLabel,
}: {
  readonly sentences: readonly string[];
  readonly extra?: ReactNode;
  readonly terms?: readonly GlossaryTerm[];
  readonly mode: "full" | "peek";
  /** Opens the whole caption (peek mode). */
  readonly onPeek?: () => void;
  /** The button's name in peek mode ("Weiterlesen"). */
  readonly peekLabel?: string;
}) {
  const text = sentences.join(" ");
  if (mode === "peek") {
    return (
      <div className="w03-caption" data-peek="" data-w03-caption="">
        <p className="sr-only" aria-live="polite">
          {text}
        </p>
        <button type="button" className="w03-peek" onClick={onPeek} aria-haspopup="dialog" data-w03-caption-more="">
          <span className="w03-peek-text" aria-hidden="true">
            {text}
          </span>
          <span className="sr-only">{peekLabel}</span>
          <svg viewBox="0 0 16 16" className="w03-peek-chevron" aria-hidden="true">
            <path d="M6 3.5L10.5 8L6 12.5" />
          </svg>
        </button>
      </div>
    );
  }
  return (
    <div className="w03-caption" data-w03-caption="">
      <div className="w03-caption-text" aria-live="polite">
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
      {extra ? <div className="w03-caption-row">{extra}</div> : null}
    </div>
  );
}

/** The whole caption in the phone's sheet: the sentences, then each term it uses with its definition, then the links. */
export function CaptionSheetBody({ sentences, terms = [], extra }: { readonly sentences: readonly string[]; readonly terms?: readonly GlossaryTerm[]; readonly extra?: ReactNode }) {
  const used = usedTerms(sentences, terms);
  return (
    <div className="w03-caption-sheet" data-w03-caption-sheet="">
      {sentences.map((sentence) => (
        <p key={sentence}>{sentence}</p>
      ))}
      {used.length > 0 ? (
        <dl className="w03-terms">
          {used.map((entry) => (
            <div key={entry.term}>
              <dt>{entry.term}</dt>
              <dd>{entry.text}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {extra ? <div className="w03-caption-row">{extra}</div> : null}
    </div>
  );
}
