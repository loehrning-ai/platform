/**
 * Tracing CRAFT's revenue to its rows of demand_actuals.csv: for a range of
 * shipping weeks, every CRAFT row (19 per week) lands in one of three model
 * bins, units times list price. The report's 4.124.238 € comes out only for
 * the five weeks from 2 September (scene 5).
 */
import { CRAFT_MODELS, CRAFT_SKUS, WEEK_STARTS, type ModelCode, type WeekStart } from "./data";

/** An inclusive range of week indices into WEEK_STARTS. */
export interface WeekRange {
  readonly from: number;
  readonly to: number;
}

/** The report's September: the five weeks from 2 September (indices 4 to 8). */
export const SEPTEMBER_RANGE: WeekRange = { from: 4, to: 8 };
/** The four weeks from 2 to 23 September. */
export const FOUR_WEEKS_RANGE: WeekRange = { from: 4, to: 7 };
/** August in the file: the four weeks from 5 August. */
export const AUGUST_RANGE: WeekRange = { from: 0, to: 3 };

export interface TraceRow {
  readonly sku: string;
  readonly model: ModelCode;
  readonly week: WeekStart;
  readonly weekIndex: number;
  readonly skuIndex: number;
  readonly units: number;
  readonly revenue: number;
}

const PRICE = new Map(CRAFT_MODELS.map((model) => [model.code, model.price]));

export function clampRange(range: WeekRange): WeekRange {
  const last = WEEK_STARTS.length - 1;
  const from = Math.max(0, Math.min(last, Math.round(range.from)));
  const to = Math.max(from, Math.min(last, Math.round(range.to)));
  return { from, to };
}

/** All 171 CRAFT rows, week by week (the order in which they stream into the bins). */
export const TRACE_ROWS: readonly TraceRow[] = WEEK_STARTS.flatMap((week, weekIndex) =>
  CRAFT_SKUS.map((row, skuIndex) => {
    const units = row.units[weekIndex] ?? 0;
    return {
      sku: row.sku,
      model: row.model,
      week,
      weekIndex,
      skuIndex,
      units,
      revenue: units * (PRICE.get(row.model) ?? 0),
    };
  }),
);

/** The rows inside a week range, in streaming order. */
export function rowsIn(range: WeekRange): readonly TraceRow[] {
  const { from, to } = clampRange(range);
  return TRACE_ROWS.filter((row) => row.weekIndex >= from && row.weekIndex <= to);
}

export interface TraceGroup {
  readonly code: ModelCode;
  readonly price: number;
  readonly rows: number;
  readonly units: number;
  readonly revenue: number;
}

export function traceGroups(range: WeekRange = SEPTEMBER_RANGE): readonly TraceGroup[] {
  const rows = rowsIn(range);
  return CRAFT_MODELS.map(({ code, price }) => {
    const mine = rows.filter((row) => row.model === code);
    const units = mine.reduce((sum, row) => sum + row.units, 0);
    return { code, price, rows: mine.length, units, revenue: units * price };
  });
}

export function traceSum(range: WeekRange = SEPTEMBER_RANGE): number {
  return rowsIn(range).reduce((sum, row) => sum + row.revenue, 0);
}

/** Revenue of the first `landed` rows of a range: the counter counts only rows that have arrived. */
export function landedSum(range: WeekRange, landed: number): number {
  return rowsIn(range)
    .slice(0, Math.max(0, Math.floor(landed)))
    .reduce((sum, row) => sum + row.revenue, 0);
}

/** Revenue per shipping week of a range. */
export function revenuePerWeek(range: WeekRange): number {
  const { from, to } = clampRange(range);
  return traceSum(range) / (to - from + 1);
}

/** Does a range reproduce the report's September exactly? */
export function matchesReport(range: WeekRange): boolean {
  const { from, to } = clampRange(range);
  return from === SEPTEMBER_RANGE.from && to === SEPTEMBER_RANGE.to;
}
