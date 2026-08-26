"use client";

import { useEffect, useMemo, useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { ExerciseShell, ExerciseResetButton, submitExercise } from "./_shell";
import type { ModuleId } from "@/lib/ai-native/types";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useDemoLocale } from "@/components/demos/demo-locale";

/**
 * Context-Budget Drag-Drop — user drags (or tap-to-place) blocks into the
 * 200k token window. Over-budget = exercise fails with clear feedback.
 * Score rewards inclusion of all "must-have" blocks AND staying in budget.
 *
 * Touch-device support: `(pointer: coarse)` media query swaps drag UI for
 * a tap-a-block → tap-a-slot interaction (same grading).
 *
 * Pure grading.
 * See AI-native lesson system.
 */

export interface ContextBlock {
  readonly id: string;
  readonly label: string;
  readonly tokens: number;
  readonly mustHave: boolean;
  readonly description: string;
}

export interface ContextBudgetSpec {
  readonly exerciseId: string;
  readonly lessonId: string;
  readonly moduleId: ModuleId;
  readonly title: string;
  readonly scenario: string;
  readonly budgetTokens: number;
  readonly blocks: readonly ContextBlock[];
}

function gradeBudget(
  selected: ReadonlySet<string>,
  blocks: readonly ContextBlock[],
  budget: number,
): {
  readonly tokensUsed: number;
  readonly overBudget: boolean;
  readonly mustHavesIncluded: number;
  readonly mustHavesTotal: number;
  readonly score: number;
} {
  const tokensUsed = blocks.reduce(
    (sum, b) => sum + (selected.has(b.id) ? b.tokens : 0),
    0,
  );
  const overBudget = tokensUsed > budget;
  const mustHaves = blocks.filter((b) => b.mustHave);
  const mustHavesIncluded = mustHaves.filter((b) => selected.has(b.id)).length;
  const mustHavesTotal = mustHaves.length;
  if (overBudget)
    return {
      tokensUsed,
      overBudget,
      mustHavesIncluded,
      mustHavesTotal,
      score: 0,
    };
  const mustHaveRatio =
    mustHavesTotal === 0 ? 1 : mustHavesIncluded / mustHavesTotal;
  return {
    tokensUsed,
    overBudget,
    mustHavesIncluded,
    mustHavesTotal,
    score: mustHaveRatio,
  };
}

function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setCoarse(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return coarse;
}

export function ContextBudgetExercise(props: ContextBudgetSpec): JSX.Element {
  return (
    <ExerciseShell
      moduleId={props.moduleId}
      lessonId={props.lessonId}
      exerciseId={props.exerciseId}
      kind="exercise-context-budget"
      title={props.title}
      scenario={props.scenario}
    >
      <ContextBudgetBody {...props} />
    </ExerciseShell>
  );
}

function ContextBudgetBody({
  exerciseId,
  lessonId,
  moduleId,
  budgetTokens,
  blocks,
}: ContextBudgetSpec): JSX.Element {
  const { locale, text } = useDemoLocale();
  const coarse = useCoarsePointer();
  const [inContext, setInContext] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const grading = useMemo(
    () => gradeBudget(inContext, blocks, budgetTokens),
    [inContext, blocks, budgetTokens],
  );
  const pctUsed = Math.min(100, (grading.tokensUsed / budgetTokens) * 100);

  const toggle = (blockId: string) => {
    if (submitted) return;
    setInContext((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  const handleSubmit = () => {
    if (
      submitExercise({
        moduleId,
        lessonId,
        exerciseId,
        kind: "exercise-context-budget",
        score: grading.score,
      })
    ) {
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setInContext(new Set());
  };

  // For desktop drag: the drop target handles drop event
  const onDragStart = (blockId: string) => (e: React.DragEvent) => {
    if (coarse) return;
    setDraggedId(blockId);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDropContext = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedId && !submitted) {
      setInContext((prev) => {
        const next = new Set(prev);
        next.add(draggedId);
        return next;
      });
    }
    setDraggedId(null);
  };
  const onDropAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedId && !submitted) {
      setInContext((prev) => {
        const next = new Set(prev);
        next.delete(draggedId);
        return next;
      });
    }
    setDraggedId(null);
  };
  const onDragOver = (e: React.DragEvent) => {
    if (!coarse) e.preventDefault();
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {coarse
            ? text(
                "Tippe einen Block, tippe dann den Ziel-Bereich",
                "Tap a block, then tap its destination",
              )
            : text(
                "Ziehe Blöcke in das Context-Window oder wähle sie per Tastatur",
                "Drag blocks into the context window or select them with the keyboard",
              )}
        </p>
        <p className="font-mono text-xs tracking-[0.12em]">
          <span
            className={cn(
              "font-bold",
              grading.overBudget ? "text-destructive" : "text-foreground",
            )}
          >
            {grading.tokensUsed.toLocaleString(
              locale === "en" ? "en-GB" : "de-DE",
            )}
          </span>{" "}
          / {budgetTokens.toLocaleString("de-DE")} Tokens
        </p>
      </div>

      {/* Budget bar */}
      <div className="mb-4 h-2 w-full bg-border">
        <m.div
          animate={{ width: `${pctUsed}%` }}
          transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
          className={cn(
            "h-full",
            grading.overBudget
              ? "bg-destructive"
              : pctUsed > 80
                ? "bg-brand-amber"
                : "bg-brand-orange",
          )}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Available pool */}
        <div
          onDragOver={onDragOver}
          onDrop={onDropAvailable}
          className="flex min-h-[200px] flex-col gap-1.5 border border-dashed border-border bg-card/30 p-3"
        >
          <p className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {text("Verfügbar", "Available")}
          </p>
          {blocks
            .filter((b) => !inContext.has(b.id))
            .map((b) => (
              <BlockCard
                key={b.id}
                block={b}
                inContext={false}
                onClick={() => toggle(b.id)}
                onDragStart={onDragStart(b.id)}
                draggable={!coarse && !submitted}
                submitted={submitted}
              />
            ))}
        </div>

        {/* Context window drop target */}
        <div
          onDragOver={onDragOver}
          onDrop={onDropContext}
          className={cn(
            "flex min-h-[200px] flex-col gap-1.5 border-2 bg-background p-3",
            draggedId
              ? "border-dashed border-brand-orange bg-brand-orange/5"
              : "border-dashed border-brand-orange",
          )}
        >
          <p className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
            {locale === "en"
              ? `◆ Context window (${budgetTokens.toLocaleString("en-GB")} tokens)`
              : `◆ Context-Window (${budgetTokens.toLocaleString("de-DE")} Tokens)`}
          </p>
          {blocks
            .filter((b) => inContext.has(b.id))
            .map((b) => (
              <BlockCard
                key={b.id}
                block={b}
                inContext
                onClick={() => toggle(b.id)}
                onDragStart={onDragStart(b.id)}
                draggable={!coarse && !submitted}
                submitted={submitted}
              />
            ))}
          {inContext.size === 0 && (
            <p className="my-auto text-center text-[12px] text-muted-foreground">
              {text("Leer.", "Empty.")}{" "}
              {coarse
                ? text(
                    "Tippe links einen Block zur Aufnahme.",
                    "Tap a block on the left to add it.",
                  )
                : text(
                    "Blöcke hierher ziehen oder auswählen.",
                    "Drag or select blocks to add them.",
                  )}
            </p>
          )}
        </div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {submitted && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className={cn(
              "mt-4 border-l-[3px] px-4 py-3",
              grading.overBudget
                ? "border-destructive bg-destructive/5"
                : grading.score >= 0.8
                  ? "border-risk-green bg-risk-green/5"
                  : "border-brand-amber bg-brand-amber/5",
            )}
          >
            <div className="flex items-center gap-2">
              {grading.overBudget ? (
                <XCircle size={16} className="text-destructive" />
              ) : grading.score >= 0.8 ? (
                <CheckCircle2 size={16} className="text-risk-green" />
              ) : (
                <XCircle size={16} className="text-brand-amber" />
              )}
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                {grading.overBudget
                  ? text(
                      "Über Budget: Kontext wird abgeschnitten",
                      "Over budget: the context will be truncated",
                    )
                  : `${grading.mustHavesIncluded}/${grading.mustHavesTotal} Must-haves · Score ${Math.round(grading.score * 100)}%`}
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex min-h-11 items-center gap-1.5 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-foreground hover:text-background"
          >
            {text("Prüfen", "Evaluate")}
          </button>
        ) : (
          <ExerciseResetButton onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

function BlockCard({
  block,
  inContext,
  onClick,
  onDragStart,
  draggable,
  submitted,
}: {
  readonly block: ContextBlock;
  readonly inContext: boolean;
  readonly onClick?: () => void;
  readonly onDragStart?: (e: React.DragEvent) => void;
  readonly draggable: boolean;
  readonly submitted: boolean;
}): JSX.Element {
  const { locale, text } = useDemoLocale();
  const shownAsMust = submitted && block.mustHave && !inContext;
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      role={!submitted ? "button" : undefined}
      tabIndex={!submitted ? 0 : -1}
      aria-pressed={!submitted ? inContext : undefined}
      aria-label={
        !submitted
          ? `${block.label}: ${
              inContext
                ? text(
                    "aus Context-Window entfernen",
                    "remove from context window",
                  )
                : text("zum Context-Window hinzufügen", "add to context window")
            }`
          : undefined
      }
      onKeyDown={(e) => {
        if (!submitted && (e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex min-h-11 items-start gap-2 border px-2.5 py-1.5 text-[12px] transition-colors",
        draggable && "cursor-move",
        !submitted && "cursor-pointer hover:border-brand-orange",
        block.mustHave
          ? "border-brand-orange/60 bg-brand-orange/5"
          : "border-border bg-background",
        shownAsMust && "border-destructive bg-destructive/5",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-foreground">{block.label}</span>
          {block.mustHave && (
            <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              Must
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {block.description}
        </p>
      </div>
      <span className="shrink-0 font-mono text-xs font-bold text-foreground">
        {block.tokens.toLocaleString(locale === "en" ? "en-GB" : "de-DE")}
      </span>
    </div>
  );
}

export { gradeBudget };
