"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { RunConsole } from "./_run-console";
import { fillBlankFeedback, simulatedDelayMs } from "@/lib/claude-course/simulated-claude";

/**
 * FillBlank, fill in a real prompt template, then get coaching feedback
 * from the simulated Claude. Ported from `claude/js/widgets.js:240`
 * (FillBlank).
 */
export interface FillBlankItem {
  readonly label: string;
  readonly hint?: string;
}

export interface FillBlankWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly goal: string;
  /** Template text with `{{0}}`, `{{1}}`, … placeholders. */
  readonly template: string;
  readonly blanks: readonly FillBlankItem[];
}

function renderPreview(template: string, values: readonly string[]): string {
  return template.replace(/\{\{(\d+)\}\}/g, (_, index: string) => {
    const value = values[Number(index)];
    return value ? `**${value}**` : "____";
  });
}

export function FillBlankWidget({
  lessonId,
  cpId,
  goal,
  template,
  blanks,
}: FillBlankWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [values, setValues] = useState<string[]>(() => blanks.map(() => ""));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs(values.join("|"))));
    setFeedback(fillBlankFeedback());
    setLoading(false);
    if (values.every((v) => v.trim().length > 2)) complete();
  };

  const allFilled = values.every((v) => v.trim().length > 0);

  return (
    <WidgetFrame kindLabel="Drill" title="Fill in the prompt" done={done} xpLabel="+10 XP">
      <p className="mb-3 text-[13.5px] leading-[1.5] text-muted-foreground">
        <strong className="text-foreground">Goal:</strong> {goal}
      </p>
      <pre className="mb-4 whitespace-pre-wrap break-words border border-border bg-card/40 p-3 font-mono text-[13px] text-foreground">
        {renderPreview(template, values)}
      </pre>
      <div className="flex flex-col gap-3">
        {blanks.map((blank, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[140px_1fr] sm:items-center">
            <label
              htmlFor={`fill-blank-${lessonId}-${cpId}-${i}`}
              className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground"
            >
              {blank.label}
            </label>
            <input
              id={`fill-blank-${lessonId}-${cpId}-${i}`}
              type="text"
              value={values[i]}
              onChange={(e) =>
                setValues((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
              }
              placeholder={blank.hint}
              className="border-2 border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={check}
        disabled={loading || !allFilled}
        className={cn(
          "mt-4 inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        )}
      >
        {loading ? "Checking…" : "Have Claude check it →"}
      </button>
      <RunConsole
        loading={loading}
        output={feedback}
        onClear={() => setFeedback(null)}
        label="claude's check"
        tone="amber"
        emptyHint="Fill the blanks, then ask Claude to check."
      />
    </WidgetFrame>
  );
}

export default FillBlankWidget;
