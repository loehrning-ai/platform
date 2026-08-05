"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L11 bespoke interactive — "Pattern cards lab".
 * Ported from `codex/js/lessons/L11.js` (functional parity; the source's
 * HTML5 drag-and-drop is simplified to click-to-flip then click-to-sort —
 * drag events are unreliable in jsdom and, per the source's own click/
 * keyboard handlers as a fallback, click was always a first-class input
 * here too).
 *
 * 8 pattern cards, flip each to reveal its description, then sort it into
 * PROVEN or AVOID. Sorting into the wrong pile counts as a mistake (no
 * penalty beyond the counter) and the card stays unsorted. The checkpoint
 * awards once all 8 are correctly sorted.
 */

interface PatternCard {
  readonly id: number;
  readonly type: "proven" | "anti";
  readonly title: string;
  readonly desc: string;
}

const CARDS: readonly PatternCard[] = [
  { id: 1, type: "proven", title: "the AGENTS.md handshake", desc: "Start every repo with a tight AGENTS.md before the first Codex run." },
  { id: 2, type: "proven", title: "one PR one scope", desc: "Each Codex task ships exactly one coherent change." },
  { id: 3, type: "proven", title: "tests as contract", desc: "Your test suite is the spec Codex optimizes against." },
  { id: 4, type: "proven", title: "parallel with git worktrees", desc: "Run independent tasks in isolated worktrees." },
  { id: 5, type: "proven", title: "Codex reviews Codex", desc: "Use a second Codex pass to critique the first." },
  { id: 6, type: "anti", title: "vague roving refactor", desc: "Clean up the codebase." },
  { id: 7, type: "anti", title: "interactive pair programming", desc: "Treating Codex like live autocomplete." },
  { id: 8, type: "anti", title: "skip the sandbox", desc: "Disabling the sandbox to just make it work." },
];

interface L11PatternCardsLabProps {
  readonly lessonId: string;
  readonly cpId: string;
}

export function L11PatternCardsLab({ lessonId, cpId }: L11PatternCardsLabProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [flipped, setFlipped] = useState<ReadonlySet<number>>(() => new Set());
  const [sorted, setSorted] = useState<ReadonlySet<number>>(() => new Set());
  const [mistakes, setMistakes] = useState(0);

  const flip = (id: number) => {
    if (sorted.has(id)) return;
    setFlipped((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const sortInto = (card: PatternCard, target: "proven" | "anti") => {
    if (sorted.has(card.id)) return;
    if (card.type === target) {
      const next = new Set(sorted);
      next.add(card.id);
      setSorted(next);
      if (next.size === CARDS.length) complete();
    } else {
      setMistakes((n) => n + 1);
    }
  };

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        ◆ Bespoke · Pattern cards lab
      </p>
      <p className="mb-3 font-mono text-[11px] text-muted-foreground">
        sorted: {sorted.size}/{CARDS.length} · mistakes: {mistakes}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CARDS.map((card) => {
          const isFlipped = flipped.has(card.id);
          const isSorted = sorted.has(card.id);
          if (isSorted) return null;
          return (
            <div key={card.id} className="border-2 border-border bg-background p-2 text-center">
              {isFlipped ? (
                <>
                  <p className="font-mono text-[11px] font-bold text-brand-orange">{card.title}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{card.desc}</p>
                  <div className="mt-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => sortInto(card, "proven")}
                      className="flex-1 border border-risk-green bg-risk-green/10 px-1.5 py-1 font-mono text-[9.5px] font-bold uppercase text-risk-green"
                    >
                      Proven
                    </button>
                    <button
                      type="button"
                      onClick={() => sortInto(card, "anti")}
                      className="flex-1 border border-destructive bg-destructive/10 px-1.5 py-1 font-mono text-[9.5px] font-bold uppercase text-destructive"
                    >
                      Avoid
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => flip(card.id)}
                  aria-label={`Flip card ${card.id}`}
                  className="flex h-16 w-full items-center justify-center font-mono text-[18px] text-foreground hover:text-brand-orange"
                >
                  {String(card.id).padStart(2, "0")}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {sorted.size === CARDS.length && (
        <p className={cn("mt-4 text-center font-mono text-[13px] font-bold text-risk-green")}>
          Pattern library locked in {done ? "✓" : ""}
        </p>
      )}
    </div>
  );
}

export default L11PatternCardsLab;
