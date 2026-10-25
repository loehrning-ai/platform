/**
 * Tracing CRAFT's September revenue to its rows: 95 rows of
 * demand_actuals.csv in three model bins, units times list price.
 */
import { CRAFT_MODELS, CRAFT_SEP_ROWS, type ModelCode } from "./data";

export interface TraceGroup {
  readonly code: ModelCode;
  readonly price: number;
  readonly rows: number;
  readonly units: number;
  readonly revenue: number;
}

export function traceGroups(): readonly TraceGroup[] {
  return CRAFT_MODELS.map(({ code, price }) => {
    const rows = CRAFT_SEP_ROWS.filter(([model]) => model === code);
    const units = rows.reduce((sum, [, value]) => sum + value, 0);
    return { code, price, rows: rows.length, units, revenue: units * price };
  });
}

export function traceSum(groups: readonly TraceGroup[]): number {
  return groups.reduce((sum, group) => sum + group.revenue, 0);
}

const PRICE = new Map(CRAFT_MODELS.map((model) => [model.code, model.price]));

/** Revenue of the first `landed` rows in file order: the counter counts only rows that have arrived. */
export function landedSum(landed: number): number {
  let sum = 0;
  for (const [model, units] of CRAFT_SEP_ROWS.slice(0, Math.max(0, Math.floor(landed)))) {
    sum += units * (PRICE.get(model) ?? 0);
  }
  return sum;
}
