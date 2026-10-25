/**
 * The stage geometry of every beat as plain functions of progress: where each
 * of the 23 NCR rows sits on its rail, how the nine CRAFT weeks stack or
 * collapse, where each of the 95 revenue rows flies. No DOM, no clock; the
 * components only map these numbers to SVG transforms.
 */
import { CRAFT_NCR_SEP, CRAFT_SEP_ROWS, CRAFT_WEEKS, type ModelCode } from "./data";
import { mergeRecords, rate, unitsShipped, weeksOf, type Basis, type Counter, type Month } from "./definitions";

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const lerp = (from: number, to: number, share: number) => from + (to - from) * share;
/** Progress of a window [start, end] inside a clock running 0 to 1. */
export const span = (t: number, start: number, end: number) => clamp01((t - start) / (end - start));
/** The site's soft ease (cubic in and out). */
export const ease = (share: number) => {
  const x = clamp01(share);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
/** Item i of n starts later the higher i is; each item runs `each` of the window. */
export function stagger(t: number, index: number, count: number, start: number, end: number, each: number): number {
  const lead = count > 1 ? ((end - start - each) * index) / (count - 1) : 0;
  return clamp01((t - start - lead) / each);
}

// ── Rails (beats 2 and 3) ─────────────────────────────────────────────────

/** Track width in viewBox units; the stage SVG is RAIL_VIEW wide. */
export const RAIL_VIEW = { width: 340, height: 196 } as const;
export const RAIL_X = 8;
export const RAIL_W = 324;
/** The top of each rail's track inside the rail SVG. */
export const RAIL_Y: Readonly<Record<Counter, number>> = { records: 22, affected: 88, scrapped: 154 };
export const RAIL_H = 18;

/** Each rail's own scale: 1.25 times the larger of August and September. */
export function railMax(counter: Counter): number {
  return Math.max(rate(counter, "aug"), rate(counter, "sep")) * 1.25;
}

export const railX = (counter: Counter, value: number) => RAIL_X + (value / railMax(counter)) * RAIL_W;

export interface RailItem {
  /** Index of the NCR row in CRAFT_NCR_SEP. */
  readonly row: number;
  readonly x: number;
  readonly w: number;
  /** Stack level above the track (merged records only). */
  readonly level: number;
  readonly filled: boolean;
  /** Not counted on this rail (rework on the scrap rail). */
  readonly ghost: boolean;
}

const perThousand = 1000 / unitsShipped("sep");

/** Where each September row lies on a rail. Records: one equal slot each; units: width by qty. */
export function railItems(counter: Counter, merged = false): readonly RailItem[] {
  const scale = RAIL_W / railMax(counter);
  if (counter === "records") {
    const slot = perThousand * scale;
    if (!merged) {
      return CRAFT_NCR_SEP.map((row, index) => ({
        row: index,
        x: RAIL_X + index * slot,
        w: slot * 0.72,
        level: 0,
        filled: row.scrap,
        ghost: false,
      }));
    }
    const groups = mergeRecords(CRAFT_NCR_SEP);
    const items: RailItem[] = [];
    groups.forEach((group, column) => {
      group.rows.forEach((member, level) => {
        items.push({
          row: CRAFT_NCR_SEP.indexOf(member),
          x: RAIL_X + column * slot,
          w: slot * 0.72,
          level,
          filled: member.scrap,
          ghost: false,
        });
      });
    });
    return items.sort((a, b) => a.row - b.row);
  }
  const order = counter === "scrapped"
    ? [...CRAFT_NCR_SEP.keys()].sort((a, b) => Number(CRAFT_NCR_SEP[b]?.scrap) - Number(CRAFT_NCR_SEP[a]?.scrap) || a - b)
    : [...CRAFT_NCR_SEP.keys()];
  let cursor = RAIL_X;
  const placed = new Map<number, RailItem>();
  for (const index of order) {
    const row = CRAFT_NCR_SEP[index];
    if (!row) continue;
    // A row this rail does not count (rework on the scrap rail) lands with no width where the counted marks end.
    const ghost = counter === "scrapped" && !row.scrap;
    const w = ghost ? 0 : row.qty * perThousand * scale;
    placed.set(index, { row: index, x: cursor, w, level: 0, filled: row.scrap, ghost });
    cursor += w;
  }
  return CRAFT_NCR_SEP.map((_, index) => placed.get(index) as RailItem);
}

/** Where the rows wait before the reveal: 23 equal ticks along the file line. */
export function sourceX(row: number): number {
  return RAIL_X + (row * RAIL_W) / CRAFT_NCR_SEP.length;
}

/** Reveal timing, all on the beat's 0..1 clock. */
export const REVEAL = {
  fly: [0.12, 0.62, 0.24] as const,
  count: [0.58, 0.8] as const,
  tick: [0.76, 0.86] as const,
  verdict: 0.86,
  frame: 0.92,
} as const;

/** Flight share of row i on the reveal clock. */
export const flight = (t: number, row: number) =>
  ease(stagger(t, row, CRAFT_NCR_SEP.length, REVEAL.fly[0], REVEAL.fly[1], REVEAL.fly[2]));

// ── Weeks (beat 4) ────────────────────────────────────────────────────────

export const WEEK_VIEW = { width: 340, height: 196 } as const;
const BASE_Y = 168;
const CHART_H = 132;
const WEEK_MAX = Math.max(...CRAFT_WEEKS.map((week) => week.units)) * 1.12;

export interface Block {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

const monthOfWeek = (index: number): Month => ((CRAFT_WEEKS[index]?.start ?? "") < "2023-09-01" ? "aug" : "sep");

/** The nine weeks side by side, heights to one scale. */
function asWeeks(index: number): Block {
  const week = CRAFT_WEEKS[index];
  const units = week?.units ?? 0;
  const gapAfterAug = monthOfWeek(index) === "sep" ? 22 : 0;
  const w = 28;
  const x = 14 + index * (w + 6) + gapAfterAug;
  const h = (units / WEEK_MAX) * CHART_H;
  return { x, y: BASE_Y - h, w, h };
}

/** Column x of a month when the weeks gather (both month total and per week). */
export const MONTH_X: Readonly<Record<Month, number>> = { aug: 64, sep: 214 };
const MONTH_W = 64;
const TOTAL_MAX = unitsShipped("sep") * 1.08;

/** Month total: the weeks stack into one column, to the month scale. */
function asMonth(index: number): Block {
  const month = monthOfWeek(index);
  const weeks = weeksOf(month);
  const position = weeks.findIndex((week) => week.start === CRAFT_WEEKS[index]?.start);
  const below = weeks.slice(0, position).reduce((sum, week) => sum + week.units, 0);
  const units = weeks[position]?.units ?? 0;
  const h = (units / TOTAL_MAX) * CHART_H;
  const y = BASE_Y - (below / TOTAL_MAX) * CHART_H - h;
  return { x: MONTH_X[month], y, w: MONTH_W, h };
}

/** Per shipping week: the month's weeks slide together into one bar at the mean, to the week scale. */
function asMean(index: number): Block {
  const month = monthOfWeek(index);
  const mean = unitsShipped(month) / weeksOf(month).length;
  const h = (mean / WEEK_MAX) * CHART_H;
  return { x: MONTH_X[month], y: BASE_Y - h, w: MONTH_W, h };
}

export type WeekView = "weeks" | Basis;

export function weekBlock(index: number, view: WeekView): Block {
  if (view === "weeks") return asWeeks(index);
  return view === "month" ? asMonth(index) : asMean(index);
}

const mix = (a: Block, b: Block, share: number): Block => ({
  x: lerp(a.x, b.x, share),
  y: lerp(a.y, b.y, share),
  w: lerp(a.w, b.w, share),
  h: lerp(a.h, b.h, share),
});

/** Block i between two views; `grow` (0..1) raises the blocks from the baseline on entry. */
export function weekFrame(index: number, from: WeekView, to: WeekView, share: number, grow = 1): Block {
  const block = mix(weekBlock(index, from), weekBlock(index, to), ease(share));
  const h = block.h * ease(clamp01(grow * 1.4 - index * 0.05));
  return { ...block, y: block.y + block.h - h, h };
}

export const WEEK_BASE_Y = BASE_Y;

/** Top of a month's column in a view (for the figure above it). */
export function monthTop(month: Month, view: Basis): number {
  if (view === "month") return BASE_Y - (unitsShipped(month) / TOTAL_MAX) * CHART_H;
  return BASE_Y - (unitsShipped(month) / weeksOf(month).length / WEEK_MAX) * CHART_H;
}

// ── Trace (beat 5) ────────────────────────────────────────────────────────

export const TRACE_VIEW = { width: 340, height: 196 } as const;
/** The flight, in milliseconds: each row starts min(i × 12, 900) ms in and flies 500 ms. */
export const TRACE_MS = 1800;
const STEP_MS = 12;
const DELAY_CAP_MS = 900;
const FLY_MS = 500;
const MODELS: readonly ModelCode[] = ["E1", "E2", "G1"];
export const BIN_X: Readonly<Record<ModelCode, number>> = { E1: 14, E2: 124, G1: 234 };
const CHIP = 9;
const CHIP_GAP = 2;
const BIN_COLS = 9;
export const BIN_TOP = 96;

export interface Chip {
  readonly x: number;
  readonly y: number;
  readonly model: ModelCode;
}

/** Where row i waits: a 19 × 5 grid, the file. */
export function chipSource(index: number): Chip {
  const column = index % 19;
  const line = Math.floor(index / 19);
  return {
    x: 14 + column * (CHIP + 7.6),
    y: 10 + line * (CHIP + 4),
    model: CRAFT_SEP_ROWS[index]?.[0] ?? "E1",
  };
}

/** Where row i lands: the next free cell of its model's bin. */
export function chipTarget(index: number): Chip {
  const model = CRAFT_SEP_ROWS[index]?.[0] ?? "E1";
  const position = CRAFT_SEP_ROWS.slice(0, index).filter(([code]) => code === model).length;
  const column = position % BIN_COLS;
  const line = Math.floor(position / BIN_COLS);
  return { x: BIN_X[model] + column * (CHIP + CHIP_GAP), y: BIN_TOP + line * (CHIP + CHIP_GAP), model };
}

export const CHIP_SIZE = CHIP;
export const TRACE_MODELS = MODELS;

/** Flight share of row i, `ms` after the tap. */
export function chipFlight(index: number, ms: number): number {
  const start = Math.min(index * STEP_MS, DELAY_CAP_MS);
  return clamp01((ms - start) / FLY_MS);
}

/** Rows that have landed `ms` after the tap: the counter adds only these. */
export function landedRows(ms: number): number {
  let landed = 0;
  for (let index = 0; index < CRAFT_SEP_ROWS.length; index += 1) if (chipFlight(index, ms) >= 1) landed += 1;
  return landed;
}
