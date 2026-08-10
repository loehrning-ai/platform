"use client";

import { useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ArrowDown, CheckCircle2, Trash2, XCircle } from "lucide-react";
import {
  ExerciseShell,
  ExerciseResetButton,
  submitExercise,
} from "./_shell";
import type { ModuleId } from "@/lib/ai-native/types";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useDemoLocale } from "@/components/demos/demo-locale";

/**
 * Workflow-Builder — simplified n8n-style ordered-list builder.
 *
 * User picks nodes from a palette (by kind) and arranges them vertically
 * in order. Scoring: required kinds present in the correct relative order
 * → full score. Missing kinds or wrong order → partial/0.
 *
 * Simplified vs. full n8n: linear chain, no branches, no connection math.
 * Still teaches the orchestration concept (trigger → process → action).
 *
 * Pure grading.
 * See AI-native lesson system (simplified).
 */

export interface WorkflowNode {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
  readonly category: "trigger" | "process" | "action";
}

export interface WorkflowSolutionSpec {
  /** Required kind sequence (order matters for full score). */
  readonly requiredKinds: readonly string[];
  /** Minimum score to pass (0..1). Default 0.7. */
  readonly passThreshold?: number;
}

export interface WorkflowBuilderSpec {
  readonly exerciseId: string;
  readonly lessonId: string;
  readonly moduleId: ModuleId;
  readonly title: string;
  readonly scenario: string;
  readonly palette: readonly WorkflowNode[];
  readonly solution: WorkflowSolutionSpec;
}

function gradeWorkflow(
  chain: readonly WorkflowNode[],
  solution: WorkflowSolutionSpec,
): {
  readonly presentCount: number;
  readonly totalRequired: number;
  readonly orderCorrect: boolean;
  readonly score: number;
} {
  const kinds = chain.map((n) => n.kind);
  const required = solution.requiredKinds;
  const presentCount = required.filter((k) => kinds.includes(k)).length;
  if (presentCount === 0) {
    return { presentCount: 0, totalRequired: required.length, orderCorrect: false, score: 0 };
  }
  // Is the relative order of present kinds monotonic in `required`?
  const filteredUser = kinds.filter((k) => required.includes(k));
  const firstIndices = filteredUser.map((k) => required.indexOf(k));
  let orderCorrect = true;
  for (let i = 1; i < firstIndices.length; i++) {
    if (firstIndices[i] < firstIndices[i - 1]) {
      orderCorrect = false;
      break;
    }
  }
  const completeness = presentCount / required.length;
  const score = orderCorrect ? completeness : completeness * 0.5;
  return {
    presentCount,
    totalRequired: required.length,
    orderCorrect,
    score,
  };
}

export function WorkflowBuilderExercise(props: WorkflowBuilderSpec): JSX.Element {
  return (
    <ExerciseShell
      moduleId={props.moduleId}
      lessonId={props.lessonId}
      exerciseId={props.exerciseId}
      kind="exercise-workflow-builder"
      title={props.title}
      scenario={props.scenario}
    >
      <WorkflowBuilderBody {...props} />
    </ExerciseShell>
  );
}

function WorkflowBuilderBody({
  exerciseId,
  lessonId,
  moduleId,
  palette,
  solution,
}: WorkflowBuilderSpec): JSX.Element {
  const { text } = useDemoLocale();
  const [chain, setChain] = useState<WorkflowNode[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const addNode = (node: WorkflowNode) => {
    if (submitted) return;
    // Generate a per-use id so duplicate-kind additions work
    const instance = { ...node, id: `${node.id}-${chain.length}-${Date.now()}` };
    setChain([...chain, instance]);
  };

  const removeAt = (idx: number) => {
    if (submitted) return;
    setChain(chain.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (submitted || idx === 0) return;
    const next = [...chain];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setChain(next);
  };
  const moveDown = (idx: number) => {
    if (submitted || idx === chain.length - 1) return;
    const next = [...chain];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    setChain(next);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const grading = gradeWorkflow(chain, solution);
    submitExercise({
      moduleId,
      lessonId,
      exerciseId,
      kind: "exercise-workflow-builder",
      score: grading.score,
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setChain([]);
  };

  const grading = gradeWorkflow(chain, solution);
  const threshold = solution.passThreshold ?? 0.7;
  const passed = grading.score >= threshold;

  return (
    <div>
      <p className="mb-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {text("Baue einen Workflow · Reihenfolge zählt", "Build a workflow · order matters")}
      </p>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
        {/* Palette */}
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Palette
          </p>
          <div className="grid gap-1.5">
            {palette.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => addNode(node)}
                disabled={submitted}
                className="flex items-start gap-2 border border-border bg-card/40 px-3 py-2 text-left transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-foreground hover:shadow-[3px_3px_0_0_var(--color-foreground)] disabled:opacity-60"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-foreground text-brand-orange">
                  {node.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold tracking-[-0.02em] text-foreground">
                    {node.label}
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                    {node.category} · {node.kind}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chain */}
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {text(
              `Dein Workflow (${chain.length} Knoten)`,
              `Your workflow (${chain.length} nodes)`,
            )}
          </p>
          {chain.length === 0 ? (
            <div className="flex min-h-[120px] items-center justify-center border border-dashed border-border bg-card/30 p-4 text-center text-[12px] text-muted-foreground">
              {text(
                "Klicke links einen Palette-Knoten zur Aufnahme.",
                "Select a node from the palette to add it.",
              )}
            </div>
          ) : (
            <ol className="grid gap-1">
              {chain.map((node, idx) => {
                const required = solution.requiredKinds.includes(node.kind);
                return (
                  <li key={node.id}>
                    <div
                      className={cn(
                        "flex items-start gap-2 border px-2.5 py-2",
                        required
                          ? "border-brand-orange/60 bg-brand-orange/5"
                          : "border-border bg-background",
                      )}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-foreground text-brand-orange text-[13px]">
                        {node.icon}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-bold tracking-[-0.02em] text-foreground">
                          {node.label}
                        </div>
                        <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                          {node.kind}
                        </div>
                      </div>
                      {!submitted && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            aria-label={text("Hoch", "Move up")}
                            className="border border-border px-1 text-[11px] text-muted-foreground disabled:opacity-30 hover:border-foreground hover:text-foreground"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveDown(idx)}
                            disabled={idx === chain.length - 1}
                            aria-label={text("Runter", "Move down")}
                            className="border border-border px-1 text-[11px] text-muted-foreground disabled:opacity-30 hover:border-foreground hover:text-foreground"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAt(idx)}
                            aria-label={text("Entfernen", "Remove")}
                            className="border border-border px-1 text-muted-foreground hover:border-destructive hover:text-destructive"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                    {idx < chain.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowDown size={12} className="text-brand-orange" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <AnimatePresence>
        {submitted && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
            className={cn(
              "mt-4 border-l-[3px] px-4 py-3",
              passed ? "border-risk-green bg-risk-green/5" : "border-brand-amber bg-brand-amber/5",
            )}
          >
            <div className="flex items-center gap-2">
              {passed ? (
                <CheckCircle2 size={16} className="text-risk-green" />
              ) : (
                <XCircle size={16} className="text-brand-amber" />
              )}
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                {grading.presentCount}/{grading.totalRequired} {text("Must-Have-Knoten", "required nodes")} ·{" "}
                {grading.orderCorrect
                  ? text("Reihenfolge korrekt", "order correct")
                  : text("Reihenfolge falsch", "order incorrect")} ·{" "}
                Score {Math.round(grading.score * 100)}%
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={chain.length === 0}
            className={cn(
              "inline-flex items-center gap-1.5 border-2 border-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-[background-color,border-color,color,opacity,transform,box-shadow]",
              chain.length === 0
                ? "cursor-not-allowed bg-muted-foreground opacity-60"
                : "bg-brand-orange shadow-[3px_3px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]",
            )}
          >
            {text("Workflow prüfen", "Evaluate workflow")}
          </button>
        ) : (
          <ExerciseResetButton onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

export { gradeWorkflow };
