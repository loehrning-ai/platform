"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { RunConsole } from "./_run-console";
import {
  genericAnswer,
  simulatedDelayMs,
} from "@/lib/claude-course/simulated-claude";
import { useClaudeWidgetLocale } from "./locale-context";

/**
 * PromptCompare applies the same fixed local response rules to two prompts.
 * It does not call a model.
 */
export interface PromptCompareWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly weak: string;
  readonly strong: string;
}

export function PromptCompareWidget({
  lessonId,
  cpId,
  weak,
  strong,
}: PromptCompareWidgetProps): JSX.Element {
  const locale = useClaudeWidgetLocale();
  const german = locale === "de";
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [outputA, setOutputA] = useState<string | null>(null);
  const [outputB, setOutputB] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setOutputA(null);
    setOutputB(null);
    await new Promise((resolve) =>
      setTimeout(resolve, simulatedDelayMs(weak + strong)),
    );
    setOutputA(genericAnswer(weak, locale));
    setOutputB(genericAnswer(strong, locale));
    setLoading(false);
    complete();
  };

  return (
    <WidgetFrame
      kindLabel={german ? "Vergleich" : "Compare"}
      title={german ? "Zwei Prompts vergleichen" : "Compare two prompts"}
      done={done}
      xpLabel="+15 XP"
    >
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        )}
      >
        {loading
          ? german
            ? "Beide werden ausgeführt…"
            : "Running both…"
          : german
            ? "Beide simulieren →"
            : "Run both →"}
      </button>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-destructive">
            {german ? "Unklarer Prompt" : "Weak prompt"}
          </p>
          <pre className="mt-1 max-h-[150px] overflow-y-auto whitespace-pre-wrap break-words border border-border bg-card/40 p-2 font-mono text-[12px] text-foreground">
            {weak}
          </pre>
          <RunConsole
            loading={loading}
            output={outputA}
            onClear={() => setOutputA(null)}
            label={
              german ? "Ausgabe zum unklaren Prompt" : "Weak-prompt output"
            }
            tone="bad"
            emptyHint={
              german ? "Die Ausgabe erscheint hier." : "Output appears here."
            }
          />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-risk-green">
            {german ? "Strukturierter Prompt" : "Structured prompt"}
          </p>
          <pre className="mt-1 max-h-[150px] overflow-y-auto whitespace-pre-wrap break-words border border-border bg-card/40 p-2 font-mono text-[12px] text-foreground">
            {strong}
          </pre>
          <RunConsole
            loading={loading}
            output={outputB}
            onClear={() => setOutputB(null)}
            label={
              german
                ? "Ausgabe zum strukturierten Prompt"
                : "Structured-prompt output"
            }
            tone="ok"
            emptyHint={
              german ? "Die Ausgabe erscheint hier." : "Output appears here."
            }
          />
        </div>
      </div>
    </WidgetFrame>
  );
}

export default PromptCompareWidget;
