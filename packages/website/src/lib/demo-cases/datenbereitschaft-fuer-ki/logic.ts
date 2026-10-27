/**
 * The pure functions of "Die Fragekarte". Every number the stage prints comes
 * out of one of these, applied to the kit values in data.ts. No clock, no
 * randomness, no I/O: tests pin each against the kit.
 */
import { EXPORT_ROWS, SUMMARY, type ExportRow, type SummaryRow } from "./data";

/** Sum of the export rows per month, in file order: "YYYY-MM-DD" to the month total. */
export function monthlyTotals(rows: readonly ExportRow[] = EXPORT_ROWS): ReadonlyMap<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.dt, (totals.get(row.dt) ?? 0) + row.amount);
  return totals;
}

/** The four readings of one correct file, for the last three months of `changes`. */
export interface Readings {
  /** 1. A change read as a level: the month's change, called Ending MRR (AP-M01). */
  readonly changeAsLevel: readonly number[];
  /** 2. Changes summed from January, with no opening level (AP-M04): Claude's recorded answer. */
  readonly runningNoOpen: readonly number[];
  /** 3. The three right levels added into one number (AP-M02). */
  readonly levelsSummed: number;
  /** 4. Opening level plus the changes: the right levels. */
  readonly levels: readonly number[];
}

/** `changes` are the monthly changes from the first month after the opening level. */
export function readings(changes: readonly number[], opening: number, months = 3): Readings {
  const running: number[] = [];
  let sum = 0;
  for (const change of changes) {
    sum += change;
    running.push(sum);
  }
  const runningNoOpen = running.slice(-months);
  const levels = runningNoOpen.map((value) => value + opening);
  return {
    changeAsLevel: changes.slice(-months),
    runningNoOpen,
    levelsSummed: levels.reduce((total, value) => total + value, 0),
    levels,
  };
}

/** Stand, Veränderung, Quote. */
export type Kind = "level" | "change" | "rate";
export const KINDS: readonly Kind[] = ["level", "change", "rate"];
/** Across groups (segments, stores), across months, or one number for a quarter. */
export type Across = "groups" | "months" | "quarter";
export const ACROSS: readonly Across[] = ["groups", "months", "quarter"];
export type AddRule = "add" | "never" | "recompute" | "each-or-last" | "sum";

/** The "Darf ich addieren?" grid of the question card (builder/CHEATSHEET.md, "Adding up: when it is allowed"). */
export function canAdd(kind: Kind, across: Across): AddRule {
  if (kind === "rate") return "recompute";
  if (across === "groups") return "add";
  if (kind === "level") return across === "months" ? "never" : "each-or-last";
  return across === "months" ? "add" : "sum";
}

export type WhoFilter = "active" | "A" | "AC" | "AN";

/** Which status codes a filter keeps. 'active' is a word the column never stores. */
export const WHO_CODES: Readonly<Record<WhoFilter, readonly string[]>> = {
  active: ["active"],
  A: ["A"],
  AC: ["A", "C"],
  AN: ["A", "N"],
};

/** Accounts a filter matches in the status column, and of how many. */
export function countWho(filter: WhoFilter, statuses: string): { readonly matched: number; readonly of: number } {
  const codes = WHO_CODES[filter];
  let matched = 0;
  for (const code of statuses) if (codes.includes(code)) matched += 1;
  return { matched, of: statuses.length };
}

/** True when the status code at `index` counts under `filter`. */
export function counts(filter: WhoFilter, code: string): boolean {
  return WHO_CODES[filter].includes(code);
}

export type Grade =
  | { readonly pass: true }
  | { readonly pass: false; readonly reason: "length"; readonly got: number; readonly want: number }
  | { readonly pass: false; readonly reason: "value"; readonly index: number; readonly got: number; readonly want: number };

/** Exact integers, same length, same order. A test compares values, not the way they were reached. */
export function gradeValue(actual: readonly number[], expected: readonly number[]): Grade {
  if (actual.length !== expected.length) return { pass: false, reason: "length", got: actual.length, want: expected.length };
  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) {
      return { pass: false, reason: "value", index, got: actual[index] as number, want: expected[index] as number };
    }
  }
  return { pass: true };
}

/** Status codes a set of rules counts, and how many of the accounts match (scene 4, three sentences). */
export function countCodes(codes: ReadonlySet<string>, statuses: string): number {
  let matched = 0;
  for (const code of statuses) if (codes.has(code)) matched += 1;
  return matched;
}

/** The water at each month end for an opening level: opening plus the changes so far. */
export function tubLevels(changes: readonly number[], opening: number): readonly number[] {
  const levels: number[] = [];
  let level = opening;
  for (const change of changes) {
    level += change;
    levels.push(level);
  }
  return levels;
}

/** "2025-03" to "2025-02". */
export function previousMonth(month: string): string {
  const [year, mon] = month.split("-").map(Number) as [number, number];
  return mon === 1 ? `${year - 1}-12` : `${year}-${String(mon - 1).padStart(2, "0")}`;
}

/**
 * The level at the end of December 2025 when the file starts in `start`
 * ("2025-01" to "2026-01"): the sum of the approved view's changes from
 * `start` through December 2025. A start in January 2026 knows none of them.
 */
export function openingFromStart(start: string, summary: readonly SummaryRow[] = SUMMARY): number {
  return summary.filter((row) => row.month >= start && row.month <= "2025-12").reduce((sum, row) => sum + row.netNew, 0);
}

/** The thirteen positions of the file's left edge, January 2026 back to January 2025. */
export const EDGE_STARTS: readonly string[] = [
  "2026-01",
  "2025-12",
  "2025-11",
  "2025-10",
  "2025-09",
  "2025-08",
  "2025-07",
  "2025-06",
  "2025-05",
  "2025-04",
  "2025-03",
  "2025-02",
  "2025-01",
];

/** The 2025 months a start uncovers, oldest first, with their change. */
export function uncovered(start: string, summary: readonly SummaryRow[] = SUMMARY): readonly SummaryRow[] {
  return summary.filter((row) => row.month >= start && row.month <= "2025-12");
}

/** The sum of the values at some positions (scene 4: columns or arrows poured together). */
export function sumAt(values: readonly number[], indices: readonly number[]): number {
  return indices.reduce((sum, index) => sum + (values[index] ?? 0), 0);
}
