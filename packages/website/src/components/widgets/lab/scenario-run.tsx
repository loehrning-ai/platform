"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import { m } from "framer-motion";
import { Check, Lock, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  evaluateCondition,
  evaluateNumber,
  type ExpressionScope,
} from "@/lib/lesson-engine/expression";
import {
  LAB_EASE,
  LAB_SPRING,
  LabButton,
  LabLive,
  LabSurface,
  LabVerdictPill,
  formatLabValue,
  labLocale,
  useLabCompletion,
  type LabBaseProps,
} from "./_lab";

// ─── scenario-run: switch controls on, run test cases, see what breaks ──
//
// A generic "test run" lab. The learner switches controls on or off (guard
// steps in a workflow, permission scopes for an agent), then runs a fixed set
// of synthetic cases. Each case passes or fails by an authored formula over
// the controls, and explains its outcome. The exercise is done once one run
// satisfies the goal formula (for example "all cases pass without manual
// handling of every item"). Deterministic: no randomness, no model call.

export interface ScenarioStep {
  /** Identifier usable in formulas. */
  readonly id: string;
  readonly label: string;
  readonly detail?: string;
  /** false: a fixed step that is always on (shown, not switchable). */
  readonly optional?: boolean;
  /** Initial state for optional steps (0 or 1). */
  readonly default?: number;
  /** Grid layout: heading the step is grouped under. */
  readonly group?: string;
}

export interface ScenarioCase {
  /** Identifier; the formula scope gets `ok_<id>`. */
  readonly id: string;
  readonly label: string;
  /** The synthetic input, e.g. the mail text. */
  readonly text: string;
  /** Formula over step ids: true when the case is handled correctly. */
  readonly pass: string;
  readonly passText: string;
  readonly failText: string;
}

export interface ScenarioMetric {
  readonly id: string;
  readonly label: string;
  /** Formula over step ids, ok_<case>, passed, total, active and earlier metrics. */
  readonly formula: string;
  readonly format?: "number" | "percent" | "eur" | "int";
  readonly decimals?: number;
}

export interface ScenarioRunProps extends LabBaseProps {
  readonly layout?: "flow" | "grid";
  readonly context?: { readonly label: string; readonly text: string };
  readonly stepsLabel?: string;
  readonly steps: readonly ScenarioStep[];
  readonly cases: readonly ScenarioCase[];
  readonly metrics?: readonly ScenarioMetric[];
  /** Formula over the full scope; a run that satisfies it completes the exercise. */
  readonly goal: string;
  /** The task in words, shown above the controls. */
  readonly goalLabel: string;
  readonly successTitle: string;
  readonly successBody?: string;
  /** Shown after a run that misses the goal although every case passed. */
  readonly goalMissHint?: string;
  readonly note?: string;
}

const COPY = {
  de: {
    region: "Testlauf",
    task: "Aufgabe",
    controls: "Bausteine",
    fixed: "fest",
    on: "an",
    off: "aus",
    run: "Testlauf starten",
    rerun: "Neuer Testlauf",
    results: "Ergebnis des Testlaufs",
    passed: (passed: number, total: number) => `${passed} von ${total} Fällen bestanden`,
    pass: "besteht",
    fail: "scheitert",
    stale: "Du hast Bausteine geändert. Starte einen neuen Testlauf.",
    runs: (count: number) => (count === 1 ? "1 Testlauf" : `${count} Testläufe`),
    miss: "Noch nicht am Ziel. Lies die gescheiterten Fälle und ändere die Bausteine.",
    reached: "Ziel erreicht",
  },
  en: {
    region: "Test run",
    task: "Task",
    controls: "Building blocks",
    fixed: "fixed",
    on: "on",
    off: "off",
    run: "Start test run",
    rerun: "New test run",
    results: "Test run result",
    passed: (passed: number, total: number) => `${passed} of ${total} cases passed`,
    pass: "passes",
    fail: "fails",
    stale: "You changed the building blocks. Start a new test run.",
    runs: (count: number) => (count === 1 ? "1 test run" : `${count} test runs`),
    miss: "Not there yet. Read the failed cases and change the building blocks.",
    reached: "Goal reached",
  },
} as const;

export interface ScenarioRunResult {
  readonly scope: Record<string, number>;
  readonly outcomes: readonly { readonly id: string; readonly ok: boolean }[];
  readonly passed: number;
  readonly goalMet: boolean;
}

/** Evaluate one run (exported for tests and the validator). */
export function runScenario(
  steps: readonly ScenarioStep[],
  cases: readonly ScenarioCase[],
  metrics: readonly ScenarioMetric[],
  goal: string,
  values: Readonly<Record<string, number>>,
): ScenarioRunResult {
  const scope: Record<string, number> = {};
  let active = 0;
  for (const step of steps) {
    const on = step.optional === false ? 1 : values[step.id] ? 1 : 0;
    scope[step.id] = on;
    if (step.optional !== false && on) active += 1;
  }
  const outcomes = cases.map((entry) => ({
    id: entry.id,
    ok: evaluateCondition(entry.pass, scope as ExpressionScope),
  }));
  for (const outcome of outcomes) scope[`ok_${outcome.id}`] = outcome.ok ? 1 : 0;
  const passed = outcomes.filter((outcome) => outcome.ok).length;
  scope.passed = passed;
  scope.total = cases.length;
  scope.active = active;
  for (const metric of metrics) {
    scope[metric.id] = evaluateNumber(metric.formula, scope as ExpressionScope);
  }
  return {
    scope,
    outcomes,
    passed,
    goalMet: evaluateCondition(goal, scope as ExpressionScope),
  };
}

function initialValues(steps: readonly ScenarioStep[]): Record<string, number> {
  return Object.fromEntries(
    steps
      .filter((step) => step.optional !== false)
      .map((step) => [step.id, step.default ? 1 : 0]),
  );
}

function StepSwitch({
  step,
  on,
  onToggle,
  lang,
  disabled,
}: {
  readonly step: ScenarioStep;
  readonly on: boolean;
  readonly onToggle: () => void;
  readonly lang: "de" | "en";
  readonly disabled: boolean;
}): JSX.Element {
  const copy = COPY[lang];
  const labelId = `scenario-step-${step.id}`;
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 transition-[background-color,border-color] duration-150",
        on ? "border-lab-accent/40 bg-lab-accent-soft" : "border-lab-line bg-card",
      )}
    >
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-semibold text-foreground">
          {step.label}
        </p>
        {step.detail ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          "relative inline-flex min-h-11 min-w-[4.5rem] shrink-0 items-center rounded-full px-1 transition-[background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent disabled:cursor-not-allowed",
          on ? "bg-lab-accent" : "bg-track",
        )}
      >
        <m.span
          aria-hidden="true"
          animate={{ x: on ? 28 : 0 }}
          transition={LAB_SPRING}
          className="h-8 w-8 rounded-full bg-paper shadow-lab-sm"
        />
        <span className="sr-only">{on ? copy.on : copy.off}</span>
      </button>
    </div>
  );
}

function FixedStep({ step, lang }: { readonly step: ScenarioStep; readonly lang: "de" | "en" }): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-lab-line bg-inset/50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{step.label}</p>
        {step.detail ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
        ) : null}
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground">
        <Lock aria-hidden="true" className="h-3.5 w-3.5" />
        {COPY[lang].fixed}
      </span>
    </div>
  );
}

export function ScenarioRunWidget({
  layout = "flow",
  context,
  stepsLabel,
  steps,
  cases,
  metrics = [],
  goal,
  goalLabel,
  successTitle,
  successBody,
  goalMissHint,
  note,
  lessonId,
  cpId,
  locale,
  title,
}: ScenarioRunProps): JSX.Element {
  const lang = labLocale(locale);
  const copy = COPY[lang];
  const { complete } = useLabCompletion({ lessonId, cpId });
  const [values, setValues] = useState<Record<string, number>>(() => initialValues(steps));
  const [result, setResult] = useState<ScenarioRunResult | null>(null);
  const [stale, setStale] = useState(false);
  const [runs, setRuns] = useState(0);
  const [reached, setReached] = useState(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const completed = useRef(false);

  useEffect(() => {
    if (result && !stale) resultHeading.current?.focus();
  }, [result, stale, runs]);

  const toggle = (id: string) => {
    setValues((previous) => ({ ...previous, [id]: previous[id] ? 0 : 1 }));
    if (result) setStale(true);
  };

  const run = () => {
    const next = runScenario(steps, cases, metrics, goal, values);
    setResult(next);
    setStale(false);
    setRuns((count) => count + 1);
    if (next.goalMet) {
      setReached(true);
      if (!completed.current) {
        completed.current = true;
        complete();
      }
    }
  };

  const groups =
    layout === "grid"
      ? [...new Set(steps.map((step) => step.group ?? ""))].map((group) => ({
          group,
          steps: steps.filter((step) => (step.group ?? "") === group),
        }))
      : [{ group: "", steps }];

  const announcement = result
    ? `${copy.passed(result.passed, cases.length)}.${result.goalMet ? ` ${copy.reached}: ${successTitle}.` : ` ${copy.miss}`}`
    : "";

  return (
    <LabSurface label={copy.region} title={title}>
      <div className="rounded-2xl border border-lab-line lab-wash-sky px-4 py-3">
        <p className="text-label text-muted-foreground">{copy.task}</p>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-foreground">{goalLabel}</p>
      </div>

      {context ? (
        <details className="mt-3 rounded-2xl border border-lab-line bg-paper px-4">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent">
            {context.label}
          </summary>
          <p className="whitespace-pre-line pb-3 text-sm leading-relaxed text-foreground">{context.text}</p>
        </details>
      ) : null}

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="min-w-0">
          <p className="text-label text-muted-foreground">{stepsLabel ?? copy.controls}</p>
          {groups.map(({ group, steps: groupSteps }) => (
            <div key={group || "all"} className="mt-2">
              {group ? <p className="mb-1.5 mt-3 text-xs font-semibold text-muted-foreground">{group}</p> : null}
              <ol className={cn("space-y-2", layout === "flow" && "relative")}>
                {groupSteps.map((step, index) => (
                  <li key={step.id} className="relative">
                    {layout === "flow" && index > 0 ? (
                      <span aria-hidden="true" className="absolute -top-2 left-6 h-2 w-px bg-lab-line" />
                    ) : null}
                    {step.optional === false ? (
                      <FixedStep step={step} lang={lang} />
                    ) : (
                      <StepSwitch
                        step={step}
                        on={Boolean(values[step.id])}
                        onToggle={() => toggle(step.id)}
                        lang={lang}
                        disabled={false}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LabButton onClick={run}>
              <Play aria-hidden="true" className="h-4 w-4" />
              {runs === 0 ? copy.run : copy.rerun}
            </LabButton>
            {runs > 0 ? <span className="text-xs text-muted-foreground">{copy.runs(runs)}</span> : null}
          </div>
        </div>

        <div className="min-w-0">
          <LabLive className="sr-only">{announcement}</LabLive>
          {result ? (
            <div className={cn("transition-opacity duration-200", stale && "opacity-60")}>
              <div className="rounded-2xl border border-lab-line bg-card p-4 shadow-lab-sm">
                <h4
                  ref={resultHeading}
                  tabIndex={-1}
                  className="text-label text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
                >
                  {copy.results}
                </h4>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {copy.passed(result.passed, cases.length)}
                </p>
                <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-track" aria-hidden="true">
                  <m.div
                    className="h-full rounded-full bg-lab-good"
                    initial={false}
                    animate={{ width: `${cases.length ? (result.passed / cases.length) * 100 : 0}%` }}
                    transition={{ duration: 0.5, ease: LAB_EASE }}
                  />
                </div>
                {metrics.length > 0 ? (
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    {metrics.map((metric) => (
                      <div key={metric.id} className="rounded-xl bg-paper px-3 py-2">
                        <dt className="text-xs text-muted-foreground">{metric.label}</dt>
                        <dd className="text-lg font-bold tabular-nums text-foreground">
                          {formatLabValue(result.scope[metric.id], metric.format, lang, metric.decimals)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                {stale ? <p className="mt-3 text-sm font-semibold text-lab-warn">{copy.stale}</p> : null}
              </div>

              {result.goalMet ? (
                <m.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={LAB_SPRING}
                  className="mt-3 rounded-2xl border border-lab-good/30 bg-lab-good-soft px-4 py-3"
                >
                  <p className="font-semibold text-foreground">{successTitle}</p>
                  {successBody ? <p className="mt-1 text-sm leading-relaxed text-foreground">{successBody}</p> : null}
                </m.div>
              ) : (
                <div className="mt-3 rounded-2xl border border-lab-warn/30 bg-lab-warn-soft px-4 py-3 text-sm leading-relaxed text-foreground">
                  {result.passed === cases.length && goalMissHint ? goalMissHint : copy.miss}
                </div>
              )}

              <ol className="mt-3 space-y-2">
                {cases.map((entry, index) => {
                  const ok = result.outcomes[index]?.ok ?? false;
                  return (
                    <m.li
                      key={`${runs}-${entry.id}`}
                      data-case-id={entry.id}
                      data-case-ok={ok ? "1" : "0"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: LAB_EASE, delay: index * 0.06 }}
                      className={cn(
                        "rounded-2xl border px-4 py-3",
                        ok ? "border-lab-line bg-card" : "border-lab-bad/30 bg-lab-bad-soft",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span aria-hidden="true" className={ok ? "text-lab-good" : "text-lab-bad"}>
                          {ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </span>
                        <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">{entry.label}</p>
                        <LabVerdictPill tone={ok ? "good" : "bad"}>{ok ? copy.pass : copy.fail}</LabVerdictPill>
                      </div>
                      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{entry.text}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-foreground">{ok ? entry.passText : entry.failText}</p>
                    </m.li>
                  );
                })}
              </ol>
            </div>
          ) : (
            <ol className="space-y-2" aria-label={copy.results}>
              {cases.map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-dashed border-lab-line bg-paper px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{entry.label}</p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{entry.text}</p>
                </li>
              ))}
            </ol>
          )}
          {reached && !result?.goalMet ? (
            <p className="mt-3 text-xs text-muted-foreground">{copy.reached}.</p>
          ) : null}
          {note ? <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
        </div>
      </div>
    </LabSurface>
  );
}
