"use client";

import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { m } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { evaluateCondition } from "@/lib/lesson-engine/expression";
import {
  AnimatedNumber,
  LabLive,
  LabSurface,
  formatLabValue,
  labLocale,
  useLabCompletion,
  type LabBaseProps,
} from "./_lab";

export interface ThresholdGroup {
  readonly id: string;
  readonly label: string;
  /** Share of truly positive cases in this group (0..1). */
  readonly baseRate: number;
  /** Synthetic people in this group (default 200). */
  readonly n?: number;
}

export interface ThresholdGoal {
  readonly id: string;
  readonly label: string;
  /**
   * Condition over metrics: t_a, t_b, fpr_a, fpr_b, fnr_a, fnr_b, ppv_a,
   * ppv_b, sel_a, sel_b (a = first group, b = second), split (0/1).
   */
  readonly when: string;
  readonly insight?: string;
}

export interface ThresholdLabProps extends LabBaseProps {
  readonly groups: readonly [ThresholdGroup, ThresholdGroup];
  /** Distance between the positive and negative score distributions in SDs. */
  readonly separation?: number;
  readonly initialThreshold?: number;
  /** Offer separate thresholds per group (default true). */
  readonly allowSplit?: boolean;
  readonly goals?: readonly ThresholdGoal[];
  readonly scoreLabel?: string;
  readonly positiveLabel?: string;
  readonly negativeLabel?: string;
  readonly note?: string;
}

export interface GroupMetrics {
  readonly fpr: number;
  readonly fnr: number;
  readonly ppv: number;
  readonly selection: number;
}

interface Person {
  readonly score: number;
  readonly positive: boolean;
}

/** Acklam's rational approximation of the inverse standard normal CDF. */
function inverseNormal(p: number): number {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const low = 0.02425;
  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - low) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * Deterministic synthetic population: scores are evenly spaced quantiles of
 * two normal distributions (positives and negatives), identical in every
 * group. Only the base rate differs, which is exactly the setting of the
 * Chouldechova (2017) / Kleinberg et al. (2016) impossibility result.
 */
export function generateThresholdPopulation(
  group: ThresholdGroup,
  separation = 1.6,
): readonly Person[] {
  const n = Math.max(20, Math.round(group.n ?? 200));
  const positives = Math.round(n * Math.min(1, Math.max(0, group.baseRate)));
  const sigma = 0.14;
  const muPositive = 0.5 + (separation * sigma) / 2;
  const muNegative = 0.5 - (separation * sigma) / 2;
  const people: Person[] = [];
  const quantile = (index: number, count: number, mu: number) =>
    Math.min(0.99, Math.max(0.01, mu + sigma * inverseNormal((index + 0.5) / count)));
  for (let i = 0; i < positives; i += 1) {
    people.push({ score: quantile(i, positives, muPositive), positive: true });
  }
  for (let i = 0; i < n - positives; i += 1) {
    people.push({ score: quantile(i, n - positives, muNegative), positive: false });
  }
  return people;
}

/** Error rates at a threshold (score >= threshold is flagged). */
export function groupMetrics(people: readonly Person[], threshold: number): GroupMetrics {
  let tp = 0;
  let fp = 0;
  let fn = 0;
  let tn = 0;
  for (const person of people) {
    const flagged = person.score >= threshold;
    if (person.positive && flagged) tp += 1;
    else if (person.positive) fn += 1;
    else if (flagged) fp += 1;
    else tn += 1;
  }
  return {
    fpr: fp + tn > 0 ? fp / (fp + tn) : Number.NaN,
    fnr: tp + fn > 0 ? fn / (tp + fn) : Number.NaN,
    ppv: tp + fp > 0 ? tp / (tp + fp) : Number.NaN,
    selection: people.length > 0 ? (tp + fp) / people.length : Number.NaN,
  };
}

const COPY = {
  de: {
    region: "Schwellenwert-Labor",
    threshold: "Schwelle",
    commonThreshold: "Gemeinsame Schwelle",
    split: "Getrennte Schwellen je Gruppe",
    metric: "Kennzahl",
    gap: "Abstand",
    fpr: "Falsch-Positiv-Rate",
    fprHelp: "Anteil der eigentlich Negativen, die markiert werden",
    fnr: "Falsch-Negativ-Rate",
    fnrHelp: "Anteil der eigentlich Positiven, die durchrutschen",
    ppv: "Trefferquote der Markierung (PPV)",
    ppvHelp: "Anteil der Markierten, die wirklich positiv sind",
    selection: "Markiert",
    selectionHelp: "Anteil der Gruppe über der Schwelle",
    positive: "tatsächlich positiv",
    negative: "tatsächlich negativ",
    flagged: "rechts der Linie: markiert",
    score: "Risikowert",
    goals: "Aufgaben",
    goalMet: "erledigt",
    goalOpen: "offen",
    synthetic: "Synthetische Daten. Beide Gruppen haben dieselbe Score-Verteilung je Klasse; nur der Anteil tatsächlich Positiver unterscheidet sich.",
  },
  en: {
    region: "Threshold lab",
    threshold: "Threshold",
    commonThreshold: "Shared threshold",
    split: "Separate thresholds per group",
    metric: "Metric",
    gap: "Gap",
    fpr: "False positive rate",
    fprHelp: "Share of true negatives that get flagged",
    fnr: "False negative rate",
    fnrHelp: "Share of true positives that slip through",
    ppv: "Precision of flags (PPV)",
    ppvHelp: "Share of flagged people who are truly positive",
    selection: "Flagged",
    selectionHelp: "Share of the group above the threshold",
    positive: "truly positive",
    negative: "truly negative",
    flagged: "right of the line: flagged",
    score: "Risk score",
    goals: "Tasks",
    goalMet: "done",
    goalOpen: "open",
    synthetic: "Synthetic data. Both groups share the same score distribution per class; only the share of true positives differs.",
  },
} as const;

const BINS = 40;
const DOT = 7;

function DotStrip({
  people,
  threshold,
  label,
  scoreLabel,
}: {
  readonly people: readonly Person[];
  readonly threshold: number;
  readonly label: string;
  readonly scoreLabel: string;
}): JSX.Element {
  const width = 400;
  const columns = useMemo(() => {
    const bins: Person[][] = Array.from({ length: BINS }, () => []);
    for (const person of people) {
      const index = Math.min(BINS - 1, Math.floor(person.score * BINS));
      bins[index].push(person);
    }
    // Negatives at the bottom of each column, positives on top.
    return bins.map((bin) => [...bin].sort((a, b) => Number(a.positive) - Number(b.positive)));
  }, [people]);
  const tallest = Math.max(1, ...columns.map((column) => column.length));
  const height = Math.max(60, tallest * DOT + 16);
  const x = threshold * width;
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1 text-sm font-semibold text-foreground">{label}</figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${label}: ${scoreLabel} 0 bis 1, Schwelle ${threshold.toFixed(2)}`}
      >
        <rect x={0} y={0} width={width} height={height - 12} rx={10} fill="var(--color-paper)" />
        <rect x={x} y={0} width={width - x} height={height - 12} fill="rgba(39, 71, 181, 0.07)" />
        {columns.map((column, columnIndex) =>
          column.map((person, row) => {
            const flagged = person.score >= threshold;
            const cx = (columnIndex + 0.5) * (width / BINS);
            const cy = height - 16 - row * DOT - DOT / 2;
            return (
              <circle
                key={`${columnIndex}-${row}`}
                cx={cx}
                cy={cy}
                r={DOT / 2 - 0.6}
                fill={person.positive ? "var(--color-lab-accent)" : "var(--color-paper)"}
                stroke={person.positive ? "var(--color-lab-accent)" : "var(--color-border)"}
                strokeWidth={1}
                opacity={flagged ? 1 : 0.4}
              />
            );
          }),
        )}
        <m.line
          initial={false}
          animate={{ x1: x, x2: x }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          y1={0}
          y2={height - 12}
          stroke="var(--color-mennige)"
          strokeWidth={2.5}
        />
        <text x={4} y={height - 1} fontSize={11} fill="var(--color-muted-foreground)">0</text>
        <text x={width - 10} y={height - 1} fontSize={11} fill="var(--color-muted-foreground)">1</text>
      </svg>
    </figure>
  );
}

export function ThresholdLabWidget({
  groups,
  separation = 1.6,
  initialThreshold = 0.5,
  allowSplit = true,
  goals = [],
  scoreLabel,
  positiveLabel,
  negativeLabel,
  note,
  lessonId,
  cpId,
  locale,
  title,
}: ThresholdLabProps): JSX.Element {
  const lang = labLocale(locale);
  const copy = COPY[lang];
  const { complete } = useLabCompletion({ lessonId, cpId });
  const [split, setSplit] = useState(false);
  const [thresholds, setThresholds] = useState<readonly [number, number]>([
    initialThreshold,
    initialThreshold,
  ]);
  const [changes, setChanges] = useState(0);
  const [metGoals, setMetGoals] = useState<ReadonlySet<string>>(() => new Set());
  const completed = useRef(false);

  const populations = useMemo(
    () => groups.map((group) => generateThresholdPopulation(group, separation)),
    [groups, separation],
  );
  const effective: readonly [number, number] = split ? thresholds : [thresholds[0], thresholds[0]];
  const metrics = populations.map((people, index) => groupMetrics(people, effective[index]));
  const scope = {
    t_a: effective[0],
    t_b: effective[1],
    split: split ? 1 : 0,
    fpr_a: metrics[0].fpr,
    fpr_b: metrics[1].fpr,
    fnr_a: metrics[0].fnr,
    fnr_b: metrics[1].fnr,
    ppv_a: metrics[0].ppv,
    ppv_b: metrics[1].ppv,
    sel_a: metrics[0].selection,
    sel_b: metrics[1].selection,
  };
  const scopeKey = JSON.stringify(scope);

  useEffect(() => {
    if (changes === 0) return;
    const parsed = JSON.parse(scopeKey) as Record<string, number>;
    const nowMet = goals.filter((goal) => evaluateCondition(goal.when, parsed));
    if (nowMet.some((goal) => !metGoals.has(goal.id))) {
      setMetGoals((previous) => new Set([...previous, ...nowMet.map((goal) => goal.id)]));
    }
  }, [scopeKey, goals, metGoals, changes]);

  useEffect(() => {
    if (completed.current) return;
    const done = goals.length > 0 ? goals.every((goal) => metGoals.has(goal.id)) : changes >= 5;
    if (done) {
      completed.current = true;
      complete();
    }
  }, [goals, metGoals, changes, complete]);

  const setThreshold = (index: 0 | 1, value: number) => {
    setThresholds((previous) =>
      split
        ? (index === 0 ? [value, previous[1]] : [previous[0], value])
        : [value, value],
    );
    setChanges((count) => count + 1);
  };

  const rows = [
    { key: "fpr", label: copy.fpr, help: copy.fprHelp, values: metrics.map((entry) => entry.fpr) },
    { key: "fnr", label: copy.fnr, help: copy.fnrHelp, values: metrics.map((entry) => entry.fnr) },
    { key: "ppv", label: copy.ppv, help: copy.ppvHelp, values: metrics.map((entry) => entry.ppv) },
    { key: "sel", label: copy.selection, help: copy.selectionHelp, values: metrics.map((entry) => entry.selection) },
  ];

  const slider = (index: 0 | 1, label: string) => (
    <div key={label}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={`threshold-${index}`} className="text-sm font-semibold text-foreground">
          {label}
        </label>
        <span className="text-sm font-bold tabular-nums text-lab-accent">{effective[index].toFixed(2)}</span>
      </div>
      <input
        id={`threshold-${index}`}
        type="range"
        min={0.05}
        max={0.95}
        step={0.01}
        value={effective[index]}
        onChange={(event) => setThreshold(index, Number(event.target.value))}
        className="min-h-11 w-full cursor-pointer accent-lab-accent"
      />
    </div>
  );

  return (
    <LabSurface label={copy.region} title={title}>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group, index) => (
          <DotStrip
            key={group.id}
            people={populations[index]}
            threshold={effective[index]}
            label={group.label}
            scoreLabel={scoreLabel ?? copy.score}
          />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-full bg-lab-accent" /> {positiveLabel ?? copy.positive}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-full border border-border bg-paper" /> {negativeLabel ?? copy.negative}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-0.5 bg-mennige" /> {copy.flagged}
        </li>
      </ul>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
        <div className="space-y-3 rounded-2xl bg-inset/50 p-4">
          {split
            ? groups.map((group, index) => slider(index as 0 | 1, `${copy.threshold}: ${group.label}`))
            : slider(0, copy.commonThreshold)}
          {allowSplit ? (
            <button
              type="button"
              role="switch"
              aria-checked={split}
              onClick={() => {
                const next = !split;
                setSplit(next);
                if (!next) setThresholds((previous) => [previous[0], previous[0]]);
                setChanges((count) => count + 1);
              }}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-1 text-left text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-accent"
            >
              {copy.split}
              <span
                aria-hidden="true"
                className={cn(
                  "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full px-0.5 transition-[background-color] duration-200",
                  split ? "bg-lab-accent" : "bg-track",
                )}
              >
                <m.span
                  animate={{ x: split ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="h-6 w-6 rounded-full bg-paper shadow-lab-sm"
                />
              </span>
            </button>
          ) : null}
        </div>

        <LabLive className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[22rem] border-separate border-spacing-y-1 text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className="pb-1 font-semibold">{copy.metric}</th>
                {groups.map((group) => (
                  <th key={group.id} scope="col" className="pb-1 text-right font-semibold">{group.label}</th>
                ))}
                <th scope="col" className="pb-1 text-right font-semibold">{copy.gap}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const gap = Math.abs(row.values[0] - row.values[1]);
                return (
                  <tr key={row.key} data-metric={row.key} className="bg-card">
                    <th scope="row" className="rounded-l-xl px-3 py-2 text-left font-semibold text-foreground">
                      {row.label}
                      <span className="block text-xs font-normal text-muted-foreground">{row.help}</span>
                    </th>
                    {row.values.map((value, index) => (
                      <td key={index} className="px-2 py-2 text-right font-bold text-foreground">
                        <AnimatedNumber value={value} format={(entry) => formatLabValue(entry, "percent", lang, 0)} />
                      </td>
                    ))}
                    <td className="rounded-r-xl px-3 py-2 text-right">
                      <span
                        className={cn(
                          "inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-bold tabular-nums",
                          !Number.isFinite(gap) ? "bg-inset text-muted-foreground" : gap < 0.03 ? "bg-lab-good-soft text-lab-good" : gap < 0.1 ? "bg-lab-warn-soft text-lab-warn" : "bg-lab-bad-soft text-lab-bad",
                        )}
                      >
                        {formatLabValue(gap * 100, "number", lang, 0)} pp
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </LabLive>
      </div>

      {goals.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-lab-line bg-paper p-4">
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
                    <span className="min-w-0 text-foreground">
                      {goal.label}
                      <span className="sr-only"> ({met ? copy.goalMet : copy.goalOpen})</span>
                    </span>
                  </p>
                  {met && goal.insight ? (
                    <m.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="ml-6 mt-1 rounded-xl bg-lab-good-soft px-3 py-2 text-foreground">
                      {goal.insight}
                    </m.p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{note ?? copy.synthetic}</p>
    </LabSurface>
  );
}
