/**
 * Unit squares. A population of `base` things is drawn as `squares` hard-edged
 * squares, so one square stands for base / squares of them. Class sizes are
 * cut by largest remainder and always sum to the squares drawn. A class that
 * is smaller than the squares can show is drawn as whole squares plus one
 * partial square filled from the bottom; it is never rounded up.
 */

import { formatDecimal } from "./format.ts";

/** Largest-remainder apportionment: integers that sum to `total`, in the order of `weights`. */
export function largestRemainder(weights: readonly number[], total: number): number[] {
  const sum = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (!(sum > 0) || total <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (Math.max(0, w) / sum) * total);
  const out = exact.map((v) => Math.floor(v + 1e-9));
  let left = total - out.reduce((s, v) => s + v, 0);
  const order = exact
    .map((v, i) => ({ i, rem: v - Math.floor(v + 1e-9) }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (let k = 0; left > 0 && order.length > 0; k = (k + 1) % order.length) {
    const target = order[k];
    if (target) {
      out[target.i] = (out[target.i] ?? 0) + 1;
      left -= 1;
    }
  }
  return out;
}

export interface SquareClass {
  readonly count: number;
  /** Draw as whole squares plus one partial square instead of rounding (the finding when it is small). */
  readonly partial?: boolean;
}

export interface Allocation {
  /** Whole squares per class. */
  readonly whole: readonly number[];
  /** Fill of the partial square after the whole ones, 0 to 1; 0 means there is none. */
  readonly frac: readonly number[];
  /** Squares used in total, partial squares included; always `squares`. */
  readonly used: number;
}

/**
 * Squares for classes whose counts add up to `base`, `squares` squares in all.
 * Partial classes keep their exact share (whole squares plus a fraction); the
 * other classes share the remaining squares by largest remainder.
 */
export function allocateSquares(classes: readonly SquareClass[], base: number, squares: number): Allocation {
  const per = base > 0 ? squares / base : 0;
  const whole = classes.map(() => 0);
  const frac = classes.map(() => 0);
  let reserved = 0;
  classes.forEach((c, i) => {
    if (!c.partial) return;
    const exact = c.count * per;
    const w = Math.floor(exact + 1e-9);
    const f = exact - w;
    whole[i] = w;
    frac[i] = f > 0.02 ? Math.round(f * 100) / 100 : 0;
    reserved += w + (frac[i] ? 1 : 0);
  });
  const restIdx = classes.map((c, i) => (c.partial ? -1 : i)).filter((i) => i >= 0);
  const restSquares = Math.max(0, squares - reserved);
  const shares = largestRemainder(restIdx.map((i) => classes[i]?.count ?? 0), restSquares);
  restIdx.forEach((i, k) => {
    whole[i] = shares[k] ?? 0;
  });
  return { whole, frac, used: whole.reduce((s, v) => s + v, 0) + frac.filter((f) => f > 0).length };
}

/**
 * "1 Quadrat = 21 Startseiten". Exact (no "etwa") when one square stands for a
 * whole number of things; otherwise the size is rounded for reading.
 */
export function unitLine(base: number, squares: number, unit: string, noun = "Quadrat"): string {
  const per = squares > 0 ? base / squares : 0;
  const nbsp = " ";
  if (per > 0 && Math.abs(per - Math.round(per)) < 1e-9) {
    const n = Math.round(per);
    return `1${nbsp}${noun}${nbsp}=${nbsp}${formatDecimal(n, 0)}${nbsp}${n === 1 ? unitSingular(unit) : unitPlural(unit)}`;
  }
  if (per <= 0) return "";
  const digits = per >= 10 ? 0 : per >= 1 ? 1 : 2;
  return `1${nbsp}${noun}${nbsp}=${nbsp}etwa${nbsp}${formatDecimal(per, digits)}${nbsp}${unitPlural(unit)}`;
}

/** Singular of the unit word for "1 Quadrat = 1 ...": the word is given in plural, so the author supplies "Startseite|Startseiten". */
function unitSingular(unit: string): string {
  const bar = unit.indexOf("|");
  return bar >= 0 ? unit.slice(0, bar) : unit;
}

/** The plural of a unit word written "Startseite|Startseiten". */
export function unitPlural(unit: string): string {
  const bar = unit.indexOf("|");
  return bar >= 0 ? unit.slice(bar + 1) : unit;
}
