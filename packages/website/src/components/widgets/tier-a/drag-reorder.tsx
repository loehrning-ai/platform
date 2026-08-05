"use client";

import { useRef, useState, type JSX } from "react";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";

/**
 * DragReorder — put the cards into the right order. Used here to rank the four
 * EU-AI-Act risk tiers from highest to lowest risk. Ported from
 * `claude/js/widgets.js:309` (DragReorder), rewritten with German Mittelstand
 * copy and the EU-risk-tier scenario.
 *
 * @dnd-kit is not a dependency of this monorepo, so this uses native HTML5
 * drag-and-drop PLUS up/down buttons as the keyboard + reduced-motion fallback
 * (full keyboard nav requirement, shared course architecture). The "nudge" buttons are real
 * <button>s so the whole exercise is solvable without a pointer.
 *
 *  - Fully deterministic: the initial order is a fixed scramble (no
 *    Math.random), the "Mischen" button rotates by one (predictable, never the
 *    answer for a >1 list). No Date.now / Math.random.
 *  - Awards the checkpoint once on a correct "Prüfen".
 *  - No motion to gate beyond CSS transitions (reduced-motion safe).
 *
 * German copy throughout. No em dashes.
 */

export interface ReorderBlock {
  readonly id: string;
  readonly label: string;
  /** Short example / clarifier shown under the label. */
  readonly sample?: string;
}

/**
 * Chrome-copy override: additive, default-preserving —
 * every field defaults to the original German literal so the 3 existing
 * native courses render byte-identical when `copy` is omitted.
 */
export interface DragReorderWidgetCopy {
  readonly kindLabel: string;
  readonly shuffleLabel: string;
  readonly moveUpSuffix: string;
  readonly moveDownSuffix: string;
  readonly correctStatusLabel: string;
  readonly wrongStatusLabel: string;
  readonly idleStatusLabel: string;
  readonly checkLabel: string;
}

const DEFAULT_COPY: DragReorderWidgetCopy = {
  kindLabel: "Sortieren",
  shuffleLabel: "Mischen",
  moveUpSuffix: "nach oben",
  moveDownSuffix: "nach unten",
  correctStatusLabel: "Genau diese Reihenfolge. Das ist die Risikopyramide.",
  wrongStatusLabel: "Noch nicht ganz. Grüne Zeilen stehen schon richtig.",
  idleStatusLabel: "Sortiere, dann prüfe.",
  checkLabel: "Reihenfolge prüfen",
};

export interface DragReorderWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly prompt?: string;
  readonly hint?: string;
  /** Cards to order. Defaults to the four EU-AI-Act risk tiers. */
  readonly blocks?: readonly ReorderBlock[];
  /** Block ids in the correct top-to-bottom order. Defaults to the EU tiers. */
  readonly correctOrder?: readonly string[];
  readonly copy?: Partial<DragReorderWidgetCopy>;
}

/** Default EU-AI-Act risk tiers, highest risk first (the correct answer). */
const DEFAULT_BLOCKS: readonly ReorderBlock[] = [
  {
    id: "verboten",
    label: "Verbotene Praktiken",
    sample: "Social Scoring, manipulatives Verhalten. Komplett untersagt.",
  },
  {
    id: "hochrisiko",
    label: "Hochrisiko-Systeme",
    sample: "KI in Personalauswahl oder Kreditvergabe. Strenge Auflagen.",
  },
  {
    id: "transparenz",
    label: "Transparenzpflicht",
    sample: "Chatbots, generierte Inhalte. Kennzeichnen, sonst frei.",
  },
  {
    id: "minimal",
    label: "Minimales Risiko",
    sample: "Spamfilter, KI im Lager. Keine besonderen Pflichten.",
  },
];

const DEFAULT_CORRECT: readonly string[] = [
  "verboten",
  "hochrisiko",
  "transparenz",
  "minimal",
];

function isCorrect(
  order: readonly ReorderBlock[],
  correctOrder: readonly string[],
): boolean {
  return order.every((b, i) => b.id === correctOrder[i]);
}

/**
 * Deterministic starting scramble: reverse the correct order. For any list of
 * length >= 2 with distinct ids the reverse never equals the original, so the
 * learner always has work to do and tests stay stable. If the reverse somehow
 * matches (degenerate input), rotate by one as a fallback.
 */
function initialScramble(
  blocks: readonly ReorderBlock[],
  correctOrder: readonly string[],
): ReorderBlock[] {
  const byCorrect = correctOrder
    .map((id) => blocks.find((b) => b.id === id))
    .filter((b): b is ReorderBlock => b != null);
  const pool = byCorrect.length === blocks.length ? byCorrect : [...blocks];
  if (pool.length < 2) return [...pool];
  const reversed = [...pool].reverse();
  if (!isCorrect(reversed, correctOrder)) return reversed;
  // Degenerate fallback: rotate by one.
  return [...reversed.slice(1), reversed[0]];
}

export function DragReorderWidget({
  lessonId,
  cpId,
  title = "Sortiere die Risikostufen",
  prompt = "Ordne die vier Risikostufen des EU AI Act von oben (höchstes Risiko) nach unten (geringstes Risiko).",
  hint = "Zieh eine Karte oder nutze die Pfeil-Tasten. Faustregel: je größer der mögliche Schaden für Menschen, desto strenger die Stufe.",
  blocks = DEFAULT_BLOCKS,
  correctOrder = DEFAULT_CORRECT,
  copy,
}: DragReorderWidgetProps): JSX.Element {
  const c = { ...DEFAULT_COPY, ...copy };
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [order, setOrder] = useState<ReorderBlock[]>(() =>
    initialScramble(blocks, correctOrder),
  );
  const [checked, setChecked] = useState(false);
  const [ok, setOk] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragId = useRef<number | null>(null);
  const [rotation, setRotation] = useState(0);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const next = [...order];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setOrder(next);
    setChecked(false);
  };

  const nudge = (i: number, dir: -1 | 1) => move(i, i + dir);

  const check = () => {
    const isOk = isCorrect(order, correctOrder);
    setOk(isOk);
    setChecked(true);
    if (isOk) complete();
  };

  /** Deterministic re-scramble: rotate the reversed order by an extra step. */
  const reshuffle = () => {
    const base = initialScramble(blocks, correctOrder);
    const r = (rotation + 1) % Math.max(1, base.length);
    setRotation(rotation + 1);
    const rotated = [...base.slice(r), ...base.slice(0, r)];
    // Guard against rotating back to the correct answer.
    setOrder(isCorrect(rotated, correctOrder) ? base : rotated);
    setChecked(false);
    setOk(false);
  };

  return (
    <WidgetFrame
      kindLabel={c.kindLabel}
      title={title}
      scenario={hint}
      done={done}
      xpLabel="+15 XP"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-[14px] font-semibold leading-[1.4] text-foreground">
          {prompt}
        </p>
        <button
          type="button"
          onClick={reshuffle}
          className="inline-flex shrink-0 items-center gap-1.5 border-2 border-border bg-background px-3 py-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-brand-orange/60"
        >
          <RotateCcw size={12} aria-hidden="true" />
          {c.shuffleLabel}
        </button>
      </div>

      <ol className="flex list-none flex-col gap-2">
        {order.map((b, i) => {
          const isCorrect = checked && b.id === correctOrder[i];
          const isWrong = checked && b.id !== correctOrder[i];
          const isDragging = dragIdx === i;
          const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;
          return (
            <li
              key={b.id}
              draggable
              onDragStart={(e) => {
                dragId.current = i;
                setDragIdx(i);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                dragId.current = null;
                setDragIdx(null);
                setOverIdx(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIdx(i);
              }}
              onDragLeave={() => {
                if (overIdx === i) setOverIdx(null);
              }}
              onDrop={() => {
                if (dragId.current !== null && dragId.current !== i) {
                  move(dragId.current, i);
                }
                dragId.current = null;
                setDragIdx(null);
                setOverIdx(null);
              }}
              data-pos={i}
              data-id={b.id}
              className={cn(
                "grid grid-cols-[28px_1fr_auto] items-center gap-3 border-2 bg-background p-3 transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                isCorrect && "border-risk-green bg-risk-green/5",
                isWrong && "border-destructive bg-destructive/5",
                isOver && "border-brand-amber bg-brand-amber/10",
                !checked && !isOver && "border-border",
                isDragging ? "cursor-grabbing opacity-40" : "cursor-grab",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center border-2 font-mono text-[12px] font-bold",
                  isCorrect && "border-risk-green bg-risk-green text-white",
                  isWrong && "border-destructive bg-destructive text-white",
                  !checked && "border-border text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span>
                <span className="block text-[14px] font-semibold leading-[1.3] text-foreground">
                  {b.label}
                </span>
                {b.sample && (
                  <span className="mt-0.5 block text-[12.5px] leading-[1.45] text-muted-foreground">
                    {b.sample}
                  </span>
                )}
              </span>
              <span className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => nudge(i, -1)}
                  disabled={i === 0}
                  aria-label={`${b.label} ${c.moveUpSuffix}`}
                  className={cn(
                    "inline-flex h-6 w-7 items-center justify-center border-2 border-border bg-background text-muted-foreground transition-colors",
                    i === 0
                      ? "cursor-not-allowed opacity-35"
                      : "hover:border-brand-orange/60 hover:text-foreground",
                  )}
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => nudge(i, 1)}
                  disabled={i === order.length - 1}
                  aria-label={`${b.label} ${c.moveDownSuffix}`}
                  className={cn(
                    "inline-flex h-6 w-7 items-center justify-center border-2 border-border bg-background text-muted-foreground transition-colors",
                    i === order.length - 1
                      ? "cursor-not-allowed opacity-35"
                      : "hover:border-brand-orange/60 hover:text-foreground",
                  )}
                >
                  <ArrowDown size={13} />
                </button>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span
          className={cn(
            "text-[13px] font-medium",
            checked
              ? ok
                ? "text-risk-green"
                : "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {checked
            ? ok
              ? c.correctStatusLabel
              : c.wrongStatusLabel
            : c.idleStatusLabel}
        </span>
        <button
          type="button"
          onClick={check}
          className="inline-flex items-center gap-1.5 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
        >
          {c.checkLabel}
        </button>
      </div>
    </WidgetFrame>
  );
}

export default DragReorderWidget;
