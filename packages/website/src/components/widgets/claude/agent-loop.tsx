"use client";

import { useState, type JSX } from "react";
import { useCheckpoint } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { WidgetFrame } from "../tier-a/_frame";
import { useClaudeWidgetLocale } from "./locale-context";

/**
 * AgentLoop reveals a fixed decide/tool/observe/final example step by step.
 * The data is local and no model, filesystem, or tool call occurs.
 */
export interface AgentLoopWidgetProps {
  readonly lessonId: string;
  readonly cpId: string;
}

type StepType = "plan" | "tool" | "final";

interface AgentStep {
  readonly type: StepType;
  readonly text?: string;
  readonly name?: string;
  readonly args?: Record<string, string>;
  readonly obs?: string;
}

const TOOL_OUTPUT: Record<string, string> = {
  list_files:
    "src/main.ts (12kb)\nsrc/utils.ts (3kb)\nsrc/renderer/engine.ts (48kb)\nsrc/renderer/shaders.ts (22kb)\nREADME.md (4kb)",
  read_file:
    "// src/renderer/engine.ts, WebGL2 render engine\n// Main entry: initEngine(canvas). Manages render loop, frame timing,\n// shader compilation, and the scene graph. ~1200 LOC.\nexport function initEngine(canvas) { /* ... */ }",
};

const TOOL_OUTPUT_DE: Record<string, string> = {
  list_files:
    "src/main.ts (12 KB)\nsrc/utils.ts (3 KB)\nsrc/renderer/engine.ts (48 KB)\nsrc/renderer/shaders.ts (22 KB)\nREADME.md (4 KB)",
  read_file:
    "// src/renderer/engine.ts, WebGL2-Render-Engine\n// Einstieg: initEngine(canvas). Verwaltet Render-Schleife, Frame-Timing,\n// Shader-Kompilierung und Szenengraph. Etwa 1200 Codezeilen.\nexport function initEngine(canvas) { /* ... */ }",
};

const SCRIPT: readonly AgentStep[] = [
  {
    type: "plan",
    text: "Next action: list repository files and compare reported sizes.",
  },
  {
    type: "tool",
    name: "list_files",
    args: { path: "src/" },
    obs: TOOL_OUTPUT.list_files,
  },
  {
    type: "plan",
    text: "Observed result: engine.ts has the largest reported size. Next action: read it for evidence about purpose.",
  },
  {
    type: "tool",
    name: "read_file",
    args: { path: "src/renderer/engine.ts" },
    obs: TOOL_OUTPUT.read_file,
  },
  {
    type: "plan",
    text: "The file comment supplies its purpose and entry point. The fixed demonstration can now produce its answer.",
  },
  {
    type: "final",
    text: "The largest file is src/renderer/engine.ts (48kb). It is a WebGL2 render engine that manages the render loop, frame timing, shader compilation, and the scene graph. Main entry point is initEngine(canvas).",
  },
];

const SCRIPT_DE: readonly AgentStep[] = [
  {
    type: "plan",
    text: "Nächste Aktion: Dateien auflisten und die gemeldeten Größen vergleichen.",
  },
  {
    type: "tool",
    name: "list_files",
    args: { path: "src/" },
    obs: TOOL_OUTPUT_DE.list_files,
  },
  {
    type: "plan",
    text: "Beobachtung: engine.ts hat die größte gemeldete Dateigröße. Nächste Aktion: Datei als Beleg für ihren Zweck lesen.",
  },
  {
    type: "tool",
    name: "read_file",
    args: { path: "src/renderer/engine.ts" },
    obs: TOOL_OUTPUT_DE.read_file,
  },
  {
    type: "plan",
    text: "Der Dateikommentar nennt Zweck und Einstiegspunkt. Die feste Demonstration kann die Antwort ausgeben.",
  },
  {
    type: "final",
    text: "Die größte Datei ist src/renderer/engine.ts mit 48 KB. Sie implementiert eine WebGL2-Render-Engine für Render-Schleife, Frame-Timing, Shader-Kompilierung und Szenengraph. Der Haupteinstiegspunkt ist initEngine(canvas).",
  },
];

const STEP_LABEL: Record<StepType, string> = {
  plan: "plan",
  tool: "tool",
  final: "answer",
};

export function AgentLoopWidget({
  lessonId,
  cpId,
}: AgentLoopWidgetProps): JSX.Element {
  const locale = useClaudeWidgetLocale();
  const german = locale === "de";
  const script = german ? SCRIPT_DE : SCRIPT;
  const { done, complete } = useCheckpoint(lessonId, cpId);
  const goal = german
    ? "Finde die größte Datei im Repository und fasse ihren Zweck zusammen."
    : "Find the largest file in the repo and summarize its purpose.";
  const [steps, setSteps] = useState<readonly AgentStep[]>([]);
  const [running, setRunning] = useState(false);
  const [ranOnce, setRanOnce] = useState(false);

  const run = async () => {
    setRunning(true);
    setSteps([]);
    for (const step of script) {
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
      title={
        german
          ? "Eine Agentenschleife Schritt für Schritt"
          : "Watch an agent loop, step by step"
      }
      scenario={
        german
          ? "Feste lokale Demonstration ohne Modell- oder Tool-Aufruf. Das Ziel und alle Ergebnisse sind Beispieldaten."
          : "Fixed local demonstration with no model or tool call. The goal and every result are example data."
      }
      done={done}
      xpLabel="+20 XP"
    >
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label
            htmlFor={`agent-loop-goal-${lessonId}-${cpId}`}
            className="mb-1 block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"
          >
            {german ? "Ziel" : "Goal"}
          </label>
          <input
            id={`agent-loop-goal-${lessonId}-${cpId}`}
            type="text"
            value={goal}
            readOnly
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
          {running
            ? german
              ? "Wird ausgeführt…"
              : "Running…"
            : ranOnce
              ? german
                ? "Erneut ausführen"
                : "Run again"
              : german
                ? "Schleife starten →"
                : "Start loop →"}
        </button>
      </div>

      <div className="flex min-h-[120px] flex-col gap-2">
        {steps.map((step, i) => (
          <div
            key={i}
            data-step-type={step.type}
            className={cn(
              "grid grid-cols-[64px_minmax(0,1fr)] gap-3 border p-3 sm:grid-cols-[80px_minmax(0,1fr)]",
              step.type === "final"
                ? "border-risk-green bg-risk-green/5"
                : "border-border bg-card/40",
            )}
          >
            <span
              className={cn(
                "font-mono text-[10.5px] uppercase tracking-[0.08em]",
                step.type === "tool"
                  ? "text-brand-amber"
                  : step.type === "final"
                    ? "text-risk-green"
                    : "text-muted-foreground",
              )}
            >
              {german
                ? step.type === "plan"
                  ? "Plan"
                  : step.type === "tool"
                    ? "Tool"
                    : "Antwort"
                : STEP_LABEL[step.type]}
            </span>
            <div className="min-w-0 text-[13.5px] leading-[1.5] text-foreground">
              {step.type === "tool" ? (
                <div>
                  <code className="inline-block max-w-full overflow-x-auto border border-border bg-background px-1.5 py-0.5 align-bottom font-mono text-[12px]">
                    {step.name}({JSON.stringify(step.args)})
                  </code>
                  <pre className="mt-2 max-h-[120px] overflow-auto whitespace-pre-wrap border border-border bg-background p-2 font-mono text-[12px]">
                    {step.obs}
                  </pre>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{step.text}</p>
              )}
            </div>
          </div>
        ))}
        {steps.length === 0 && !running && (
          <p className="py-8 text-center text-[13.5px] italic text-muted-foreground">
            {german
              ? "Starte die Schleife, um die einzelnen Schritte zu sehen."
              : "Start the loop to see each step."}
          </p>
        )}
      </div>
    </WidgetFrame>
  );
}

export default AgentLoopWidget;
