"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";

/**
 * AgentLoop, a canned think/act/observe/final script, revealed step by
 * step. Ported from `claude/js/widgets.js:783` (AgentLoop). The source
 * script is hardcoded (no live call there either); this port keeps the
 * exact same steps.
 */
export interface AgentLoopWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
}

type StepType = "think" | "tool" | "final";

interface AgentStep {
  readonly type: StepType;
  readonly text?: string;
  readonly name?: string;
  readonly args?: Record<string, string>;
  readonly obs?: string;
}

const TOOL_OUTPUT: Record<string, string> = {
  list_files: "src/main.ts (12kb)\nsrc/utils.ts (3kb)\nsrc/renderer/engine.ts (48kb)\nsrc/renderer/shaders.ts (22kb)\nREADME.md (4kb)",
  read_file:
    "// src/renderer/engine.ts, WebGL2 render engine\n// Main entry: initEngine(canvas). Manages render loop, frame timing,\n// shader compilation, and the scene graph. ~1200 LOC.\nexport function initEngine(canvas) { /* ... */ }",
};

const SCRIPT: readonly AgentStep[] = [
  { type: "think", text: "I need to find the largest file first. I'll list the repo." },
  {
    type: "tool",
    name: "list_files",
    args: { path: "src/" },
    obs: TOOL_OUTPUT.list_files,
  },
  {
    type: "think",
    text: "engine.ts is largest at 48kb. Reading it to summarize purpose.",
  },
  {
    type: "tool",
    name: "read_file",
    args: { path: "src/renderer/engine.ts" },
    obs: TOOL_OUTPUT.read_file,
  },
  { type: "think", text: "It's a WebGL2 render engine. I have enough to answer." },
  {
    type: "final",
    text: "The largest file is src/renderer/engine.ts (48kb). It is a WebGL2 render engine that manages the render loop, frame timing, shader compilation, and the scene graph. Main entry point is initEngine(canvas).",
  },
];

const STEP_LABEL: Record<StepType, string> = {
  think: "think",
  tool: "tool",
  final: "answer",
};

export function AgentLoopWidget({ lessonId, cpId }: AgentLoopWidgetProps): JSX.Element {
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const [goal, setGoal] = useState(
    "Find the largest file in the repo and summarize its purpose.",
  );
  const [steps, setSteps] = useState<readonly AgentStep[]>([]);
  const [running, setRunning] = useState(false);
  const [ranOnce, setRanOnce] = useState(false);

  const run = async () => {
    setRunning(true);
    setSteps([]);
    for (const step of SCRIPT) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      setSteps((prev) => [...prev, step]);
    }
    setRunning(false);
    setRanOnce(true);
    complete();
  };

  return (
    <WidgetFrame
      kindLabel="Simulation"
      title="Watch an agent loop, step by step"
      scenario="A real agent alternates between thinking and calling tools. Here's how Claude would tackle a small task."
      done={done}
      xpLabel="+20 XP"
    >
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label
            htmlFor={`agent-loop-goal-${lessonId}-${cpId}`}
            className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
          >
            the goal
          </label>
          <input
            id={`agent-loop-goal-${lessonId}-${cpId}`}
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full border-2 border-border bg-background px-3 py-2 text-[14px] text-foreground focus-visible:border-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          />
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className={cn(
            "inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-white shadow-[3px_3px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0_0_var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          )}
        >
          {running ? "Running…" : ranOnce ? "Run again" : "Start loop →"}
        </button>
      </div>

      <div className="flex min-h-[120px] flex-col gap-2">
        {steps.map((step, i) => (
          <div
            key={i}
            data-step-type={step.type}
            className={cn(
              "grid grid-cols-[80px_1fr] gap-3 border p-3",
              step.type === "final"
                ? "border-[#22c55e] bg-[#22c55e]/5"
                : "border-border bg-card/40",
            )}
          >
            <span
              className={cn(
                "font-mono text-[10.5px] uppercase tracking-[0.08em]",
                step.type === "tool"
                  ? "text-brand-amber"
                  : step.type === "final"
                    ? "text-[#22c55e]"
                    : "text-muted-foreground",
              )}
            >
              {STEP_LABEL[step.type]}
            </span>
            <div className="text-[13.5px] leading-[1.5] text-foreground">
              {step.type === "tool" ? (
                <div>
                  <code className="border border-border bg-background px-1.5 py-0.5 font-mono text-[12px]">
                    {step.name}({JSON.stringify(step.args)})
                  </code>
                  <pre className="mt-2 max-h-[120px] overflow-auto whitespace-pre-wrap border border-border bg-background p-2 font-mono text-[12px]">
                    {step.obs}
                  </pre>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{step.text}</p>
              )}
            </div>
          </div>
        ))}
        {steps.length === 0 && !running && (
          <p className="py-8 text-center text-[13.5px] italic text-muted-foreground">
            Click &quot;Start loop&quot; to see the agent work.
          </p>
        )}
      </div>
    </WidgetFrame>
  );
}

export default AgentLoopWidget;
