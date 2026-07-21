"use client";

import { useMemo, useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { RunConsole } from "./_run-console";
import { shareabilityFeedback, simulatedDelayMs } from "@/lib/claude-course/simulated-claude";

/**
 * PromptLibraryShaper, turn a personal prompt into a team-shareable one.
 * Ported from `claude/js/widgets.js:1246` (PromptLibraryShaper).
 */
export interface PromptLibraryShaperWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
}

const SAMPLE =
  "Write a PR review for the change in my auth-service repo. Use the style we agreed on in last week's #eng-chat thread. Focus on the stuff Jane and I care about.";

const IDEAL = `# When to use: drafting a PR review on any repo the team maintains.
# Watch out: tends to over-praise; strip the opener if it appears.

You are a senior reviewer on the <PROJECT> codebase.

CONTEXT
We follow the team conventions in the project's CLAUDE.md. The change is in <AREA>.

TASK
Review the diff below. Prioritize: correctness, test coverage, naming, and whether it matches our existing patterns.

FORMAT
Three sections: "Must fix", "Worth considering", "Nits". Bullet points, <=10 words each.

EXAMPLE OUTPUT
## Must fix
- Null check on line 42, config can be undefined from loadEnv().
## Worth considering
- Extract retry loop into helper; it's now duplicated in 3 files.
## Nits
- Prefer const over let on line 17.

DIFF
<paste diff here>`;

interface Check {
  readonly id: string;
  readonly label: string;
  readonly ok: boolean;
  readonly partial: boolean;
  readonly hint: string;
}

function computeChecks(value: string): readonly Check[] {
  const lower = value.toLowerCase();
  const hasPlaceholder = /<[A-Z_]{2,}>|\{\{[^}]+\}\}|\[YOUR[_ ][A-Z]+\]/i.test(value);
  const hasHardcoded = /auth-service|jane|my |#eng-chat|last week|my team|my repo/i.test(lower);
  const hasWhenToUse = /when to use|use this when|for:|# when/i.test(lower);
  const hasOutputExample =
    /example( output)?:|sample output|here's an example|→/i.test(lower) || /```/.test(value);
  const hasFailureNote = /failure mode|tends to|watch out|caveat|note:/i.test(lower);
  const hasRole = /you are|act as|your role/i.test(lower);
  const hasStructure =
    value.split(/\n\n+/).length >= 3 || /(CONTEXT|TASK|CONSTRAINTS|FORMAT|EXAMPLE)/i.test(value);

  return [
    {
      id: "parameterized",
      label: "Parameterized",
      ok: hasPlaceholder && !hasHardcoded,
      partial: hasPlaceholder && hasHardcoded,
      hint: hasHardcoded
        ? "Swap hardcoded names (repo, teammates, channels) for <PLACEHOLDERS>."
        : hasPlaceholder
          ? "Good, has placeholders."
          : "No placeholders found. Add <PROJECT>, <TEAMMATE> etc.",
    },
    {
      id: "when",
      label: '"When to use" note',
      ok: hasWhenToUse,
      partial: false,
      hint: hasWhenToUse
        ? "Good, future-you will thank you."
        : 'Add a one-line "# When to use: …" at the top.',
    },
    {
      id: "example",
      label: "Sample output",
      ok: hasOutputExample,
      partial: false,
      hint: hasOutputExample
        ? "Good, sets expectations cleanly."
        : 'Show an "Example output:" so teammates know what to expect.',
    },
    {
      id: "failure",
      label: "Failure-mode note",
      ok: hasFailureNote,
      partial: false,
      hint: hasFailureNote
        ? "Good, forewarning compounds."
        : 'Add a "# Watch out: …" note about the thing it gets wrong.',
    },
    {
      id: "structure",
      label: "Structured shape",
      ok: hasStructure && hasRole,
      partial: !(hasStructure && hasRole) && (hasStructure || hasRole),
      hint:
        hasStructure && hasRole
          ? "Good, role + sections."
          : 'Add a role ("You are …") and clear sections.',
    },
  ];
}

export function PromptLibraryShaperWidget({
  lessonId,
  cpId,
}: PromptLibraryShaperWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [value, setValue] = useState(SAMPLE);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => computeChecks(value), [value]);
  const score = Math.round(
    ((checks.filter((c) => c.ok).length + checks.filter((c) => c.partial).length * 0.5) /
      checks.length) *
      100,
  );
  const scoreColor = score >= 80 ? "text-[#22c55e]" : score >= 50 ? "text-brand-amber" : "text-destructive";

  const askClaude = async () => {
    setLoading(true);
    setFeedback(null);
    await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs(value)));
    setFeedback(shareabilityFeedback());
    setLoading(false);
    if (score >= 80) complete();
  };

  return (
    <WidgetFrame
      kindLabel="Shape for sharing"
      title="From personal prompt to team prompt"
      scenario='Edit the prompt on the left. The checks on the right update live. At 80+, hit "Let Claude review" for a final sanity check.'
      done={done}
      xpLabel="+20 XP"
    >
      <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
              the prompt
            </span>
            <button
              type="button"
              onClick={() => setValue(IDEAL)}
              className="border border-border bg-background px-2 py-1 font-mono text-[10px] font-bold uppercase text-muted-foreground transition-colors hover:border-brand-orange/60"
            >
              Load an ideal version
            </button>
          </div>
          <textarea
            rows={16}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Shareable prompt draft"
            className="min-h-[360px] flex-1 border-2 border-border bg-background px-3 py-2 font-mono text-[13px] text-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            shareability checks
          </span>
          {checks.map((check) => (
            <div
              key={check.id}
              className={cn(
                "grid grid-cols-[18px_1fr] gap-2 border p-2.5",
                check.ok
                  ? "border-[#22c55e] bg-[#22c55e]/5"
                  : check.partial
                    ? "border-brand-amber bg-brand-amber/10"
                    : "border-border bg-card/40",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white",
                  check.ok ? "bg-[#22c55e]" : check.partial ? "bg-brand-amber" : "bg-border",
                )}
              >
                {check.ok ? "✓" : check.partial ? "~" : ""}
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-foreground">
                  {check.label}
                </span>
                <span className="block text-[12px] leading-[1.4] text-muted-foreground">
                  {check.hint}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className={cn("font-mono text-[11px] font-bold uppercase tracking-[0.1em]", scoreColor)}>
          shareability · {score}
        </span>
        <button
          type="button"
          onClick={askClaude}
          disabled={loading}
          className={cn(
            "inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          )}
        >
          {loading ? "Reviewing…" : "Let Claude review →"}
        </button>
      </div>
      <RunConsole
        loading={loading}
        output={feedback}
        onClear={() => setFeedback(null)}
        label="claude's take"
        tone="amber"
      />
    </WidgetFrame>
  );
}

export default PromptLibraryShaperWidget;
