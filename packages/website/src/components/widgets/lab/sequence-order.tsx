"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { m } from "framer-motion";
import { ArrowDown, ArrowUp, Check, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LAB_SPRING,
  LabButton,
  LabLive,
  LabSurface,
  LabVerdictPill,
  labLocale,
  useLabCompletion,
  type LabBaseProps,
} from "./_lab";

/**
 * SequenceOrder: put the steps of a procedure in order. Steps are authored
 * in the correct order and shown in a fixed shuffled order (seeded by their
 * ids, never the solution). The learner moves cards with 44px up/down
 * buttons, checks, sees which positions are right, and fixes the rest. Done
 * once the order is fully right; each step then explains why it sits there.
 */

export interface SequenceStep {
  readonly id: string;
  readonly text: string;
  /** Why the step sits at this position. Shown once the order is right. */
  readonly why: string;
}

export interface SequenceOrderProps extends LabBaseProps {
  /** Steps in the correct order. */
  readonly steps: readonly SequenceStep[];
  /** Optional situation shown above the list. */
  readonly context?: { readonly label: string; readonly text: string };
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/**
 * Deterministic starting order (exported for tests): sorted by a hash of the
 * step ids, rotated when that would reproduce the solution.
 */
export function initialSequence(steps: readonly SequenceStep[]): string[] {
  const ids = steps.map((step) => step.id);
  const shuffled = [...ids].sort((a, b) => hash(`${a}:seq`) - hash(`${b}:seq`) || a.localeCompare(b));
  const solved = shuffled.every((id, index) => id === ids[index]);
  return solved && ids.length > 1 ? [...shuffled.slice(1), shuffled[0]] : shuffled;
}

/** Positions that match the solution (exported for tests). */
export function correctPositions(order: readonly string[], steps: readonly SequenceStep[]): number {
  return order.filter((id, index) => steps[index]?.id === id).length;
}

const COPY = {
  de: {
    region: "Reihenfolge ordnen",
    hint: "Schritte mit den Pfeilen in die richtige Reihenfolge bringen, dann prüfen.",
    up: (text: string) => `„${text}“ nach oben`,
    down: (text: string) => `„${text}“ nach unten`,
    check: "Reihenfolge prüfen",
    position: (n: number) => `Schritt ${n}`,
    rightPlace: "an der richtigen Stelle",
    wrongPlace: "noch nicht an der richtigen Stelle",
    partial: (right: number, total: number) =>
      `${right} von ${total} Schritten an der richtigen Stelle. Markierte Schritte verschieben und erneut prüfen.`,
    solved: "Die Reihenfolge stimmt.",
    attempts: (n: number) => (n === 1 ? "beim ersten Prüfen" : `nach ${n} Prüfungen`),
    again: "Von vorn",
    why: "Warum diese Reihenfolge",
  },
  en: {
    region: "Put the steps in order",
    hint: "Move the steps into the right order with the arrows, then check.",
    up: (text: string) => `Move “${text}” up`,
    down: (text: string) => `Move “${text}” down`,
    check: "Check the order",
    position: (n: number) => `Step ${n}`,
    rightPlace: "in the right place",
    wrongPlace: "not in the right place yet",
    partial: (right: number, total: number) =>
      `${right} of ${total} steps in the right place. Move the marked steps and check again.`,
    solved: "The order is right.",
    attempts: (n: number) => (n === 1 ? "on the first check" : `after ${n} checks`),
    again: "Start over",
    why: "Why this order",
  },
} as const;

export function SequenceOrderWidget({
  steps,
  context,
  lessonId,
  cpId,
  locale,
  title,
}: SequenceOrderProps): JSX.Element {
  const copy = COPY[labLocale(locale)];
  const { complete } = useLabCompletion({ lessonId, cpId });
  const start = useMemo(() => initialSequence(steps), [steps]);
  const [order, setOrder] = useState<readonly string[]>(start);
  const [checked, setChecked] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [moved, setMoved] = useState<{ readonly id: string; readonly dir: -1 | 1 } | null>(null);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const resultRef = useRef<HTMLDivElement>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  useEffect(() => {
    if (!focusKey) return;
    if (focusKey === "result") resultRef.current?.focus();
    else buttonRefs.current.get(focusKey)?.focus();
    setFocusKey(null);
  }, [focusKey]);

  const stepById = useMemo(() => new Map(steps.map((step) => [step.id, step])), [steps]);
  const right = correctPositions(order, steps);
  const solved = checked && right === steps.length;

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (solved || target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    const id = order[index];
    setOrder(next);
    setChecked(false);
    setMoved({ id, dir });
    // Keep focus on the moved card's same-direction button when it can still
    // move that way, otherwise on its opposite button.
    const atEdge = target === 0 || target === order.length - 1;
    const keepDir = atEdge ? (dir === -1 ? "down" : "up") : dir === -1 ? "up" : "down";
    setFocusKey(`${id}:${keepDir}`);
  };

  const check = () => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setChecked(true);
    setFocusKey("result");
    if (correctPositions(order, steps) === steps.length) complete();
  };

  const reshuffle = () => {
    setOrder(start);
    setChecked(false);
    setAttempts(0);
    setMoved(null);
  };

  return (
    <LabSurface label={copy.region} title={title}>
      {context ? (
        <div className="lab-wash-peach mb-4 rounded-2xl border border-lab-line bg-card p-4">
          <p className="text-label text-muted-foreground">{context.label}</p>
          <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-foreground">{context.text}</p>
        </div>
      ) : null}
      <p className="mb-3 text-sm text-muted-foreground">{copy.hint}</p>

      <ol className="space-y-2">
        {order.map((id, index) => {
          const step = stepById.get(id);
          if (!step) return null;
          const inPlace = steps[index]?.id === id;
          const mark = checked ? (inPlace ? "good" : "bad") : null;
          return (
            <m.li
              key={`${id}-${index}`}
              initial={moved?.id === id ? { y: moved.dir * -18, scale: 0.98 } : false}
              animate={{ y: 0, scale: 1 }}
              transition={LAB_SPRING}
              data-step-id={id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-2 pl-3 transition-[background-color,border-color] duration-200",
                mark === "good" && "border-lab-good/30 bg-lab-good-soft",
                mark === "bad" && "border-lab-bad/30 bg-lab-bad-soft",
                mark === null && "border-lab-line bg-card shadow-lab-sm",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                  mark === "good" ? "bg-lab-good text-paper" : mark === "bad" ? "bg-lab-bad text-paper" : "bg-lab-accent-soft text-lab-accent",
                )}
              >
                {mark === "good" ? <Check className="h-4 w-4" /> : mark === "bad" ? <X className="h-4 w-4" /> : index + 1}
              </span>
              <p className="min-w-0 flex-1 text-[15px] leading-snug text-foreground">
                <span className="sr-only">{copy.position(index + 1)}: </span>
                {step.text}
                {mark ? <span className="sr-only"> ({mark === "good" ? copy.rightPlace : copy.wrongPlace})</span> : null}
              </p>
              <div className="flex shrink-0 gap-1">
                <button
                  ref={(node) => {
                    if (node) buttonRefs.current.set(`${id}:up`, node);
                    else buttonRefs.current.delete(`${id}:up`);
                  }}
                  type="button"
                  aria-label={copy.up(step.text)}
                  disabled={solved || index === 0}
                  onClick={() => move(index, -1)}
                  className="flex min-h-11 w-11 items-center justify-center rounded-full border border-lab-line bg-paper text-foreground transition-[background-color,border-color] duration-150 hover:border-lab-accent/60 hover:bg-lab-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-50"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  ref={(node) => {
                    if (node) buttonRefs.current.set(`${id}:down`, node);
                    else buttonRefs.current.delete(`${id}:down`);
                  }}
                  type="button"
                  aria-label={copy.down(step.text)}
                  disabled={solved || index === order.length - 1}
                  onClick={() => move(index, 1)}
                  className="flex min-h-11 w-11 items-center justify-center rounded-full border border-lab-line bg-paper text-foreground transition-[background-color,border-color] duration-150 hover:border-lab-accent/60 hover:bg-lab-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-50"
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </m.li>
          );
        })}
      </ol>

      {!solved ? (
        <div className="mt-4">
          <LabButton onClick={check}>{copy.check}</LabButton>
        </div>
      ) : null}

      <div
        ref={resultRef}
        tabIndex={-1}
        className="mt-4 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
      >
        <LabLive>
          {checked && !solved ? (
            <p className="rounded-2xl bg-lab-warn-soft px-4 py-3 text-[15px] text-lab-warn">
              {copy.partial(right, steps.length)}
            </p>
          ) : null}
          {solved ? (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-2xl border border-lab-line bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <LabVerdictPill tone={attempts === 1 ? "good" : "neutral"}>
                  {copy.solved} {copy.attempts(attempts)}
                </LabVerdictPill>
                <LabButton tone="ghost" onClick={reshuffle}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {copy.again}
                </LabButton>
              </div>
              <p className="mt-3 text-label text-muted-foreground">{copy.why}</p>
              <ol className="mt-2 space-y-2">
                {steps.map((step, index) => (
                  <li key={step.id} className="text-sm leading-relaxed">
                    <span className="font-semibold text-foreground">
                      {index + 1}. {step.text}
                    </span>
                    <span className="text-muted-foreground">: {step.why}</span>
                  </li>
                ))}
              </ol>
            </m.div>
          ) : null}
        </LabLive>
      </div>
    </LabSurface>
  );
}

export default SequenceOrderWidget;
