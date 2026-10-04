"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { m } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  evaluateCondition,
  evaluateNumber,
  type ExpressionScope,
} from "@/lib/lesson-engine/expression";
import type { Locale } from "@/lib/i18n/locale";
import {
  AnimatedNumber,
  LabLive,
  LabSurface,
  formatLabValue,
  labLocale,
  useLabCompletion,
  type LabBaseProps,
} from "./_lab";

type ValueFormat = "number" | "percent" | "eur" | "int";
type Tone = "accent" | "good" | "bad" | "warn" | "neutral";

export interface CalculatorInput {
  readonly id: string;
  readonly label: string;
  readonly help?: string;
  readonly type: "slider" | "number" | "select" | "toggle";
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly default: number;
  readonly format?: ValueFormat;
  readonly decimals?: number;
  /** Suffix shown after the value, e.g. "Mitarbeitende". */
  readonly unit?: string;
  /** Slider scale. "log" suits values spanning orders of magnitude. */
  readonly scale?: "linear" | "log";
  /** For select: value/label pairs. Up to 4 render as a segmented control. */
  readonly options?: readonly { readonly value: number; readonly label: string }[];
}

export interface CalculatorOutput {
  readonly id: string;
  readonly label: string;
  /** Formula over input ids and earlier output ids. */
  readonly formula: string;
  readonly format?: ValueFormat;
  readonly decimals?: number;
  /** The headline result (rendered large). */
  readonly emphasis?: boolean;
  readonly help?: string;
}

export interface CalculatorBar {
  readonly label: string;
  readonly formula: string;
  readonly tone?: Tone;
}

export interface CalculatorChart {
  /** "bars": horizontal bars on one scale; "stacked": one 100% bar. */
  readonly kind: "bars" | "stacked";
  readonly title?: string;
  readonly format?: ValueFormat;
  readonly decimals?: number;
  readonly bars: readonly CalculatorBar[];
}

export interface CalculatorVerdict {
  /** Condition; the first verdict whose condition holds is shown. */
  readonly when: string;
  readonly tone: Exclude<Tone, "accent">;
  readonly title: string;
  readonly body?: string;
}

export interface CalculatorGoal {
  readonly id: string;
  /** Task, e.g. "Setze die Prävalenz auf 1 %". */
  readonly label: string;
  /** Condition over inputs/outputs; met once it holds (stays met). */
  readonly when: string;
  /** Shown once the goal is met. */
  readonly insight?: string;
}

export interface CalculatorProps extends LabBaseProps {
  readonly inputs: readonly CalculatorInput[];
  readonly outputs: readonly CalculatorOutput[];
  readonly chart?: CalculatorChart;
  readonly verdicts?: readonly CalculatorVerdict[];
  /**
   * Tasks that make the calculator an exercise. When present, the exercise is
   * done once every goal has been met. Without goals it is done after three
   * input changes.
   */
  readonly goals?: readonly CalculatorGoal[];
  /** Small print under the result (assumptions, legal source). */
  readonly note?: string;
}

const COPY = {
  de: {
    region: "Rechner",
    inputs: "Annahmen",
    result: "Ergebnis",
    goals: "Aufgaben",
    goalMet: "erledigt",
    goalOpen: "offen",
    on: "Ja",
    off: "Nein",
    explore: "Verändere die Annahmen und beobachte das Ergebnis.",
  },
  en: {
    region: "Calculator",
    inputs: "Assumptions",
    result: "Result",
    goals: "Tasks",
    goalMet: "done",
    goalOpen: "open",
    on: "Yes",
    off: "No",
    explore: "Change the assumptions and watch the result.",
  },
} as const;

const TONE_BAR: Record<Tone, string> = {
  accent: "bg-lab-accent",
  good: "bg-lab-good",
  bad: "bg-lab-bad",
  warn: "bg-ocker-tief",
  neutral: "bg-border",
};

const TONE_CARD: Record<Exclude<Tone, "accent">, string> = {
  good: "border-lab-good/30 bg-lab-good-soft text-foreground",
  bad: "border-lab-bad/30 bg-lab-bad-soft text-foreground",
  warn: "border-lab-warn/30 bg-lab-warn-soft text-foreground",
  neutral: "border-lab-line bg-inset/60 text-foreground",
};

/** Evaluate inputs + outputs into one scope (exported for tests). */
export function computeCalculatorScope(
  inputs: readonly CalculatorInput[],
  outputs: readonly CalculatorOutput[],
  values: Readonly<Record<string, number>>,
): Record<string, number> {
  const scope: Record<string, number> = {};
  for (const input of inputs) scope[input.id] = values[input.id] ?? input.default;
  for (const output of outputs) {
    scope[output.id] = evaluateNumber(output.formula, scope as ExpressionScope);
  }
  return scope;
}

function toSlider(input: CalculatorInput, value: number): number {
  if (input.scale !== "log") return value;
  const min = Math.max(input.min ?? 1, 1e-9);
  const max = input.max ?? min * 10;
  return (Math.log(value / min) / Math.log(max / min)) * 1000;
}

function fromSlider(input: CalculatorInput, position: number): number {
  if (input.scale !== "log") return position;
  const min = Math.max(input.min ?? 1, 1e-9);
  const max = input.max ?? min * 10;
  const raw = min * (max / min) ** (position / 1000);
  // Round to two significant digits so log sliders land on readable numbers.
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(raw)) - 1);
  return Math.round(raw / magnitude) * magnitude;
}

function InputControl({
  input,
  value,
  onChange,
  locale,
}: {
  readonly input: CalculatorInput;
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly locale: Locale;
}): JSX.Element {
  const copy = COPY[locale];
  const id = `calc-${input.id}`;
  const display = `${formatLabValue(value, input.format, locale, input.decimals)}${input.unit ? ` ${input.unit}` : ""}`;

  if (input.type === "select" && input.options) {
    const segmented = input.options.length <= 4;
    return (
      <div>
        <p id={`${id}-label`} className="text-sm font-semibold text-foreground">
          {input.label}
        </p>
        {input.help ? <p className="mt-0.5 text-xs text-muted-foreground">{input.help}</p> : null}
        {segmented ? (
          <div role="radiogroup" aria-labelledby={`${id}-label`} className="mt-2 grid grid-cols-1 gap-1.5 sm:auto-cols-fr sm:grid-flow-col">
            {input.options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={value === option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  "min-h-11 rounded-xl border px-3 py-2 text-left text-sm leading-snug transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent sm:text-center",
                  value === option.value
                    ? "border-lab-accent bg-lab-accent text-paper shadow-lab-sm"
                    : "border-lab-line bg-paper text-foreground hover:border-lab-accent/50",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : (
          <select
            id={id}
            aria-labelledby={`${id}-label`}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="mt-2 min-h-11 w-full rounded-xl border border-lab-line bg-paper px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
          >
            {input.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  if (input.type === "toggle") {
    const on = value !== 0;
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p id={`${id}-label`} className="text-sm font-semibold text-foreground">
            {input.label}
          </p>
          {input.help ? <p className="mt-0.5 text-xs text-muted-foreground">{input.help}</p> : null}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby={`${id}-label`}
          onClick={() => onChange(on ? 0 : 1)}
          className={cn(
            "relative inline-flex min-h-11 min-w-[4.5rem] shrink-0 items-center rounded-full px-1 transition-[background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent",
            on ? "bg-lab-accent" : "bg-track",
          )}
        >
          <m.span
            aria-hidden="true"
            animate={{ x: on ? 28 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="h-8 w-8 rounded-full bg-paper shadow-lab-sm"
          />
          <span className="sr-only">{on ? copy.on : copy.off}</span>
        </button>
      </div>
    );
  }

  if (input.type === "number") {
    return (
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-foreground">
          {input.label}
        </label>
        {input.help ? <p className="mt-0.5 text-xs text-muted-foreground">{input.help}</p> : null}
        <div className="mt-2 flex items-center gap-2">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={input.min}
            max={input.max}
            step={input.step ?? 1}
            value={value}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              if (Number.isFinite(parsed)) onChange(parsed);
            }}
            className="min-h-11 w-full rounded-xl border border-lab-line bg-paper px-3 text-base tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
          />
          {input.unit ? <span className="shrink-0 text-sm text-muted-foreground">{input.unit}</span> : null}
        </div>
      </div>
    );
  }

  const isLog = input.scale === "log";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-foreground">
          {input.label}
        </label>
        <span className="shrink-0 text-sm font-bold tabular-nums text-lab-accent">{display}</span>
      </div>
      {input.help ? <p className="mt-0.5 text-xs text-muted-foreground">{input.help}</p> : null}
      <input
        id={id}
        type="range"
        min={isLog ? 0 : input.min ?? 0}
        max={isLog ? 1000 : input.max ?? 100}
        step={isLog ? 1 : input.step ?? 1}
        value={toSlider(input, value)}
        aria-valuetext={display}
        onChange={(event) => onChange(fromSlider(input, Number(event.target.value)))}
        className="mt-1 min-h-11 w-full cursor-pointer accent-lab-accent"
      />
    </div>
  );
}

export function CalculatorWidget({
  inputs,
  outputs,
  chart,
  verdicts = [],
  goals = [],
  note,
  lessonId,
  cpId,
  locale,
  title,
}: CalculatorProps): JSX.Element {
  const lang = labLocale(locale);
  const copy = COPY[lang];
  const { complete } = useLabCompletion({ lessonId, cpId });
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(inputs.map((input) => [input.id, input.default])),
  );
  const [changes, setChanges] = useState(0);
  const [metGoals, setMetGoals] = useState<ReadonlySet<string>>(() => new Set());
  const [lastMetGoal, setLastMetGoal] = useState<string | null>(null);
  const completed = useRef(false);

  const scope = useMemo(
    () => computeCalculatorScope(inputs, outputs, values),
    [inputs, outputs, values],
  );

  // Goals stay met once reached; completion fires once.
  useEffect(() => {
    if (changes === 0) return;
    const nowMet = goals.filter((goal) => evaluateCondition(goal.when, scope));
    const fresh = nowMet.filter((goal) => !metGoals.has(goal.id));
    if (fresh.length > 0) {
      setMetGoals((previous) => new Set([...previous, ...nowMet.map((goal) => goal.id)]));
      setLastMetGoal(fresh[fresh.length - 1].id);
    }
  }, [scope, goals, metGoals, changes]);

  useEffect(() => {
    if (completed.current) return;
    const done =
      goals.length > 0 ? goals.every((goal) => metGoals.has(goal.id)) : changes >= 3;
    if (done) {
      completed.current = true;
      complete();
    }
  }, [goals, metGoals, changes, complete]);

  const setValue = (id: string, value: number) => {
    setValues((previous) => (previous[id] === value ? previous : { ...previous, [id]: value }));
    setChanges((count) => count + 1);
  };

  const verdict = verdicts.find((entry) => evaluateCondition(entry.when, scope));
  const lastInsight = lastMetGoal
    ? goals.find((goal) => goal.id === lastMetGoal)?.insight
    : undefined;
  const headline = outputs.find((output) => output.emphasis) ?? outputs[0];
  const others = outputs.filter((output) => output !== headline);

  const barValues = chart?.bars.map((bar) => Math.max(0, evaluateNumber(bar.formula, scope))) ?? [];
  const barMax = Math.max(...barValues, 0);
  const barSum = barValues.reduce((sum, value) => sum + value, 0);

  return (
    <LabSurface label={copy.region} title={title}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="space-y-5 rounded-2xl bg-inset/50 p-4">
          <p className="text-label text-muted-foreground">{copy.inputs}</p>
          {inputs.map((input) => (
            <InputControl
              key={input.id}
              input={input}
              value={values[input.id] ?? input.default}
              onChange={(value) => setValue(input.id, value)}
              locale={lang}
            />
          ))}
        </div>

        <div className="min-w-0 space-y-4">
          {/* One concise announcement per change: the headline value, the
              verdict and the latest insight. The visual card below tweens
              and is not itself a live region. */}
          <LabLive className="sr-only">
            {changes > 0 && headline
              ? `${headline.label}: ${formatLabValue(scope[headline.id], headline.format, lang, headline.decimals)}.${verdict ? ` ${verdict.title}.` : ""}${lastInsight ? ` ${lastInsight}` : ""}`
              : null}
          </LabLive>
          <div>
            <div className="rounded-2xl border border-lab-line bg-card p-4 shadow-lab-sm">
              <p className="text-label text-muted-foreground">{headline?.label ?? copy.result}</p>
              {headline ? (
                <p className="mt-1 text-num-lg font-bold text-foreground">
                  <AnimatedNumber
                    value={scope[headline.id]}
                    format={(value) => formatLabValue(value, headline.format, lang, headline.decimals)}
                  />
                </p>
              ) : null}
              {headline?.help ? <p className="mt-1 text-xs text-muted-foreground">{headline.help}</p> : null}
              {others.length > 0 ? (
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {others.map((output) => (
                    <div key={output.id} className="rounded-xl bg-paper px-3 py-2">
                      <dt className="text-xs text-muted-foreground">{output.label}</dt>
                      <dd className="text-lg font-bold text-foreground">
                        <AnimatedNumber
                          value={scope[output.id]}
                          format={(value) => formatLabValue(value, output.format, lang, output.decimals)}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
            <>
              {verdict ? (
                <m.div
                  key={verdict.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn("mt-3 rounded-2xl border px-4 py-3", TONE_CARD[verdict.tone])}
                >
                  <p className="font-semibold">{verdict.title}</p>
                  {verdict.body ? <p className="mt-1 text-sm leading-relaxed">{verdict.body}</p> : null}
                </m.div>
              ) : null}
            </>
          </div>

          {chart ? (
            <figure className="rounded-2xl border border-lab-line bg-card p-4 shadow-lab-sm">
              {chart.title ? (
                <figcaption className="mb-3 text-sm font-semibold text-foreground">{chart.title}</figcaption>
              ) : null}
              {chart.kind === "stacked" ? (
                <div>
                  <div className="flex h-8 w-full overflow-hidden rounded-full bg-track" aria-hidden="true">
                    {chart.bars.map((bar, index) => (
                      <m.div
                        key={bar.label}
                        className={cn("h-full", TONE_BAR[bar.tone ?? "accent"])}
                        initial={false}
                        animate={{ width: `${barSum > 0 ? (barValues[index] / barSum) * 100 : 0}%` }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      />
                    ))}
                  </div>
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                    {chart.bars.map((bar, index) => (
                      <li key={bar.label} className="flex items-center gap-2 text-sm">
                        <span aria-hidden="true" className={cn("h-3 w-3 shrink-0 rounded-full", TONE_BAR[bar.tone ?? "accent"])} />
                        <span className="min-w-0 text-foreground">{bar.label}</span>
                        <span className="ml-auto font-semibold tabular-nums text-foreground">
                          {formatLabValue(barValues[index], chart.format, lang, chart.decimals)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {chart.bars.map((bar, index) => (
                    <li key={bar.label}>
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="min-w-0 text-foreground">{bar.label}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-foreground">
                          {formatLabValue(barValues[index], chart.format, lang, chart.decimals)}
                        </span>
                      </div>
                      <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-track" aria-hidden="true">
                        <m.div
                          className={cn("h-full rounded-full", TONE_BAR[bar.tone ?? "accent"])}
                          initial={false}
                          animate={{ width: `${barMax > 0 ? (barValues[index] / barMax) * 100 : 0}%` }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </figure>
          ) : null}

          {goals.length > 0 ? (
            <div className="rounded-2xl border border-lab-line bg-paper p-4">
              <p className="text-label text-muted-foreground">{copy.goals}</p>
              <ul className="mt-2 space-y-2">
                {goals.map((goal) => {
                  const met = metGoals.has(goal.id);
                  return (
                    <li key={goal.id} data-goal-id={goal.id} data-goal-met={met ? "1" : "0"} className="text-sm">
                      <p className="flex items-start gap-2">
                        <span aria-hidden="true" className={cn("mt-0.5", met ? "text-lab-good" : "text-muted-foreground")}>
                          {met ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                        </span>
                        <span className={cn("min-w-0", met ? "text-foreground" : "text-foreground")}>
                          {goal.label}
                          <span className="sr-only"> ({met ? copy.goalMet : copy.goalOpen})</span>
                        </span>
                      </p>
                      {met && goal.insight ? (
                        <m.p
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="ml-6 mt-1 rounded-xl bg-lab-good-soft px-3 py-2 text-foreground"
                        >
                          {goal.insight}
                        </m.p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{copy.explore}</p>
          )}
          {note ? <p className="text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
        </div>
      </div>
    </LabSurface>
  );
}
