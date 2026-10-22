/**
 * Pure motion frames: each figure is frame(p) for p in [0, 1], deterministic
 * and DOM-free. A hook only chooses p over time; reduced motion, print and
 * the server render the end state of the current choice.
 */

import { MONTHS } from "./data";
import type { DefectId } from "./logic";
import { defectValue, linesWithNcr } from "./logic";
import type { LineId } from "./data";

export const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Cubic in-out. */
export const ease = (t: number): number => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/* ------------------------------------------------------------------ */
/* M1 · the week strip                                                 */
/* ------------------------------------------------------------------ */

export const STRIP = {
  width: 600,
  height: 360,
  baseline: 300,
  /** Tallest stack (September) in frame units. */
  maxStack: 250,
  stackGap: 4,
  stackWidth: 150,
  stackX: [96, 354] as const,
  columnWidth: 48,
  columnGap: 10,
  groupGap: 28,
} as const;

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface Seg extends Rect {
  /** 0 = August, 1 = September. */
  readonly month: 0 | 1;
  readonly index: number;
  readonly hatched: boolean;
}

interface WeekSource {
  readonly month: 0 | 1;
  readonly within: number;
  readonly units: number;
}

const WEEKS: readonly WeekSource[] = [
  ...MONTHS["2023-08"].weeklyUnits.map((units, within) => ({ month: 0 as const, within, units })),
  ...MONTHS["2023-09"].weeklyUnits.map((units, within) => ({ month: 1 as const, within, units })),
];

export const WEEK_COUNT = WEEKS.length;

const SCALE =
  STRIP.maxStack / MONTHS["2023-09"].weeklyUnits.reduce((sum, units) => sum + units, 0);

/** Frame units per shipped unit: one scale for stacks and columns. */
export const STRIP_SCALE = SCALE;

function heightOf(week: WeekSource): number {
  return week.units * SCALE;
}

/** p = 0: two monthly stacks standing on the baseline, August left. */
function stacked(index: number): Rect {
  const week = WEEKS[index];
  const below = WEEKS.filter((other) => other.month === week.month && other.within < week.within);
  const offset = below.reduce((sum, other) => sum + heightOf(other) + STRIP.stackGap, 0);
  const h = heightOf(week);
  return { x: STRIP.stackX[week.month], y: STRIP.baseline - offset - h, w: STRIP.stackWidth, h };
}

const COLUMNS_WIDTH =
  WEEK_COUNT * STRIP.columnWidth + (WEEK_COUNT - 2) * STRIP.columnGap + STRIP.groupGap;
const COLUMNS_X = (STRIP.width - COLUMNS_WIDTH) / 2;

/** p = 1: nine weekly columns on one baseline, a wider gap between the months. */
function column(index: number): Rect {
  const week = WEEKS[index];
  const gaps = index - (week.month === 1 ? 1 : 0);
  const x =
    COLUMNS_X +
    index * STRIP.columnWidth +
    gaps * STRIP.columnGap +
    (week.month === 1 ? STRIP.groupGap : 0);
  const h = heightOf(week);
  return { x, y: STRIP.baseline - h, w: STRIP.columnWidth, h };
}

const STACKS = WEEKS.map((_, index) => stacked(index));
const COLUMNS = WEEKS.map((_, index) => column(index));

/** The rects at both ends, for tests and for the server render. */
export const STRIP_ENDS = { stacks: STACKS, columns: COLUMNS } as const;

const STAGGER = 0.04;

/** Local progress of segment i: staggered from p, not from timers. */
export function segmentProgress(p: number, index: number): number {
  return ease(clamp01((clamp01(p) - index * STAGGER) / (1 - (WEEK_COUNT - 1) * STAGGER)));
}

export function weekStripFrame(p: number): readonly Seg[] {
  return WEEKS.map((week, index) => {
    const local = segmentProgress(p, index);
    const a = STACKS[index];
    const b = COLUMNS[index];
    return {
      month: week.month,
      index,
      x: lerp(a.x, b.x, local),
      y: lerp(a.y, b.y, local),
      w: lerp(a.w, b.w, local),
      h: a.h,
      hatched: index === WEEK_COUNT - 1 && local === 1,
    };
  });
}

export interface StripLabels {
  /** Centre x of the "August" / "September" labels under the baseline. */
  readonly monthX: readonly [number, number];
  /** Opacity of the monthly totals above the stacks (p = 0 view). */
  readonly totals: number;
  /** Top y of each stack, for the totals. */
  readonly totalsY: readonly [number, number];
  /** Opacity of the weekly averages and the "ab 30.09." label (p = 1 view). */
  readonly weekly: number;
  /** Centre x of the last column, for "ab 30.09.". */
  readonly lastX: number;
  readonly lastY: number;
}

function centre(rects: readonly Rect[]): number {
  const left = Math.min(...rects.map((rect) => rect.x));
  const right = Math.max(...rects.map((rect) => rect.x + rect.w));
  return (left + right) / 2;
}

export function stripLabels(p: number): StripLabels {
  const t = ease(clamp01(p));
  const aug = (rects: readonly Rect[]) => rects.filter((_, index) => WEEKS[index].month === 0);
  const sep = (rects: readonly Rect[]) => rects.filter((_, index) => WEEKS[index].month === 1);
  const top = (rects: readonly Rect[]) => Math.min(...rects.map((rect) => rect.y));
  return {
    monthX: [
      lerp(centre(aug(STACKS)), centre(aug(COLUMNS)), t),
      lerp(centre(sep(STACKS)), centre(sep(COLUMNS)), t),
    ],
    totals: clamp01(1 - p * 3),
    totalsY: [top(aug(STACKS)), top(sep(STACKS))],
    weekly: clamp01((p - 0.7) / 0.3),
    lastX: COLUMNS[WEEK_COUNT - 1].x + STRIP.columnWidth / 2,
    lastY: COLUMNS[WEEK_COUNT - 1].y,
  };
}

/* ------------------------------------------------------------------ */
/* M2 · the rate ladder                                                */
/* ------------------------------------------------------------------ */

/** Upper end of each scale: counts 0 to 25, rates 0 to 3 per 1.000. */
export const LADDER_MAX: Record<Exclude<DefectId, "returns">, number> = { count: 25, per1000: 3 };

export interface LadderDot {
  readonly line: LineId;
  /** Position on the track, 0 to 1. */
  readonly x: number;
  /** 0 = on the scale, 1 = in the "nicht in den Daten" lane. */
  readonly drop: number;
}

function ladderEnd(id: DefectId, line: LineId): { x: number; drop: number } {
  if (id === "returns") return { x: 1, drop: 1 };
  const value = defectValue(id, line) ?? 0;
  return { x: clamp01(value / LADDER_MAX[id]), drop: 0 };
}

export function ladderFrame(p: number, from: DefectId, to: DefectId): readonly LadderDot[] {
  const t = ease(clamp01(p));
  return linesWithNcr().map((line) => {
    const a = ladderEnd(from, line);
    const b = ladderEnd(to, line);
    return { line, x: lerp(a.x, b.x, t), drop: lerp(a.drop, b.drop, t) };
  });
}

/** Tick values of a scale. */
export function ladderTicks(id: DefectId): readonly number[] {
  if (id === "count") return [0, 5, 10, 15, 20, 25];
  if (id === "per1000") return [0, 1, 2, 3];
  return [];
}

/* ------------------------------------------------------------------ */
/* M3 · the claim thread                                               */
/* ------------------------------------------------------------------ */

export interface ThreadFrame {
  /** Undrawn share of the dotted thread: 1 = nothing drawn, 0 = complete. */
  readonly dash: number;
  /** The ring at the thread's end, 0 to 1. */
  readonly ring: number;
  /** The source rows and value, 0 to 1. */
  readonly rows: number;
}

export function threadFrame(p: number): ThreadFrame {
  const q = clamp01(p);
  const after = clamp01((q - 0.75) / 0.25);
  return { dash: 1 - ease(clamp01(q / 0.75)), ring: after, rows: after };
}
