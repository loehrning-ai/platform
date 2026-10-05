"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { m } from "framer-motion";
import { Check, RotateCcw, X } from "lucide-react";
import type { LessonCheck } from "@/lib/lesson-engine/types";
import { cn } from "@/lib/utils";
import type { LessonEngineCopy } from "./engine-copy";

interface CheckState {
  /** Option ids picked so far, in order. */
  readonly picked: readonly string[];
  readonly solved: boolean;
}

/** FNV-1a hash of a string (stable across server and client). */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Display order of a check's options: a deterministic shuffle seeded by the
 * check id, so the correct answer does not sit in the authored position
 * (authors tend to put it second) and DE/EN mirrors (same ids) show the same
 * order. Exported for tests.
 */
export function orderCheckOptions<T extends { readonly id: string }>(
  checkId: string,
  options: readonly T[],
): readonly T[] {
  const ordered = [...options];
  let seed = hashString(checkId) || 1;
  const next = () => {
    // mulberry32
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = ordered.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    [ordered[index], ordered[swap]] = [ordered[swap], ordered[index]];
  }
  return ordered;
}

function initialState(
  checks: readonly LessonCheck[],
  passed: boolean,
): Record<string, CheckState> {
  return Object.fromEntries(
    checks.map((check) => {
      const correct = check.options.find((option) => option.correct);
      return [
        check.id,
        passed && correct
          ? { picked: [correct.id], solved: true }
          : { picked: [], solved: false },
      ];
    }),
  );
}

/**
 * Two inline checks with instant, explained feedback. A wrong pick explains
 * itself and locks that option; the explanation of the right answer appears
 * as soon as it is picked. When every check is solved, `onAllSolved` fires
 * once with the number of checks.
 */
export function LessonChecks({
  checks,
  copy,
  passed,
  interactive,
  onAllSolved,
}: {
  readonly checks: readonly LessonCheck[];
  readonly copy: LessonEngineCopy;
  /** Already passed in stored progress: render solved. */
  readonly passed: boolean;
  /** False until the learning owner is resolved. */
  readonly interactive: boolean;
  readonly onAllSolved: (total: number) => void;
}): JSX.Element {
  const [state, setState] = useState(() => initialState(checks, passed));
  const reported = useRef(passed);

  // Stored progress can resolve after the first render (hydration).
  useEffect(() => {
    if (passed) {
      reported.current = true;
      setState(initialState(checks, true));
    }
  }, [passed, checks]);

  const allSolved = useMemo(
    () => checks.every((check) => state[check.id]?.solved),
    [checks, state],
  );

  useEffect(() => {
    if (allSolved && !reported.current) {
      reported.current = true;
      onAllSolved(checks.length);
    }
  }, [allSolved, checks.length, onAllSolved]);

  const pick = (check: LessonCheck, optionId: string) => {
    if (!interactive) return;
    setState((previous) => {
      const current = previous[check.id] ?? { picked: [], solved: false };
      if (current.solved || current.picked.includes(optionId)) return previous;
      const option = check.options.find((entry) => entry.id === optionId);
      return {
        ...previous,
        [check.id]: {
          picked: [...current.picked, optionId],
          solved: Boolean(option?.correct),
        },
      };
    });
  };

  const practiceAgain = () => {
    setState(initialState(checks, false));
  };

  return (
    <div className="space-y-4">
      {checks.map((check, index) => {
        const current = state[check.id] ?? { picked: [], solved: false };
        const last = current.picked[current.picked.length - 1];
        const lastOption = check.options.find((option) => option.id === last);
        const headingId = `check-${check.id}-prompt`;
        return (
          <m.fieldset
            key={check.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            aria-labelledby={headingId}
            data-check-id={check.id}
            data-solved={current.solved ? "1" : "0"}
            className={cn(
              "min-w-0 rounded-[24px] border bg-card p-5 shadow-lab transition-[border-color] duration-300 motion-reduce:transition-none sm:p-6",
              current.solved ? "border-lab-good/40" : "border-lab-line/80",
            )}
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-lab-accent">
              {current.solved ? (
                <Check className="h-4 w-4 text-lab-good" aria-hidden="true" />
              ) : null}
              {copy.checkLabel(index + 1, checks.length)}
            </p>
            <h3
              id={headingId}
              className="mt-1 text-lg font-bold leading-snug tracking-[-0.01em] text-foreground"
            >
              {check.prompt}
            </h3>
            <div className="mt-4 grid gap-2">
              {orderCheckOptions(check.id, check.options).map((option) => {
                const wasPicked = current.picked.includes(option.id);
                const isRight = wasPicked && option.correct;
                const isWrong = wasPicked && !option.correct;
                const locked = current.solved || isWrong || !interactive;
                return (
                  <m.button
                    key={option.id}
                    type="button"
                    aria-pressed={wasPicked}
                    aria-disabled={locked}
                    data-option-state={isRight ? "correct" : isWrong ? "wrong" : "idle"}
                    onClick={() => pick(check, option.id)}
                    animate={isRight ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35 }}
                    className={cn(
                      "flex min-h-12 w-full items-start gap-3 rounded-[18px] border px-4 py-3.5 text-left text-base leading-snug transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                      !wasPicked &&
                        !locked &&
                        "border-lab-line bg-paper text-foreground hover:border-lab-accent/60 hover:bg-lab-accent-soft",
                      !wasPicked && locked && "border-lab-line bg-paper text-muted-foreground",
                      isRight && "border-lab-good bg-lab-good-soft text-foreground",
                      isWrong && "border-lab-bad/40 bg-lab-bad-soft text-muted-foreground line-through decoration-lab-bad/50",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                        isRight && "border-lab-good bg-lab-good text-paper",
                        isWrong && "border-lab-bad bg-lab-bad text-paper",
                        !wasPicked && "border-border",
                      )}
                    >
                      {isRight ? <Check className="h-3 w-3" /> : null}
                      {isWrong ? <X className="h-3 w-3" /> : null}
                    </span>
                    <span className="min-w-0 break-words">{option.text}</span>
                  </m.button>
                );
              })}
            </div>
            <div role="status" aria-live="polite" className="min-h-0">
              <>
                {lastOption ? (
                  <m.div
                    key={`${check.id}-${last}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "mt-4 rounded-[18px] px-4 py-3 text-[15px] leading-relaxed",
                      current.solved
                        ? "bg-lab-good-soft text-foreground"
                        : "bg-lab-bad-soft text-foreground",
                    )}
                  >
                    <p className={cn("font-semibold", current.solved ? "text-lab-good" : "text-lab-bad")}>
                      {current.solved ? copy.correct : copy.incorrect}
                    </p>
                    {current.solved ? (
                      <p className="mt-1">{check.explanation}</p>
                    ) : (
                      <p className="mt-1">
                        {lastOption.feedback ? `${lastOption.feedback} ` : ""}
                        {copy.tryAgain}
                      </p>
                    )}
                  </m.div>
                ) : null}
              </>
            </div>
          </m.fieldset>
        );
      })}
      {allSolved ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={practiceAgain}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-lab-accent transition-colors hover:bg-lab-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {copy.practiceAgain}
          </button>
        </div>
      ) : null}
    </div>
  );
}
