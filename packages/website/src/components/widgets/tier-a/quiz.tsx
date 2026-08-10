"use client";

import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCheckpoint } from "@/lib/progress";
import { EASE_OUT_EXPO } from "@/lib/animations";
import {
  handleRovingFocusKeyDown,
  rovingTabIndex,
} from "@/lib/a11y/roving-focus";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "./_frame";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Quiz — single-question, in-lesson multiple-choice check.
 * Ported from `codex/js/widgets.js:62` (Quiz). German copy.
 *
 *  - One correct answer; clicking reveals correct/wrong + explanation.
 *  - Keyboard A/B/C/D shortcuts when the widget body is focused (the JS
 *    source bound globally; we scope to the widget for predictable a11y).
 *  - On a correct answer, awards the checkpoint once via the unified store.
 *  - `prefers-reduced-motion`: skips the explanation slide-in.
 */

const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

/**
 * Chrome-copy override: the button/status strings below
 * were hardcoded German literals with no override mechanism, which would
 * ship English quiz questions wrapped in German chrome for the (English)
 * Claude Course. Additive and default-preserving: every field defaults to
 * the original German literal, so the 3 existing native courses
 * (ki-fuehrerschein, eu-ai-act-kurs, ai-native) render byte-identical.
 */
export interface QuizWidgetCopy {
  readonly kindLabel: string;
  readonly optionsAriaLabel: string;
  readonly correctLabel: string;
  readonly incorrectLabel: string;
}

const DEFAULT_COPY: QuizWidgetCopy = {
  kindLabel: "Check",
  optionsAriaLabel: "Antwortoptionen",
  correctLabel: "Richtig.",
  incorrectLabel: "Nicht ganz.",
};

export interface QuizWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly title?: string;
  readonly question: string;
  readonly options: readonly string[];
  /** 0-based index of the correct option. */
  readonly correct: number;
  readonly explanation: string;
  readonly copy?: Partial<QuizWidgetCopy>;
  readonly locale?: Locale;
}

export function QuizWidget({
  lessonId,
  cpId,
  title,
  question,
  options,
  correct,
  explanation,
  copy,
  locale = "de",
}: QuizWidgetProps): JSX.Element {
  const c = { ...DEFAULT_COPY, ...copy };
  const reduced = useReducedMotion();
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [hydrated, setHydrated] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const answered = picked !== null;
  const isCorrect = picked === correct;

  useEffect(() => {
    setHydrated(true);
  }, []);

  const answer = useCallback(
    (i: number) => {
      if (picked !== null) return;
      setPicked(i);
      if (i === correct) complete();
    },
    [picked, correct, complete],
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const handler = (ev: KeyboardEvent) => {
      if (picked !== null) return;
      const idx = LETTERS.indexOf(
        ev.key.toUpperCase() as (typeof LETTERS)[number],
      );
      if (idx >= 0 && idx < options.length) {
        ev.preventDefault();
        answer(idx);
      }
    };
    node.addEventListener("keydown", handler);
    return () => node.removeEventListener("keydown", handler);
  }, [picked, options.length, answer]);

  return (
    <WidgetFrame
      kindLabel={c.kindLabel}
      title={title ?? (locale === "de" ? "Kurze Prüfung" : "Quick check")}
      done={done}
      xpLabel="+10 XP"
      doneLabel={locale === "de" ? "Erledigt" : "Done"}
    >
      <div ref={containerRef}>
        <p className="mb-4 text-[15px] font-semibold leading-[1.5] text-foreground">
          {question}
        </p>
        <div
          role="radiogroup"
          aria-label={c.optionsAriaLabel}
          data-roving-group
          className="flex flex-col gap-2"
        >
          {options.map((option, i) => {
            const isPickedOpt = picked === i;
            const showCorrect = answered && i === correct;
            const showWrong = answered && isPickedOpt && i !== correct;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={isPickedOpt}
                data-roving-item
                tabIndex={rovingTabIndex(picked, i)}
                disabled={!hydrated || answered}
                onClick={() => answer(i)}
                onKeyDown={(event) =>
                  handleRovingFocusKeyDown(event, {
                    currentIndex: i,
                    itemCount: options.length,
                    orientation: "vertical",
                    onMove: answer,
                  })
                }
                className={cn(
                  "flex items-center gap-3 border-2 border-border bg-background px-3 py-2.5 text-left text-[14px] text-foreground transition-colors",
                  !answered && "hover:border-brand-orange",
                  showCorrect && "border-risk-green bg-risk-green/10",
                  showWrong && "border-destructive bg-destructive/10",
                  answered && "cursor-default",
                )}
              >
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                  {LETTERS[i]}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {answered && (
            <m.div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: 0.28, ease: EASE_OUT_EXPO }
              }
              className={cn(
                "mt-4 border-l-[3px] p-4 text-[13.5px] leading-[1.55] text-foreground",
                isCorrect
                  ? "border-risk-green bg-risk-green/5"
                  : "border-brand-amber bg-brand-amber/5",
              )}
            >
              <p className="mb-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em]">
                {isCorrect ? c.correctLabel : c.incorrectLabel}
              </p>
              {explanation}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </WidgetFrame>
  );
}

export default QuizWidget;
