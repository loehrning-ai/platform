"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { RunConsole } from "./_run-console";
import { ScoreDial } from "./_score-dial";
import {
  gradePrompt,
  simulatedDelayMs,
  type GraderResult,
} from "@/lib/claude-course/simulated-claude";

/**
 * PromptGrader, write a prompt for a task, get a rubric-graded breakdown
 * from the simulated Claude. Ported from `claude/js/widgets.js:115`
 * (PromptGrader).
 */
export interface PromptGraderWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly task: string;
  readonly rubric: string;
}

export function PromptGraderWidget({
  lessonId,
  cpId,
  task,
  rubric,
}: PromptGraderWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<GraderResult | null>(null);
  const [loading, setLoading] = useState(false);

  const grade = async () => {
    if (value.trim().length < 20) return;
    setLoading(true);
    setResult(null);
    await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs(value)));
    const graded = gradePrompt(value);
    setResult(graded);
    setLoading(false);
    complete();
  };

  const tone =
    result && result.score >= 80 ? "ok" : result && result.score >= 50 ? "amber" : result ? "bad" : "default";

  return (
    <WidgetFrame
      kindLabel="Challenge"
      title="Let Claude grade your prompt"
      scenario={`The task: ${task}`}
      done={done}
      xpLabel="+20 XP"
    >
      <p className="mb-2 text-[13px] leading-[1.5] text-muted-foreground">Rubric: {rubric}</p>
      <textarea
        rows={6}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Write your best prompt for that task…"
        aria-label="Your prompt"
        className="w-full border-2 border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-muted-foreground">
          {value.length} chars · min 20
        </span>
        <button
          type="button"
          onClick={grade}
          disabled={loading || value.trim().length < 20}
          className={cn(
            "inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          )}
        >
          {loading ? "Grading…" : "Grade my prompt →"}
        </button>
      </div>
      <RunConsole
        loading={loading}
        output={result ? " " : null}
        label={result ? `graded · ${result.score}/100` : "judge's verdict"}
        tone={tone}
        emptyHint="Submit a prompt to get a graded breakdown."
      >
        {result && (
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
            <ScoreDial score={result.score} />
            <div className="text-[13px] leading-[1.5]">
              {result.strengths.length > 0 && (
                <div className="mb-2">
                  <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#22c55e]">
                    strengths
                  </p>
                  <ul className="mt-1 list-disc pl-4">
                    {result.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.weaknesses.length > 0 && (
                <div className="mb-2">
                  <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-destructive">
                    weaknesses
                  </p>
                  <ul className="mt-1 list-disc pl-4">
                    {result.weaknesses.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer font-semibold text-foreground">
                  See a stronger rewrite
                </summary>
                <pre className="mt-2 whitespace-pre-wrap border border-border bg-card/40 p-2 font-mono text-[12px] text-foreground">
                  {result.oneBetterRewrite}
                </pre>
              </details>
            </div>
          </div>
        )}
      </RunConsole>
    </WidgetFrame>
  );
}

export default PromptGraderWidget;
