import { round } from "./numbers";
import type { Analysis, LadderRow, MonthCell, Series, Status } from "./types";

export const GLYPHS = { proven: "■", estimate: "▨", missing: "□" } as const;
export const ASCII = { proven: "X", estimate: "~", missing: "_" } as const;

/** One character per month, January first. */
export function stripOf(cells: readonly MonthCell[], ascii = false): string {
  const set = ascii ? ASCII : GLYPHS;
  return cells.map((cell) => set[cell.state]).join("");
}

export function statusOf(missing: number, estimates: number): Status {
  if (missing > 0) return "NOT_FOUND";
  if (estimates > 0) return "NEEDS_CHECK";
  return "OK";
}

/** Counts, sums and the shortcuts a careless reader would take. Estimates never enter a sum. */
export function analyse(series: Pick<Series, "cells">): Analysis {
  const proven = series.cells.filter((cell) => cell.state === "proven" && cell.value !== null);
  const values = proven.map((cell) => cell.value as number);
  const missingMonths = series.cells.filter((cell) => cell.state === "missing").map((cell) => cell.month);
  const estimatedMonths = series.cells.filter((cell) => cell.state === "estimate").map((cell) => cell.month);
  const provenSum = round(values.reduce((sum, value) => sum + value, 0));
  const max = values.length > 0 ? Math.max(...values) : null;
  const min = values.length > 0 ? Math.min(...values) : null;
  return {
    provenMonths: proven.length,
    estimateMonths: estimatedMonths.length,
    missingMonths,
    estimatedMonths,
    provenSum,
    monthCoverage: proven.length / 12,
    avgTimes12: proven.length > 0 ? round((provenSum / proven.length) * 12) : null,
    maxFill: max === null ? null : round(provenSum + max * missingMonths.length),
    band: min !== null && max !== null ? { min, max } : null,
    status: statusOf(missingMonths.length, estimatedMonths.length),
  };
}

/** Share of the quantity that is proven, once the true total is known. */
export function valueCoverage(provenSum: number, truthTotal: number): number {
  return truthTotal > 0 ? provenSum / truthTotal : 0;
}

/**
 * The most the missing months may add together while `threshold` of the
 * quantity is still proven: provenSum * (1 / threshold - 1).
 */
export function maxMissingFor(provenSum: number, threshold: number): number {
  return threshold > 0 ? provenSum * (1 / threshold - 1) : 0;
}

/** Share of the year the draft was short, 0..1. */
export function shortfall(provenSum: number, truthTotal: number): number {
  return truthTotal > 0 ? (truthTotal - provenSum) / truthTotal : 0;
}

/**
 * The rows of the ladder: the visitor's guess first (their own number is the
 * point of reference), then the shortcuts ascending, the bill last. The guess
 * row exists only with a guess.
 */
export function ladder(analysis: Analysis, truthTotal: number, guess: number | null): readonly LadderRow[] {
  const shortcuts: LadderRow[] = [{ id: "draft", value: analysis.provenSum }];
  if (analysis.avgTimes12 !== null) shortcuts.push({ id: "average", value: analysis.avgTimes12 });
  if (analysis.maxFill !== null) shortcuts.push({ id: "maxFill", value: analysis.maxFill });
  const sorted = shortcuts.slice().sort((a, b) => a.value - b.value);
  const mine: LadderRow[] = guess !== null && guess > 0 ? [{ id: "guess", value: round(analysis.provenSum + guess) }] : [];
  return [...mine, ...sorted, { id: "bill", value: round(truthTotal) }];
}

/** The distance between the guess and the bill, as a fact. */
export function guessOffBy(guess: number, truth: number): number {
  return round(Math.abs(truth - guess));
}
