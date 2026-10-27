/**
 * Scene 3 (and the visitor's own file): twelve rows become eleven months.
 * Every row of a bill file is a rectangle that the finger morphs, 1:1, from
 * its place in the list (t = 0) to a bar in its month slot of a twelve-slot
 * chart (t = 1). A pure function of t: no tween while dragging, the same
 * frame for the same t, and t = 1 is what reduced motion shows at once.
 *
 * Units are the SVG user units of a fixed view (MONTHS_VIEW); the component
 * scales the view to the room it has.
 */
import type { BillRow } from "./rules";

export const MONTHS_VIEW = { w: 360, h: 236 } as const;

/** Where the rows list and the chart sit inside the view. */
const LIST = { top: 6, left: 4, bottom: 6, rowMax: 18 } as const;
const CHART = { top: 30, bottom: 24, left: 4, right: 4, barShare: 0.6 } as const;
/** Row i starts at i x STAGGER of t (shrunk for long files so the last row still arrives). */
const STAGGER = 0.03;
/** How far a row lifts on its way, in user units. */
const ARC = 10;
/** How far a second booking of the same month slides off its twin. */
export const TWIN_OFFSET = 4;

export type RowKind = "first" | "duplicate" | "conflict";

export interface MorphItem {
  readonly row: BillRow;
  /** Position in the file order. */
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** This row's own progress, 0 (list) to 1 (bar). */
  readonly p: number;
  /** 0 for the first booking of a month, 1 for the next, and so on. */
  readonly stack: number;
  readonly kind: RowKind;
}

export interface MonthSlot {
  /** 1 to 12 */
  readonly month: number;
  readonly x: number;
  readonly w: number;
  readonly barX: number;
  readonly barW: number;
  readonly rows: number;
  readonly missing: boolean;
  /** The same invoice booked twice. */
  readonly duplicate: boolean;
  /** Two different invoices for one month (schwach belegt). */
  readonly conflict: boolean;
}

export interface MonthsLayout {
  readonly items: readonly MorphItem[];
  readonly slots: readonly MonthSlot[];
  readonly baseline: number;
  readonly chartTop: number;
  /** The amount the full chart height stands for. */
  readonly scaleMax: number;
}

const clamp01 = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);
/** Smoothstep: starts and lands softly, never overshoots. */
const ease = (x: number) => {
  const v = clamp01(x);
  return v * v * (3 - 2 * v);
};
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** A round ceiling for the chart scale: 1, 2 or 5 times a power of ten. */
export function niceCeil(value: number): number {
  if (!(value > 0)) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 5, 10]) if (step * power >= value) return step * power;
  return 10 * power;
}

/** The month number (1 to 12) of a "2025-10" key, or null when it is not in the year. */
export function monthOf(row: BillRow, year: number): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(row.month);
  if (!match || Number(match[1]) !== year) return null;
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? month : null;
}

/** The value a bar of this height stands for, and back. */
export function valueToY(value: number, layout: Pick<MonthsLayout, "baseline" | "chartTop" | "scaleMax">): number {
  const share = Math.max(0, Math.min(1, value / layout.scaleMax));
  return layout.baseline - share * (layout.baseline - layout.chartTop);
}

export function yToValue(y: number, layout: Pick<MonthsLayout, "baseline" | "chartTop" | "scaleMax">): number {
  const share = (layout.baseline - y) / (layout.baseline - layout.chartTop);
  return Math.max(0, Math.min(1, share)) * layout.scaleMax;
}

/**
 * The frame at t. Rows outside the year are left out (the caller says how
 * many). `scaleMax` fixes the chart scale (the electricity scene uses 50 MWh
 * so the guess bar and the bars share one axis).
 */
export function monthsLayout(rows: readonly BillRow[], year: number, t: number, scaleMax?: number): MonthsLayout {
  const inYear = rows.filter((row) => monthOf(row, year) !== null);
  const n = inYear.length;
  const { w, h } = MONTHS_VIEW;
  const rowH = Math.min(LIST.rowMax, (h - LIST.top - LIST.bottom) / Math.max(1, n));
  const slotW = (w - CHART.left - CHART.right) / 12;
  const barW = slotW * CHART.barShare;
  const baseline = h - CHART.bottom;
  const chartTop = CHART.top;
  const scale = scaleMax ?? niceCeil(Math.max(1, ...inYear.map((row) => row.amount)) * 1.1);
  const chart = { baseline, chartTop, scaleMax: scale };
  const stagger = n > 1 ? Math.min(STAGGER, 0.5 / (n - 1)) : 0;
  const span = 1 - stagger * Math.max(0, n - 1);

  const byMonth = new Map<number, BillRow[]>();
  const items: MorphItem[] = inYear.map((row, index) => {
    const month = monthOf(row, year) as number;
    const before = byMonth.get(month) ?? [];
    byMonth.set(month, [...before, row]);
    const stack = before.length;
    const kind: RowKind = stack === 0 ? "first" : before.some((other) => other.invoice === row.invoice) ? "duplicate" : "conflict";
    const p = ease((clamp01(t) - index * stagger) / span);
    const slotX = CHART.left + (month - 1) * slotW;
    const bar = {
      x: slotX + (slotW - barW) / 2 + stack * TWIN_OFFSET,
      y: valueToY(row.amount, chart),
      w: barW,
      h: baseline - valueToY(row.amount, chart),
    };
    const list = { x: LIST.left, y: LIST.top + index * rowH, w: w - LIST.left * 2, h: Math.max(0.5, rowH - 2) };
    return {
      row,
      index,
      x: lerp(list.x, bar.x, p),
      y: lerp(list.y, bar.y, p) - Math.sin(Math.PI * p) * ARC,
      w: lerp(list.w, bar.w, p),
      h: lerp(list.h, bar.h, p),
      p,
      stack,
      kind,
    };
  });

  const slots: MonthSlot[] = Array.from({ length: 12 }, (_, at) => {
    const month = at + 1;
    const booked = byMonth.get(month) ?? [];
    const invoices = new Set(booked.map((row) => row.invoice));
    const x = CHART.left + at * slotW;
    return {
      month,
      x,
      w: slotW,
      barX: x + (slotW - barW) / 2,
      barW,
      rows: booked.length,
      missing: booked.length === 0,
      duplicate: booked.length > invoices.size,
      conflict: invoices.size > 1,
    };
  });

  return { items, slots, baseline, chartTop, scaleMax: scale };
}

/** Which readout sentence the morph shows: the rows sum before the middle, the months sum after. */
export function morphEnd(t: number): "rows" | "months" {
  return clamp01(t) < 0.5 ? "rows" : "months";
}
