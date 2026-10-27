/**
 * The timed runs of 26.10.2026 (the deck's slide "Mit Claude gemessen"):
 * Claude Code 2.1.310 headless, model claude-sonnet-5-5, the five prompts of
 * the kit's start file over a fresh copy of each edition, steps 1 to 4 each a
 * new session and step 5 resumed in the session of step 4. Three runs per
 * edition; the seconds are wall clock around each `claude -p` call, copied
 * from the measurement's RESULTS.md. "before" and "after" count how many of
 * the 21 statuses matched the kit's solutions before and after the late
 * invoice. Two runs ran at the same time (one per edition), so the wall
 * clock includes some contention. Nobody worked the 21 answers by hand with
 * a stopwatch, so there is no time by hand.
 *
 * The demo shows the median run of each edition (de-3 and en-2); its five
 * recordings were imported from that run (claude-app/), and claude-app.test.ts
 * checks that their wall-clock seconds are the ones below.
 */
import type { RowId } from "./ledger";
import type { Status } from "./rules";

export interface MeasuredRun {
  readonly run: number;
  /** Wall-clock seconds of steps 1 to 5. */
  readonly steps: readonly [number, number, number, number, number];
  readonly totalS: number;
  readonly before: number;
  readonly after: number;
  /** Seconds until the first output named the missing September 2025 bill. */
  readonly septemberS: number;
}

export interface Mismatch {
  readonly run: number;
  readonly step: 1 | 2 | 3;
  readonly row: RowId;
  readonly claude: Status;
  readonly solution: Status;
}

export const MEASURED = {
  date: "2026-10-26",
  claudeCode: "2.1.310",
  model: "claude-sonnet-5-5",
  answers: 21,
  runs: {
    de: [
      { run: 1, steps: [72.8, 72.1, 70.5, 266.9, 95.7], totalS: 578.0, before: 21, after: 21, septemberS: 72.0 },
      { run: 2, steps: [63.6, 62.3, 58.3, 254.2, 68.8], totalS: 507.2, before: 21, after: 21, septemberS: 62.5 },
      { run: 3, steps: [67.6, 54.0, 46.4, 266.4, 78.1], totalS: 512.5, before: 21, after: 21, septemberS: 66.9 },
    ],
    en: [
      { run: 1, steps: [56.4, 42.1, 61.1, 312.2, 75.6], totalS: 547.4, before: 21, after: 21, septemberS: 55.3 },
      { run: 2, steps: [53.2, 54.1, 55.6, 253.8, 53.4], totalS: 470.1, before: 20, after: 21, septemberS: 51.9 },
      { run: 3, steps: [47.1, 40.7, 61.4, 249.9, 70.4], totalS: 469.5, before: 21, after: 21, septemberS: 46.7 },
    ],
  } satisfies Record<"de" | "en", readonly MeasuredRun[]>,
  /** Every status of the shown runs that differs from the solutions (RESULTS.md, "Mismatches"). */
  mismatches: {
    de: [] as readonly Mismatch[],
    en: [{ run: 2, step: 1, row: "Q6", claude: "luecke", solution: "belegt" }] as readonly Mismatch[],
  },
} as const;

export type Edition = keyof typeof MEASURED.runs;

/** The median of an odd number of values. */
export function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] as number;
}

/** The run whose total is the median: the run the demo shows. */
export function medianRun(edition: Edition): MeasuredRun {
  const runs: readonly MeasuredRun[] = MEASURED.runs[edition];
  const middle = median(runs.map((run) => run.totalS));
  return runs.find((run) => run.totalS === middle) as MeasuredRun;
}

export interface MeasuredSummary {
  readonly medianS: number;
  readonly minS: number;
  readonly maxS: number;
  readonly septemberMedianS: number;
  /** Runs with all 21 statuses as in the solutions, before and after the invoice. */
  readonly allRight: number;
  readonly runs: number;
}

export function summary(edition: Edition): MeasuredSummary {
  const runs: readonly MeasuredRun[] = MEASURED.runs[edition];
  const totals = runs.map((run) => run.totalS);
  return {
    medianS: median(totals),
    minS: Math.min(...totals),
    maxS: Math.max(...totals),
    septemberMedianS: median(runs.map((run) => run.septemberS)),
    allRight: runs.filter((run) => run.before === MEASURED.answers && run.after === MEASURED.answers).length,
    runs: runs.length,
  };
}

/** Rounds half to even, as the measurement's Python did (512.5 to 512, 469.5 to 470). */
export function roundHalfEven(value: number): number {
  const floor = Math.floor(value);
  const rest = value - floor;
  if (Math.abs(rest - 0.5) > 1e-9) return Math.round(value);
  return floor % 2 === 0 ? floor : floor + 1;
}

/** 512.5 s to minutes and whole seconds, as the deck prints it: { min: 8, s: 32 }. */
export function minutesSeconds(seconds: number): { readonly min: number; readonly s: number } {
  const whole = roundHalfEven(seconds);
  return { min: Math.floor(whole / 60), s: whole % 60 };
}
