/**
 * The model of demo 03: one series of months read two ways. A change (Stufe,
 * what moved in the month) or a level (Treppe, what stands at month end).
 * Both readings always exist: where the visitor gave no start, one is derived
 * (the first level becomes the start) or assumed (zero) and the stage says so.
 * Everything here is arithmetic on the numbers; nothing asks a model.
 */
import type { Locale } from "@/lib/i18n/locale";
import { ENDING_MRR, FOLDLINE, NET_NEW_MRR } from "./data";
import { countDecimals, formatMoney, formatNumber, MINUS } from "./format";

export type Reading = "change" | "level";
export type OpId = "sum" | "end" | "endMinusStart";
export type Verdict = "right" | "wrong" | "partial";
/**
 * Where the start level comes from: typed, the first typed level (that month then has
 * no known change, but it stays a bar and stays in every sum), or an assumed zero.
 */
export type StartNote = "given" | "first" | "zero";

export interface Frame {
  readonly lo: number;
  readonly hi: number;
}

export interface Series {
  readonly name: string;
  /** "EUR" for the example, "" for visitor numbers (unit unknown). */
  readonly unit: string;
  readonly table: string;
  readonly months: readonly string[];
  /** Decimals the visitor typed (0 to 2): every shown number carries them, nothing is rounded away. */
  readonly decimals: number;
  readonly changes: readonly number[];
  readonly levels: readonly number[];
  readonly startLevel: number;
  readonly startNote: StartNote;
  /** The change of the month before the first one (example only). */
  readonly startChange: number | null;
  /** The y-range of each reading; the lever slides the axis from one to the other. */
  readonly frames: { readonly change: Frame; readonly level: Frame };
  /** What the name should be defined as: the example's ending_mrr is a level. */
  readonly definesAs: Reading | "unclear";
  /** What the entered numbers are (the example's export holds changes). */
  readonly valuesKind: Reading | "unclear";
  readonly isExample: boolean;
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);
const last = (values: readonly number[]): number => values[values.length - 1] ?? 0;
const Q2 = ["2026-04", "2026-05", "2026-06"] as const;

/** The workshop's example; the three month labels come from the language pack. */
export const exampleSeries = (months: readonly string[]): Series => ({
  name: "ending_mrr",
  unit: "EUR",
  table: FOLDLINE.table,
  months,
  decimals: 0,
  changes: Q2.map((month) => NET_NEW_MRR[month]),
  levels: Q2.map((month) => ENDING_MRR[month]),
  startLevel: ENDING_MRR["2026-03"],
  startNote: "given",
  startChange: NET_NEW_MRR["2026-03"],
  frames: { change: { lo: -40_000, hi: 70_000 }, level: { lo: 300_000, hi: 400_000 } },
  definesAs: "level",
  valuesKind: "change",
  isExample: true,
});

export const FACTS = {
  sumChanges: sum(Q2.map((month) => NET_NEW_MRR[month])),
  sumLevels: sum(Q2.map((month) => ENDING_MRR[month])),
  recordedWrong: FOLDLINE.recordedChangeDiff,
} as const;

/** A y-range around the values, in steps of a 1/2/5 times a power of ten. */
export function frameFor(values: readonly number[], includeZero: boolean): Frame {
  const min = Math.min(...values, ...(includeZero ? [0] : []));
  const max = Math.max(...values, ...(includeZero ? [0] : []));
  const span = max - min || Math.abs(max) || 1;
  // Without zero in frame the floor sits well below the lowest value, so the smallest bar is
  // still a bar and not a sliver; the torn axis and the note say that zero is out of frame.
  const padLo = span * (includeZero ? 0.3 : 0.5);
  const padHi = span * (includeZero ? 0.3 : 0.1);
  const raw = (span + padLo + padHi) / 8;
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  const step = (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power;
  return { lo: Math.floor((min - padLo) / step) * step, hi: Math.ceil((max + padHi) / step) * step };
}

export interface SeriesInput {
  readonly values: readonly number[];
  readonly start: number | null;
  readonly kind: Reading | "unclear";
  readonly name: string;
  readonly table: string;
  readonly monthLabel: (index: number) => string;
}

/**
 * Both readings from what the visitor typed. Every typed number stays: one bar per
 * number and a part of every sum. Levels without a start: the first level is the
 * base of the staircase, and that month has no known change (it counts as 0 and
 * the stage marks it). Changes without a start: the start is assumed to be 0.
 */
export function buildSeries({ values, start, kind, name, table, monthLabel }: SeriesInput): Series {
  const isLevel = kind === "level";
  const first = isLevel && start === null;
  const from = start ?? (first ? (values[0] ?? 0) : 0);
  const levels = isLevel ? values : values.map((_, index) => from + sum(values.slice(0, index + 1)));
  const changes = isLevel ? values.map((value, index) => (first && index === 0 ? 0 : value - (index === 0 ? from : (values[index - 1] ?? 0)))) : values;
  const spread = (Math.max(...levels, from) - Math.min(...levels, from)) / Math.max(Math.abs(Math.max(...levels, from)), 1);
  return {
    name,
    unit: "",
    table,
    months: values.map((_, index) => monthLabel(index + 1)),
    decimals: Math.max(0, ...[...values, ...(start === null ? [] : [start])].map((value) => countDecimals(value))),
    changes,
    levels,
    startLevel: from,
    startNote: start !== null ? "given" : first ? "first" : "zero",
    startChange: null,
    // Levels near zero keep the zero line in frame; far from it the zero line may leave.
    frames: { change: frameFor(changes, true), level: frameFor([...levels, from], Math.min(...levels, from) <= 0 || spread > 0.6) },
    definesAs: kind,
    valuesKind: kind,
    isExample: false,
  };
}

/** The levels as typed: every one of them (kept for the callers that name the idea). */
export const typedLevels = (series: Series): readonly number[] => series.levels;

/** True where the first month's change is not known (levels typed without a start). */
export const firstChangeUnknown = (series: Series): boolean => series.startNote === "first";

export interface OperatorResult {
  readonly value: number;
  readonly verdict: Verdict;
  readonly note: "growth" | "lastChange" | "recordedDiff" | "sumLevels" | "lastLevel";
  /** True only for the AI answer recorded in the deck. */
  readonly recorded: boolean;
}

/** What one operator gives for one reading; null where the numbers do not allow it. */
export function operate(series: Series, reading: Reading, op: OpId): OperatorResult | null {
  const { changes, levels } = series;
  if (reading === "change") {
    if (op === "sum") return { value: sum(changes), verdict: "right", note: "growth", recorded: false };
    if (op === "end") return { value: last(changes), verdict: "partial", note: "lastChange", recorded: false };
    if (series.startChange === null) return null;
    return { value: last(changes) - series.startChange, verdict: "wrong", note: "recordedDiff", recorded: series.isExample };
  }
  if (op === "sum") return { value: sum(typedLevels(series)), verdict: "wrong", note: "sumLevels", recorded: false };
  if (op === "end") return { value: last(levels), verdict: "right", note: "lastLevel", recorded: false };
  return { value: last(levels) - series.startLevel, verdict: "right", note: "growth", recorded: false };
}

/** Treppentest: start + sum of changes - last level. */
export const staircase = (series: Series): number => series.startLevel + sum(series.changes) - last(series.levels);

/** All typed levels added, divided by the last level: how far off "adding levels" is. */
export const ratio = (series: Series): number => sum(typedLevels(series)) / (last(series.levels) || 1);

/** The number formatters of one series: every value is shown with the decimals the visitor typed. */
export function formatters(series: Series, locale: Locale) {
  return {
    num: (value: number) => formatNumber(value, locale, series.decimals),
    money: (value: number) => formatMoney(value, series.unit, locale, series.decimals),
  } as const;
}

export interface Arithmetic {
  readonly lhs: string;
  readonly result: string;
  readonly label: "growth" | "staircase" | "assumed" | "fromFirst";
}

function chain(values: readonly number[], num: (value: number) => string): string {
  return values
    .map((value, index) => (index === 0 ? num(value) : value < 0 ? `${MINUS} ${num(-value)}` : `+ ${num(value)}`))
    .join(" ");
}

/** The pinned arithmetic line: the changes added, or start plus growth equals end. */
export function arithmetic(series: Series, reading: Reading, locale: Locale): Arithmetic {
  const { num } = formatters(series, locale);
  if (reading === "change") return { lhs: chain(series.changes, num), result: num(sum(series.changes)), label: "growth" };
  return {
    lhs: chain([series.startLevel, last(series.levels) - series.startLevel], num),
    result: num(last(series.levels)),
    label: series.startNote === "zero" ? "assumed" : series.startNote === "first" ? "fromFirst" : "staircase",
  };
}

/** The two numbers the big counter holds: one per reading, never a value in between. */
export function headline(series: Series): { readonly change: number; readonly level: number; readonly first: boolean } {
  const first = series.isExample;
  return {
    change: first ? (series.changes[0] ?? 0) : sum(series.changes),
    level: first ? (series.levels[0] ?? 0) : last(series.levels),
    first,
  };
}

/** Whether the closing image (all levels added against the last one) can be drawn: real levels, not ones that rest on an assumed zero. */
export const canPair = (series: Series): boolean => series.startNote !== "zero" && series.levels.length >= 2 && last(series.levels) > 0 && series.levels.every((value) => value >= 0);
