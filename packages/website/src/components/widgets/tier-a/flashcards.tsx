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

export interface FlashcardsWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly cards: readonly Flashcard[];
}

export function FlashcardsWidget({
  lessonId,
  cpId,
  title = "Karteikarten",
  cards,
}: FlashcardsWidgetProps): JSX.Element {
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
      <WidgetFrame kindLabel="Karten" title={title}>
        <p className="text-[14px] text-muted-foreground">
          Keine Karten vorhanden.
        </p>
      </WidgetFrame>
    );
  }

  const card = cards[idx];

  return (
    <WidgetFrame kindLabel="Karten" title={title} done={done} xpLabel="+5 XP">
      <div ref={deckRef}>
        <div className="[perspective:1200px]">
          <button
            type="button"
            onClick={flip}
            aria-label={`Karte ${idx + 1} von ${total}. Leertaste oder Klick zum Umdrehen.`}
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
                Klick zum Aufdecken ↻
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
                Antwort
              </span>
              <span className="text-[15px] leading-[1.5] text-foreground">
                {card.a}
              </span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                Klick zum Zurückdrehen
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
            ← Zurück
          </button>
          <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground">
            {idx + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => go(1)}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-brand-orange"
          >
            Weiter →
          </button>
        </div>
      </div>
    </WidgetFrame>
  );
}

export default FlashcardsWidget;
