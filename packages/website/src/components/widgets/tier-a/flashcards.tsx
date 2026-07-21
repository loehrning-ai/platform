"use client";

import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { useReducedMotion } from "framer-motion";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";

/**
 * Flashcards — flip-card review deck.
 * Ported from `codex/js/widgets.js:428` (Flashcards). German copy.
 *
 *  - CSS 3D flip (front term/question, back answer); space / enter flips.
 *  - Prev / Next buttons + ArrowLeft / ArrowRight when the deck is focused.
 *  - "seen" set tracks visited cards; once every card is seen the checkpoint
 *    is awarded once via the unified store.
 *  - `prefers-reduced-motion`: cross-fades instead of a 3D rotation.
 */

export interface Flashcard {
  /** Optional category/term shown on the front. */
  readonly term?: string;
  /** Front prompt. */
  readonly q: string;
  /** Back answer. */
  readonly a: string;
}

/**
 * Chrome-copy override: kindLabel and every button/hint
 * string below were hardcoded German literals with no override mechanism —
 * `title` was already a plain per-instance prop, but the rest was not.
 * Additive and default-preserving: every field defaults to the original
 * German literal, so the 3 native courses render byte-identical.
 * `ariaLabelTemplate` supports `{current}`/`{total}` placeholders.
 */
export interface FlashcardsWidgetCopy {
  readonly kindLabel: string;
  readonly revealHint: string;
  readonly backLabel: string;
  readonly flipBackHint: string;
  readonly prevLabel: string;
  readonly nextLabel: string;
  readonly emptyLabel: string;
  readonly ariaLabelTemplate: string;
}

const DEFAULT_FLASHCARDS_COPY: FlashcardsWidgetCopy = {
  kindLabel: "Karten",
  revealHint: "Klick zum Aufdecken ↻",
  backLabel: "Antwort",
  flipBackHint: "Klick zum Zurückdrehen",
  prevLabel: "← Zurück",
  nextLabel: "Weiter →",
  emptyLabel: "Keine Karten vorhanden.",
  ariaLabelTemplate: "Karte {current} von {total}. Leertaste oder Klick zum Umdrehen.",
};

function renderAriaLabel(template: string, current: number, total: number): string {
  return template
    .replace("{current}", String(current))
    .replace("{total}", String(total));
}

export interface FlashcardsWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly cards: readonly Flashcard[];
  readonly copy?: Partial<FlashcardsWidgetCopy>;
}

export function FlashcardsWidget({
  lessonId,
  cpId,
  title = "Karteikarten",
  cards,
  copy,
}: FlashcardsWidgetProps): JSX.Element {
  const c = { ...DEFAULT_FLASHCARDS_COPY, ...copy };
  const reduced = useReducedMotion();
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([0]));
  const deckRef = useRef<HTMLDivElement>(null);

  const total = cards.length;

  // Award the checkpoint once every card has been visited.
  useEffect(() => {
    if (total > 0 && seen.size === total) complete();
  }, [seen, total, complete]);

  const go = useCallback(
    (delta: number) => {
      if (total === 0) return;
      setFlipped(false);
      setIdx((prev) => {
        const next = (prev + delta + total) % total;
        setSeen((s) => (s.has(next) ? s : new Set([...s, next])));
        return next;
      });
    },
    [total],
  );

  const flip = useCallback(() => setFlipped((f) => !f), []);

  useEffect(() => {
    const node = deckRef.current;
    if (!node) return;
    const handler = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        go(-1);
      } else if (ev.key === "ArrowRight") {
        ev.preventDefault();
        go(1);
      }
    };
    node.addEventListener("keydown", handler);
    return () => node.removeEventListener("keydown", handler);
  }, [go]);

  if (total === 0) {
    return (
      <WidgetFrame kindLabel={c.kindLabel} title={title}>
        <p className="text-[14px] text-muted-foreground">{c.emptyLabel}</p>
      </WidgetFrame>
    );
  }

  const card = cards[idx];

  return (
    <WidgetFrame kindLabel={c.kindLabel} title={title} done={done} xpLabel="+5 XP">
      <div ref={deckRef}>
        <div className="[perspective:1200px]">
          <button
            type="button"
            onClick={flip}
            aria-label={renderAriaLabel(c.ariaLabelTemplate, idx + 1, total)}
            data-flipped={flipped ? "1" : "0"}
            className={cn(
              "relative block min-h-[160px] w-full border-2 border-border bg-background text-left transition-transform duration-500 [transform-style:preserve-3d]",
              flipped && !reduced && "[transform:rotateY(180deg)]",
            )}
          >
            {/* Front */}
            <span
              className={cn(
                "absolute inset-0 flex flex-col justify-center gap-2 p-5 [backface-visibility:hidden]",
                reduced && flipped && "invisible",
              )}
            >
              {card.term && (
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {card.term}
                </span>
              )}
              <span className="text-[16px] font-semibold leading-[1.4] text-foreground">
                {card.q}
              </span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                {c.revealHint}
              </span>
            </span>
            {/* Back */}
            <span
              className={cn(
                "absolute inset-0 flex flex-col justify-center gap-2 p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]",
                reduced && "[transform:none]",
                reduced && !flipped && "invisible",
              )}
            >
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#22c55e]">
                {c.backLabel}
              </span>
              <span className="text-[15px] leading-[1.5] text-foreground">
                {card.a}
              </span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                {c.flipBackHint}
              </span>
            </span>
          </button>
        </div>

        {/* Progress dots */}
        <div className="mt-3 flex flex-wrap gap-1.5" aria-hidden="true">
          {cards.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-4 rounded-none transition-colors",
                i === idx
                  ? "bg-brand-orange"
                  : seen.has(i)
                    ? "bg-foreground/40"
                    : "bg-border",
              )}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-brand-orange"
          >
            {c.prevLabel}
          </button>
          <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground">
            {idx + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-brand-orange"
          >
            {c.nextLabel}
          </button>
        </div>
      </div>
    </WidgetFrame>
  );
}

export default FlashcardsWidget;
