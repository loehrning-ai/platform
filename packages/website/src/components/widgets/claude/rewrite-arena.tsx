"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { RunConsole } from "./_run-console";
import {
  judgeRewrite,
  simulatedDelayMs,
  type ArenaResult,
} from "@/lib/claude-course/simulated-claude";
import { useClaudeWidgetLocale } from "./locale-context";

/**
 * RewriteArena compares generic structure markers with fixed local rules. It
 * does not call a model or interpret the task-specific criteria.
 */
export interface RewriteArenaWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
  readonly original: string;
  readonly task: string;
  readonly criteria: string;
}

const VERDICT_LABEL: Record<ArenaResult["winner"], string> = {
  user: "Rewrite matches more structure rules",
  tie: "Same rule result",
  original: "Original matches more structure rules",
};

const VERDICT_LABEL_DE: Record<ArenaResult["winner"], string> = {
  user: "Überarbeitung erfüllt mehr Strukturregeln",
  tie: "Gleiches Regelergebnis",
  original: "Original erfüllt mehr Strukturregeln",
};

export function RewriteArenaWidget({
  lessonId,
  cpId,
  original,
  task,
  criteria,
}: RewriteArenaWidgetProps): JSX.Element {
  const locale = useClaudeWidgetLocale();
  const german = locale === "de";
  const verdict = german ? VERDICT_LABEL_DE : VERDICT_LABEL;
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ArenaResult | null>(null);
  const [loading, setLoading] = useState(false);

  const judge = async () => {
    if (value.trim().length < 20) return;
    setLoading(true);
    setResult(null);
    await new Promise((resolve) =>
      setTimeout(resolve, simulatedDelayMs(value)),
    );
    const judged = judgeRewrite(original, value, locale);
    setResult(judged);
    setLoading(false);
    complete();
  };

  const tone =
    result?.winner === "user"
      ? "ok"
      : result?.winner === "original"
        ? "bad"
        : result
          ? "amber"
          : "default";

  return (
    <WidgetFrame
      kindLabel={german ? "Überarbeitung" : "Rewrite"}
      title={
        german
          ? "Einen unklaren Prompt überarbeiten"
          : "Revise an unclear prompt"
      }
      scenario={`${german ? "Aufgabe" : "Task"}: ${task}`}
      done={done}
      xpLabel="+15 XP"
    >
      <p className="mb-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {german ? "Original (unklar)" : "Original (unclear)"}
      </p>
      <pre className="mb-3 max-h-[150px] overflow-y-auto whitespace-pre-wrap break-words border border-border bg-card/40 p-2 font-mono text-[12px] text-foreground">
        {original}
      </pre>
      <p className="mb-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {german ? "Deine Überarbeitung" : "Your rewrite"}
      </p>
      <textarea
        rows={6}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          german
            ? "Formuliere den Prompt strukturiert, konkret und eindeutig."
            : "Rewrite it with clear structure, specifics, and no ambiguity."
        }
        aria-label={german ? "Deine Überarbeitung" : "Your rewrite"}
        className="w-full border-2 border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <span className="min-w-0 flex-1 text-[12px] text-muted-foreground">
          {german
            ? "Prüfkriterien zur eigenen Prüfung"
            : "Criteria for your review"}
          : {criteria}
        </span>
        <button
          type="button"
          onClick={judge}
          disabled={loading || value.trim().length < 20}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          )}
        >
          {loading
            ? german
              ? "Wird geprüft…"
              : "Assessing…"
            : german
              ? "Strukturregeln prüfen →"
              : "Check structure rules →"}
        </button>
      </div>
      <RunConsole
        loading={loading}
        output={result ? " " : null}
        label={
          result
            ? verdict[result.winner]
            : german
              ? "Regelbasierte Strukturprüfung"
              : "Rule-based structure check"
        }
        tone={tone}
        emptyHint={
          german
            ? "Reiche deine Überarbeitung zur Prüfung ein."
            : "Submit your rewrite for assessment."
        }
      >
        {result && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[16px] font-bold text-foreground">
                {verdict[result.winner]}
              </p>
              <p className="text-right text-[13px]">
                {german ? "Überarbeitung" : "Rewrite"}:{" "}
                <strong>{result.userScore}</strong> ·{" "}
                {german ? "Original" : "original"}:{" "}
                <strong className="text-muted-foreground">
                  {result.originalScore}
                </strong>
              </p>
            </div>
            <p className="mt-2 text-[13px] leading-[1.5] text-foreground">
              {result.why}
            </p>
          </div>
        )}
      </RunConsole>
    </WidgetFrame>
  );
}

export default RewriteArenaWidget;
