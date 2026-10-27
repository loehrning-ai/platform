/**
 * The geometry of the tub, in the SVG's own units. Pure: months and levels
 * in, coordinates out. The x axis morphs between the narrow view (December
 * 2025 to June 2026, seven month ends) and the wide one (December 2024 to
 * June 2026, nineteen) with `wide` in [0, 1]; the y axis is fixed at 0 to
 * 500.000 € and never rescales, so a level that moves really moves.
 */
import { NET_NEW_2026, SUMMARY } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { previousMonth, tubLevels } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/logic";

export const VIEW = { w: 360, h: 214 } as const;
export const PLOT = { l: 30, r: 314, t: 12, b: 196 } as const;
export const Y_MAX = 500_000;

export const MONTHS_2026: readonly string[] = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];
export const MONTHS_2025: readonly string[] = SUMMARY.filter((row) => row.month.startsWith("2025")).map((row) => row.month);
/** All month ends the wide view shows: December 2024 (always empty) to June 2026. */
export const WIDE: readonly string[] = ["2024-12", ...MONTHS_2025, ...MONTHS_2026];
/** The month ends of the narrow view. */
export const NARROW: readonly string[] = ["2025-12", ...MONTHS_2026];
export const QUARTER_MONTHS: readonly string[] = ["2026-04", "2026-05", "2026-06"];

export function y(value: number): number {
  return PLOT.b - (value / Y_MAX) * (PLOT.b - PLOT.t);
}

/** The value at an SVG y, the inverse of y(). */
export function valueAt(svgY: number): number {
  return ((PLOT.b - svgY) / (PLOT.b - PLOT.t)) * Y_MAX;
}

export interface Column {
  readonly month: string;
  readonly x0: number;
  readonly x1: number;
}

/** Where each month end of the wide axis sits, morphed by `wide` (0 narrow, 1 wide). */
export function columns(wide: number): readonly Column[] {
  const span = PLOT.r - PLOT.l;
  const narrowWidth = span / NARROW.length;
  const wideWidth = span / WIDE.length;
  return WIDE.map((month, index) => {
    const narrowIndex = NARROW.indexOf(month);
    const n0 = narrowIndex < 0 ? PLOT.l : PLOT.l + narrowIndex * narrowWidth;
    const n1 = narrowIndex < 0 ? PLOT.l : n0 + narrowWidth;
    const w0 = PLOT.l + index * wideWidth;
    const w1 = w0 + wideWidth;
    return { month, x0: n0 + (w0 - n0) * wide, x1: n1 + (w1 - n1) * wide };
  });
}

/**
 * The level at every month end of the wide axis, or null where the file does
 * not reach. `opening` is the level at the end of December 2025; `start` is
 * the first month the file covers ("2026-01" when only the export is read).
 */
export function levelsFor(opening: number, start: string): ReadonlyMap<string, number | null> {
  const levels = new Map<string, number | null>();
  const before = previousMonth(start);
  let running = 0;
  for (const month of ["2024-12", ...MONTHS_2025]) {
    if (month === "2025-12") break;
    if (month < before) levels.set(month, null);
    else if (month === before) levels.set(month, 0);
    else {
      running += SUMMARY.find((row) => row.month === month)?.netNew ?? 0;
      levels.set(month, running);
    }
  }
  levels.set("2025-12", opening);
  tubLevels(NET_NEW_2026, opening).forEach((level, index) => levels.set(MONTHS_2026[index] as string, level));
  return levels;
}

/** The stepped outline of a level series over the columns, closed to the floor (a water body). */
export function waterPath(cols: readonly Column[], levels: ReadonlyMap<string, number | null>): string {
  const parts: string[] = [];
  let open = false;
  let lastX = 0;
  for (const col of cols) {
    const level = levels.get(col.month);
    if (level === null || level === undefined || col.x1 - col.x0 < 0.01) {
      if (open) {
        parts.push(`L${lastX.toFixed(2)},${PLOT.b}Z`);
        open = false;
      }
      continue;
    }
    const top = y(Math.max(0, level)).toFixed(2);
    if (!open) {
      parts.push(`M${col.x0.toFixed(2)},${PLOT.b}L${col.x0.toFixed(2)},${top}`);
      open = true;
    } else parts.push(`L${col.x0.toFixed(2)},${top}`);
    parts.push(`L${col.x1.toFixed(2)},${top}`);
    lastX = col.x1;
  }
  if (open) parts.push(`L${lastX.toFixed(2)},${PLOT.b}Z`);
  return parts.join("");
}

/** The stepped top line only (the meniscus, or Claude's dashed ghost). */
export function surfacePath(cols: readonly Column[], levels: ReadonlyMap<string, number | null>): string {
  const parts: string[] = [];
  let open = false;
  for (const col of cols) {
    const level = levels.get(col.month);
    if (level === null || level === undefined || col.x1 - col.x0 < 0.01) {
      open = false;
      continue;
    }
    const top = y(level).toFixed(2);
    parts.push(`${open ? "L" : "M"}${col.x0.toFixed(2)},${top}L${col.x1.toFixed(2)},${top}`);
    open = true;
  }
  return parts.join("");
}

/** Claude's table as a level series: the export summed from January, December empty. */
export function ghostLevels(): ReadonlyMap<string, number | null> {
  const levels = new Map<string, number | null>([["2025-12", 0]]);
  tubLevels(NET_NEW_2026, 0).forEach((level, index) => levels.set(MONTHS_2026[index] as string, level));
  return levels;
}
