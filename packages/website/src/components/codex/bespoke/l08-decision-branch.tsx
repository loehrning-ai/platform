"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * L08 bespoke interactive — "Decision branch".
 * Ported from `codex/js/lessons/L08.js` (functional parity; the source's
 * animated SVG tree with clickable branches is simplified to plain choice
 * buttons — the graded interaction is picking the right move for each
 * scenario, not the tree-drawing chrome).
 *
 * Three PR scenarios, each with a correct decision (nudge / re-spec /
 * rewrite). Picking correctly advances to the next unsolved scenario;
 * picking wrong shows the "why not" explanation and lets the learner retry.
 * The checkpoint awards once all three scenarios are resolved correctly.
 */

type Decision = "nudge" | "re-spec" | "rewrite";

interface Scenario {
  readonly text: string;
  readonly correct: Decision;
  readonly explanation: string;
  readonly wrongExplanation: string;
}

const SCENARIOS: readonly Scenario[] = [
  {
    text: "Tests 1 of 3 passing, the 2 failures look flaky.",
    correct: "nudge",
    explanation:
      "Correct. The failures might be transient. Ask Codex to investigate the flaky tests before attempting a fix.",
    wrongExplanation:
      "Suboptimal. Nudging Codex to check for flakiness is a faster, lower-effort first step than rewriting or re-speccing.",
  },
  {
    text: "Tests 3 of 3 pass, but the PR adds a 300-line refactor that was not requested.",
    correct: "re-spec",
    explanation: "Correct. The agent went out of scope. Tighten the task specification to prevent unwanted refactoring.",
    wrongExplanation: "Suboptimal. The agent is working but overeager. Re-specifying the scope is the best way to guide it.",
  },
  {
    text: "The PR fundamentally misunderstands the module's purpose.",
    correct: "rewrite",
    explanation:
      "Correct. This is a conceptual error. It's faster for a human to rewrite it than to try and course-correct the agent.",
    wrongExplanation: "Suboptimal. The agent lacks the right context. It's more efficient for a human to take over at this point.",
  },
];

const DECISIONS: readonly Decision[] = ["nudge", "re-spec", "rewrite"];

interface L08DecisionBranchProps {
  readonly lessonId: string;
  readonly cpId: string;
}

export function L08DecisionBranch({ lessonId, cpId }: L08DecisionBranchProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [index, setIndex] = useState(0);
  const [cleared, setCleared] = useState<ReadonlySet<number>>(() => new Set());
  const [feedback, setFeedback] = useState<{ readonly correct: boolean; readonly text: string } | null>(
    null,
  );

  const allCleared = cleared.size === SCENARIOS.length;
  const scenario = SCENARIOS[index];

  const choose = (choice: Decision) => {
    if (allCleared) return;
    const isCorrect = choice === scenario.correct;
    if (isCorrect) {
      const next = new Set(cleared);
      next.add(index);
      setCleared(next);
      setFeedback({ correct: true, text: scenario.explanation });
      if (next.size === SCENARIOS.length) {
        complete();
      } else {
        let nextIndex = (index + 1) % SCENARIOS.length;
        while (next.has(nextIndex)) nextIndex = (nextIndex + 1) % SCENARIOS.length;
        setIndex(nextIndex);
      }
    } else {
      setFeedback({ correct: false, text: scenario.wrongExplanation });
    }
  };

  return (
    <div className="border-2 border-border bg-card/40 p-5 md:p-6">
      <p className="mb-4 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-orange">
        ◆ Bespoke · Decision branch
      </p>
      {allCleared ? (
        <div className="border-2 border-[#22c55e] bg-[#22c55e]/10 p-4 text-center">
          <p className="font-mono text-[14px] font-bold text-[#22c55e]">
            Iteration compass aligned {done ? "✓" : ""}
          </p>
          <p className="mt-1 font-mono text-[12px] text-muted-foreground">
            You've mastered the decision branch.
          </p>
        </div>
      ) : (
        <>
          <div className="border-2 border-border bg-background p-3 text-center font-mono text-[13px] text-foreground">
            {scenario.text}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DECISIONS.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => choose(choice)}
                className="border-2 border-border bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-foreground transition-colors hover:border-brand-orange"
              >
                {choice}
              </button>
            ))}
          </div>
          {feedback && (
            <p
              className={cn(
                "mt-3 font-mono text-[12px]",
                feedback.correct ? "text-[#22c55e]" : "text-destructive",
              )}
            >
              {feedback.text}
            </p>
          )}
          <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
            solved: {cleared.size} / {SCENARIOS.length}
          </p>
        </>
      )}
    </div>
  );
}

export default L08DecisionBranch;
