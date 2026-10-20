/**
 * Geometry of the explorer's field: 1.000 hard-edged squares in 40 columns by
 * 25 rows, filled in reading order (left to right, row by row from the top), so
 * a share reads as a block like a waffle and the 95 % band is one run of
 * outlined squares next to it. One square is 0,1 % of the base, so the
 * estimate "3 von 100" is exactly 30 squares. Pure functions
 * that return SVG path data; three batched paths draw the whole field.
 */

import type { FieldCounts } from "@/lib/explorer/model";

export const COLS = 40;
export const ROWS = 25;
export const SQUARES = COLS * ROWS;
const CELL = 10;
const SIZE = 8.6;
export const VIEW_WIDTH = COLS * CELL;
export const VIEW_HEIGHT = ROWS * CELL;

/** Top-left corner of square `index` (row-major, from the top left). */
export function corner(index: number): readonly [number, number] {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  return [col * CELL + (CELL - SIZE) / 2, row * CELL + (CELL - SIZE) / 2];
}

const r2 = (n: number): string => String(Math.round(n * 100) / 100);

function squares(from: number, to: number): string {
  let d = "";
  for (let i = Math.max(0, from); i < Math.min(SQUARES, to); i += 1) {
    const [x, y] = corner(i);
    d += `M${r2(x)} ${r2(y)}h${SIZE}v${SIZE}h${-SIZE}z`;
  }
  return d;
}

function outlines(from: number, to: number): string {
  const inset = 1.2;
  const side = SIZE - inset * 2;
  let d = "";
  for (let i = Math.max(0, from); i < Math.min(SQUARES, to); i += 1) {
    const [x, y] = corner(i);
    d += `M${r2(x + inset)} ${r2(y + inset)}h${r2(side)}v${r2(side)}h${r2(-side)}z`;
  }
  return d;
}

export interface FieldPaths {
  /** Squares of the estimate (Mennige). */
  readonly solid: string;
  /** The partial square, filled from the bottom (Mennige). */
  readonly partial: string;
  /** Outlines of the 95 % band (ink). */
  readonly band: string;
  /** Everything else (Leinen). */
  readonly rest: string;
}

export function fieldPaths(counts: FieldCounts): FieldPaths {
  const whole = Math.max(0, Math.min(SQUARES, Math.floor(counts.solid + 1e-9)));
  let partial = "";
  if (counts.partial > 0 && whole < SQUARES) {
    const [x, y] = corner(whole);
    const h = SIZE * Math.max(0, Math.min(1, counts.partial));
    partial = `M${r2(x)} ${r2(y + SIZE - h)}h${SIZE}v${r2(h)}h${-SIZE}z`;
  }
  return {
    solid: squares(0, whole),
    partial,
    band: outlines(counts.bandFrom, counts.bandTo),
    rest: squares(whole + (counts.partial > 0 ? 1 : 0), SQUARES),
  };
}

/** Blend between two counts with an ease-out that never overshoots. */
export function easeCounts(from: FieldCounts, to: FieldCounts, t: number): FieldCounts {
  const k = t >= 1 ? 1 : t <= 0 ? 0 : 1 - (1 - t) ** 3;
  const lerp = (a: number, b: number): number => a + (b - a) * k;
  const fromSolid = from.solid + from.partial;
  const toSolid = to.solid + to.partial;
  const solidFloat = lerp(fromSolid, toSolid);
  const solid = Math.floor(solidFloat + 1e-9);
  return {
    solid,
    partial: Math.max(0, solidFloat - solid) < 1e-6 ? 0 : solidFloat - solid,
    bandFrom: Math.round(lerp(from.bandFrom, to.bandFrom)),
    bandTo: Math.round(lerp(from.bandTo, to.bandTo)),
  };
}
