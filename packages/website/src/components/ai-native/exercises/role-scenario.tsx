"use client";

import { useState, type JSX } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  ExerciseShell,
  ExerciseResetButton,
  submitExercise,
} from "./_shell";
import type { ModuleId } from "@/lib/ai-native/types";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/**
 * Role-Scenario-Picker — user picks a Mittelstand role, then works through
 * 3 role-specific scenarios (each a single-choice quiz with 4 options).
 * Score = fraction of scenarios answered correctly.
 *
 * Pure grading.
 * See AI-native lesson system.
 */

export interface RoleScenarioOption {
  readonly id: string;
  readonly label: string;
  readonly correct: boolean;
  readonly explanation: string;
}

export interface RoleScenario {
  readonly id: string;
  readonly question: string;
  readonly options: readonly RoleScenarioOption[];
}

export interface Role {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly scenarios: readonly RoleScenario[];
}

export interface RoleScenarioSpec {
  readonly exerciseId: string;
  readonly lessonId: string;
  readonly moduleId: ModuleId;
  readonly title: string;
  readonly scenario: string;
  readonly roles: readonly Role[];
}

export function RoleScenarioExercise(props: RoleScenarioSpec): JSX.Element {
  return (
    <ExerciseShell
      moduleId={props.moduleId}
      lessonId={props.lessonId}
      exerciseId={props.exerciseId}
      kind="exercise-role-scenario"
      title={props.title}
      scenario={props.scenario}
    >
      <RoleScenarioBody {...props} />
    </ExerciseShell>
  );
}

function RoleScenarioBody({
  exerciseId,
  lessonId,
  moduleId,
  roles,
}: RoleScenarioSpec): JSX.Element {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const role = roles.find((r) => r.id === selectedRoleId) ?? null;

  const handleSubmit = () => {
    if (!role) return;
    const correctCount = role.scenarios.reduce((sum, s) => {
      const picked = s.options.find((o) => o.id === answers[s.id]);
      return sum + (picked?.correct ? 1 : 0);
    }, 0);
    const score = role.scenarios.length === 0 ? 0 : correctCount / role.scenarios.length;
    setSubmitted(true);
    submitExercise({
      moduleId,
      lessonId,
      exerciseId,
      kind: "exercise-role-scenario",
      score,
    });
  };

  const handleReset = () => {
    setSubmitted(false);
    setSelectedRoleId(null);
    setAnswers({});
  };

  const allAnswered =
    role !== null && role.scenarios.every((s) => answers[s.id] !== undefined);
  const correctCount = role
    ? role.scenarios.reduce((sum, s) => {
        const picked = s.options.find((o) => o.id === answers[s.id]);
        return sum + (picked?.correct ? 1 : 0);
      }, 0)
    : 0;
  const scorePct = role && role.scenarios.length > 0
    ? Math.round((correctCount / role.scenarios.length) * 100)
    : 0;

  return (
    <div>
      {/* Role picker */}
      {!role ? (
        <>
          <p className="mb-3 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Wähle deine Rolle
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRoleId(r.id)}
                className="border border-border bg-card/40 p-4 text-left transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-foreground hover:shadow-[3px_3px_0_0_var(--color-foreground)]"
              >
                <div className="text-[14px] font-bold tracking-[-0.02em] text-foreground">
                  {r.label}
                </div>
                <div className="mt-1 text-[12.5px] text-muted-foreground">
                  {r.description}
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-orange">
                  {r.scenarios.length} Szenarien →
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Back + role header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
            <div className="flex items-baseline gap-2">
              <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                Rolle:
              </p>
              <p className="text-[13px] font-bold text-foreground">{role.label}</p>
            </div>
            {!submitted && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleId(null);
                  setAnswers({});
                }}
                className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-brand-orange"
              >
                ← Andere Rolle
              </button>
            )}
          </div>

          {/* Scenarios */}
          <ol className="space-y-4">
            {role.scenarios.map((s, idx) => {
              const picked = answers[s.id];
              return (
                <li key={s.id}>
                  <div className="mb-2 flex gap-2">
                    <span className="mt-0.5 shrink-0 font-mono text-[11px] font-bold text-brand-orange">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[14px] font-medium leading-[1.45] text-foreground">
                      {s.question}
                    </p>
                  </div>
                  <div className="ml-6 space-y-1.5">
                    {s.options.map((opt) => {
                      const isPicked = picked === opt.id;
                      const showFeedback = submitted && isPicked;
                      const showCorrect = submitted && opt.correct && !isPicked;
                      return (
                        <label
                          key={opt.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-2.5 border px-3 py-2 text-[13px] transition-colors",
                            submitted && "cursor-default",
                            isPicked && !submitted && "border-brand-orange bg-brand-orange/5",
                            showFeedback && opt.correct && "border-risk-green bg-risk-green/5",
                            showFeedback && !opt.correct && "border-destructive bg-destructive/5",
                            showCorrect && "border-risk-green/40 bg-risk-green/5",
                            !isPicked && !submitted && "border-border hover:border-foreground",
                          )}
                        >
                          <input
                            type="radio"
                            name={s.id}
                            value={opt.id}
                            checked={isPicked}
                            onChange={() =>
                              !submitted &&
                              setAnswers({ ...answers, [s.id]: opt.id })
                            }
                            disabled={submitted}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-orange"
                          />
                          <span className="flex-1 leading-[1.4] text-foreground">
                            {opt.label}
                          </span>
                          {submitted && isPicked && (
                            <span>
                              {opt.correct ? (
                                <CheckCircle2 size={14} className="text-risk-green" />
                              ) : (
                                <XCircle size={14} className="text-destructive" />
                              )}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {submitted && picked && (
                    <m.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                      className="ml-6 mt-1.5 border-l-2 border-border pl-3 text-[12.5px] italic text-muted-foreground"
                    >
                      {s.options.find((o) => o.id === picked)?.explanation}
                    </m.p>
                  )}
                </li>
              );
            })}
          </ol>

          <AnimatePresence>
            {submitted && (
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                className={cn(
                  "mt-4 border-l-[3px] px-4 py-3",
                  scorePct >= 66 ? "border-risk-green bg-risk-green/5" : "border-brand-amber bg-brand-amber/5",
                )}
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                  {correctCount}/{role.scenarios.length} richtig · Score {scorePct}%
                </p>
              </m.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!submitted ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allAnswered}
                className={cn(
                  "inline-flex items-center gap-1.5 border-2 border-foreground px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                  allAnswered
                    ? "bg-brand-orange shadow-[3px_3px_0_0_var(--color-foreground)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-foreground)]"
                    : "cursor-not-allowed bg-muted-foreground opacity-60",
                )}
              >
                Auswerten
              </button>
            ) : (
              <ExerciseResetButton onReset={handleReset} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
