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
import { useClaudeWidgetLocale } from "./locale-context";

/**
 * PromptGrader runs a fixed, local structure heuristic. It does not call a
 * model and does not evaluate the supplied task-specific rubric.
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
  const locale = useClaudeWidgetLocale();
  const german = locale === "de";
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<GraderResult | null>(null);
  const [loading, setLoading] = useState(false);

  const grade = async () => {
    if (value.trim().length < 20) return;
    setLoading(true);
    setResult(null);
    await new Promise((resolve) =>
      setTimeout(resolve, simulatedDelayMs(value)),
    );
    const graded = gradePrompt(value, locale);
    setResult(graded);
    setLoading(false);
    complete();
  };

  const tone =
    result && result.score >= 80
      ? "ok"
      : result && result.score >= 50
        ? "amber"
        : result
          ? "bad"
          : "default";

  return (
    <WidgetFrame
      kindLabel={german ? "Lokale Prüfung" : "Local check"}
      title={
        german
          ? "Prompt-Struktur mit festen Regeln prüfen"
          : "Check prompt structure with fixed rules"
      }
      scenario={`${german ? "Aufgabe" : "Task"}: ${task}`}
      done={done}
      doneLabel={german ? "Erledigt" : "Done"}
    >
      <p className="mb-2 text-[13px] leading-[1.5] text-muted-foreground">
        {german
          ? "Rubrik zur eigenen Prüfung (nicht automatisch bewertet)"
          : "Rubric for your review (not evaluated automatically)"}
        : {rubric}
      </p>
      <textarea
        rows={6}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          german
            ? "Schreibe einen Prompt für diese Aufgabe…"
            : "Write a prompt for that task…"
        }
        aria-label={german ? "Dein Prompt" : "Your prompt"}
        className="min-h-11 w-full border-2 border-border bg-background px-3 py-2 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          {value.length} {german ? "Zeichen" : "chars"} · min. 20
        </span>
        <button
          type="button"
          onClick={grade}
          disabled={loading || value.trim().length < 20}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          )}
        >
          {loading
            ? german
              ? "Wird bewertet…"
              : "Grading…"
            : german
              ? "Struktur prüfen →"
              : "Check structure →"}
        </button>
      </div>
      <RunConsole
        loading={loading}
        output={result ? " " : null}
        label={
          result
            ? `${german ? "Regelbasierter Strukturwert" : "Rule-based structure score"} · ${result.score}/100`
            : german
              ? "Regelbasierte Prüfung"
              : "Rule-based check"
        }
        tone={tone}
        emptyHint={
          german
            ? "Reiche einen Prompt für eine strukturierte Bewertung ein."
            : "Submit a prompt for a structured assessment."
        }
      >
        {result && (
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
            <ScoreDial score={result.score} />
            <div className="text-[13px] leading-[1.5]">
              {result.strengths.length > 0 && (
                <div className="mb-2">
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-risk-green">
                    {german ? "Erkannte Merkmale" : "Detected markers"}
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
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-destructive">
                    {german ? "Fehlend oder unklar" : "Missing or unclear"}
                  </p>
                  <ul className="mt-1 list-disc pl-4">
                    {result.weaknesses.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              <details className="mt-2">
                <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-foreground">
                  {german
                    ? "Überarbeitete Fassung anzeigen"
                    : "View a revised version"}
                </summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words border border-border bg-card/40 p-2 font-mono text-[12px] text-foreground">
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
