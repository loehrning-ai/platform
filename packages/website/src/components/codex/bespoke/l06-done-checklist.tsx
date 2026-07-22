"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L06 bespoke interactive — "Done checklist engine".
 * Ported from `codex/js/lessons/L06.js` (functional parity; the source's
 * anchor-tag dropdown is a native `<select>` here for real keyboard/a11y
 * support — the graded interaction is picking the correct, checkable
 * rewrite for each ambiguous phrase, not the dropdown chrome).
 *
 * Seven ambiguous phrases ("should work well", "handles edge cases", …),
 * each with three rewrite options where exactly one is genuinely checkable.
 * Picking the correct option marks that row satisfied; picking either
 * distractor marks it unsatisfied. The checkpoint awards once all 7 rows
 * are satisfied.
 */

interface ChecklistItem {
  readonly ambiguous: string;
  readonly options: readonly string[];
  readonly correct: number;
}

const ITEMS: readonly ChecklistItem[] = [
  {
    ambiguous: "should work well",
    options: ["works", "all 47 unit tests pass", "QA is happy"],
    correct: 1,
  },
  {
    ambiguous: "handles edge cases",
    options: [
      "does not crash",
      "empty input returns 400, null input returns 400, 2GB input is rejected with 413",
      "tested some edges",
    ],
    correct: 1,
  },
  {
    ambiguous: "performant",
    options: ["fast enough", "p95 latency under 200ms with 100 concurrent requests", "no slow queries"],
    correct: 1,
  },
  {
    ambiguous: "looks good",
    options: ["no broken layout", "passes existing snapshot tests; new component has a snapshot", "design approved"],
    correct: 1,
  },
  {
    ambiguous: "well-documented",
    options: ["has docs", "new public functions have JSDoc; README section updated", "self-explanatory"],
    correct: 1,
  },
  {
    ambiguous: "tested",
    options: ["has tests", "coverage on changed lines at least 85%, measured by c8", "manually verified"],
    correct: 1,
  },
  {
    ambiguous: "secure",
    options: ["no bugs", "passes npm audit --audit-level high; no new secrets in env logs", "reviewed by security"],
    correct: 1,
  },
];

interface L06DoneChecklistProps {
  readonly lessonId: string;
  readonly cpId: string;
}

export function L06DoneChecklist({ lessonId, cpId }: L06DoneChecklistProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [picked, setPicked] = useState<Record<number, number>>({});

  const satisfiedCount = Object.entries(picked).filter(
    ([i, opt]) => opt === ITEMS[Number(i)].correct,
  ).length;
  const ready = satisfiedCount === ITEMS.length;

  const choose = (itemIndex: number, optionIndex: number) => {
    const next = { ...picked, [itemIndex]: optionIndex };
    setPicked(next);
    const nextSatisfied = Object.entries(next).filter(
      ([i, opt]) => opt === ITEMS[Number(i)].correct,
    ).length;
    if (nextSatisfied === ITEMS.length) complete();
  };

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        ◆ Bespoke · Done checklist engine
      </p>
      <p className="mb-3 font-mono text-[12px] text-muted-foreground">
        definition of done: {satisfiedCount}/{ITEMS.length}
      </p>
      <div className="grid gap-5 md:grid-cols-[1fr_220px]">
        <div className="flex flex-col gap-2.5">
          {ITEMS.map((item, i) => {
            const pickedIdx = picked[i];
            const isCorrect = pickedIdx === item.correct;
            const attempted = pickedIdx !== undefined;
            return (
              <div key={item.ambiguous} className="flex items-center gap-3">
                <span className="w-40 shrink-0 font-mono text-[12px] italic text-muted-foreground line-through">
                  {item.ambiguous}
                </span>
                <select
                  value={pickedIdx ?? ""}
                  onChange={(e) => choose(i, Number(e.target.value))}
                  aria-label={`Rewrite for "${item.ambiguous}"`}
                  className="flex-1 border border-border bg-background px-2 py-1.5 font-mono text-[12px] text-foreground"
                >
                  <option value="" disabled>
                    pick rewrite
                  </option>
                  {item.options.map((opt, j) => (
                    <option key={j} value={j}>
                      {opt}
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full border-2 border-border",
                    attempted && isCorrect && "border-[#22c55e] bg-[#22c55e]",
                    attempted && !isCorrect && "border-brand-amber bg-brand-amber",
                  )}
                />
              </div>
            );
          })}
        </div>
        <div className="border-2 border-border bg-background p-3">
          <p
            className={cn(
              "mb-3 font-mono text-[12px] font-bold uppercase tracking-[0.08em]",
              ready ? "text-[#22c55e]" : "text-muted-foreground",
            )}
          >
            {ready ? `READY${done ? " ✓" : ""}` : "DRAFT"}
          </p>
          <div className="flex flex-col gap-1 font-mono text-[11.5px] text-foreground">
            {ITEMS.map((item, i) => (
              <span key={item.ambiguous}>
                {picked[i] === item.correct ? "☑" : "☐"} Check {i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default L06DoneChecklist;
