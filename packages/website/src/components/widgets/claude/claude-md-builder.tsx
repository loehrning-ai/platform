"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { buildClaudeMd, simulatedDelayMs } from "@/lib/claude-course/simulated-claude";

/**
 * ClaudeMdBuilder, fill a short form, get a ready-to-paste CLAUDE.md.
 * Ported from `claude/js/widgets.js:596` (ClaudeMdBuilder).
 */
export interface ClaudeMdBuilderWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
}

interface FieldDef {
  readonly key: "project" | "stack" | "conventions" | "avoid" | "commands";
  readonly label: string;
  readonly placeholder: string;
  readonly rows: number;
}

const FIELDS: readonly FieldDef[] = [
  {
    key: "project",
    label: "Project name + one-line summary",
    placeholder: "e.g. Reporting dashboard, internal tool for build pipeline analytics",
    rows: 2,
  },
  {
    key: "stack",
    label: "Language, framework, important tools",
    placeholder: "e.g. TypeScript, React 18, GraphQL, Jest, Vite",
    rows: 3,
  },
  {
    key: "conventions",
    label: "Coding + doc conventions",
    placeholder: "e.g. Functional components only, tests colocated, team style guide",
    rows: 3,
  },
  {
    key: "avoid",
    label: "Anti-patterns + things not to do",
    placeholder: "e.g. No new npm deps without approval, no any types",
    rows: 3,
  },
  {
    key: "commands",
    label: "Useful commands (build, test, lint)",
    placeholder: "e.g. yarn build, yarn test, arc lint",
    rows: 3,
  },
];

export function ClaudeMdBuilderWidget({
  lessonId,
  cpId,
}: ClaudeMdBuilderWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [fields, setFields] = useState({
    project: "",
    stack: "",
    conventions: "",
    avoid: "",
    commands: "",
  });
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const build = async () => {
    setLoading(true);
    setOutput(null);
    await new Promise((resolve) => setTimeout(resolve, simulatedDelayMs(fields.project)));
    setOutput(buildClaudeMd(fields));
    setLoading(false);
    complete();
  };

  const copy = () => {
    if (!output) return;
    void navigator.clipboard?.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const canBuild = fields.project.trim().length > 0 && fields.stack.trim().length > 0;

  return (
    <WidgetFrame
      kindLabel="Builder"
      title="Generate your CLAUDE.md"
      scenario="Fill the form. Claude drafts your file. Copy, paste, commit. You'll iterate, but you'll iterate from something."
      done={done}
      xpLabel="+25 XP"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          {FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                {field.label}
              </span>
              <textarea
                rows={field.rows}
                value={fields[field.key]}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                placeholder={field.placeholder}
                className="w-full border-2 border-border bg-background px-3 py-2 text-[13.5px] text-foreground placeholder:text-muted-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={build}
            disabled={loading || !canBuild}
            className={cn(
              "inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
            )}
          >
            {loading ? "Drafting…" : "Generate CLAUDE.md →"}
          </button>
        </div>
        <div className="relative flex flex-col">
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            output
          </p>
          <pre className="min-h-[360px] flex-1 whitespace-pre-wrap border border-border bg-card/40 p-3 font-mono text-[12.5px] text-foreground">
            {loading
              ? "Drafting your CLAUDE.md…"
              : output ||
                "// Your generated CLAUDE.md will appear here.\n// Fill in the fields on the left and hit Generate."}
          </pre>
          {output && (
            <button
              type="button"
              onClick={copy}
              className="absolute right-2 top-8 border-2 border-foreground bg-background px-2 py-1 font-mono text-[10px] font-bold uppercase text-foreground shadow-[2px_2px_0_0_var(--color-foreground)]"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>
    </WidgetFrame>
  );
}

export default ClaudeMdBuilderWidget;
