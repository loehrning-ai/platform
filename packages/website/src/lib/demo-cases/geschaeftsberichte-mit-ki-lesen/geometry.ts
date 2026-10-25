import { MAX_CUT, MIN_CUT, REVENUES } from "./data";
import { blend, easeInOut, lerp, norm, smoothstep } from "./motion";
import { clamp } from "./logic";

/**
 * The stage and the bars as numbers: every block, line and label position as
 * a pure function of the scene. Units are viewBox units of a 360 x 192 stage,
 * short enough that the number and the columns share a phone's first screen.
 *
 * Three looks of the same nine weeks, one scene variable each:
 *   s (stack)  0 = nine columns on the baseline, 1 = two month towers
 *   m (mode)   0 = total view, 1 = per week (columns again, with level lines)
 * Columns and the per-week row are drawn ROW_ZOOM times taller than a block in
 * a tower, so a week reads as a column and a tower still fits the plot. Within
 * one look a block's height is its revenue and never changes while it moves.
 * A tower is stacked so the week next to the line is on top: when the line
 * moves, that one block hops over to the other tower and nothing else moves.
 */
export const STAGE = {
  width: 360,
  height: 192,
  pad: 14,
  base: 140,
  towerWidth: 74,
  /** Height of a 4,3 Mio EUR week in the tower view. */
  pxPerEur: 18 / 4.3e6,
  top: 4,
} as const;

/** Columns and the per-week row are drawn this many times taller than a block in a tower. */
export const ROW_ZOOM = 4;
/** Where the handle sits on the line, as a fraction of the stage height. */
export const HANDLE_AT = 0.122;
/** Paper between two stacked blocks, in viewBox units. */
export const STACK_GAP = 2;
/** How far the hopping block lifts above its tower. */
export const HOP_LIFT = 16;

export const SLOT = (STAGE.width - 2 * STAGE.pad) / REVENUES.length;
export const slotCenter = (index: number) => STAGE.pad + SLOT * (index + 0.5);
export const cutX = (cutF: number) => STAGE.pad + cutF * SLOT;
const heightOf = (index: number) => (REVENUES[index] as number) * STAGE.pxPerEur;
const COLUMN_W = SLOT - 5;

/** Total-to-per-week morph: blocks travel to their slot first, then the row grows to its zoom. */
export const travelOf = (m: number) => easeInOut(norm(m, 0, 0.6));
export const zoomOf = (m: number) => easeInOut(norm(m, 0.4, 1));

/** Complementary label opacities: the old text is gone before the new one starts, never two at once. */
export const totalLabelOpacity = (m: number) => 1 - smoothstep(0.3, 0.46, m);
export const meanLabelOpacity = (m: number) => smoothstep(0.54, 0.7, m);

export interface Block {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** True while the block belongs to the left (earlier) month. */
  readonly left: boolean;
}

/** Bottom edge of block `index` in its tower when the cut is at the integer k: left towers grow rightwards, right towers leftwards. */
function stackBottom(index: number, k: number): number {
  let below = 0;
  if (index < k) for (let j = 0; j < index; j += 1) below += heightOf(j);
  else for (let j = index + 1; j < REVENUES.length; j += 1) below += heightOf(j);
  return STAGE.base - below;
}

/** Position in the stack, 0 = on the baseline. Used to stagger the gathering of the columns into towers. */
const rankOf = (index: number, k: number) => (index < k ? index : REVENUES.length - 1 - index);

/** Column rise with a 40 ms-style stagger: block i starts a little after block i - 1. */
export const riseOf = (index: number, rise: number) => easeInOut(norm(rise * 1.45 - index * 0.05, 0, 1));

/** All nine blocks for a scene's cut, m, rise and stack. */
export function blocks(cutF: number, m: number, rise = 1, s = 1): readonly Block[] {
  const f = clamp(cutF, MIN_CUT - 1, MAX_CUT + 1);
  const low = Math.floor(f);
  const frac = f - low;
  const t = frac < 1e-9 ? 0 : easeInOut(frac);
  const line = cutX(f);
  const leftCenter = (STAGE.pad + line) / 2;
  const rightCenter = (line + STAGE.width - STAGE.pad) / 2;
  const travel = travelOf(m);
  const zoom = zoomOf(m);
  return REVENUES.map((_, index) => {
    const h = heightOf(index);
    // Only the block next to the line is ever between two towers; its colour flips at the top of the hop.
    const crossing = index === low;
    const lambda = index < low ? 1 : crossing ? t : 0;
    const k = crossing && t >= 0.5 ? low + 1 : low;
    const bottomFrom = stackBottom(index, low);
    const bottomTo = crossing ? stackBottom(index, low + 1) : bottomFrom;
    // x and width stay glued to a tower except for the hop itself, which slides across in the middle of the arc.
    const towerX = crossing ? lerp(rightCenter, leftCenter, smoothstep(0.2, 0.8, t)) : index < low ? leftCenter : rightCenter;
    const towerBottom = lerp(bottomFrom, bottomTo, t) - (crossing ? HOP_LIFT * Math.sin(Math.PI * t) : 0);
    // Gather: columns on the baseline (s = 0) to the towers (s = 1), the baseline block first.
    const gather = easeInOut(clamp(s * 1.5 - rankOf(index, k) * 0.1, 0, 1));
    const baseX = lerp(slotCenter(index), towerX, gather);
    const baseBottom = lerp(STAGE.base, towerBottom, gather);
    const baseW = lerp(COLUMN_W, STAGE.towerWidth, gather);
    // Then the per-week move: back to the slot, onto the baseline.
    const x = lerp(baseX, slotCenter(index), travel);
    const bottom = lerp(baseBottom, STAGE.base, travel);
    const w = lerp(baseW, COLUMN_W, travel);
    const scale = lerp(ROW_ZOOM, 1, gather * (1 - zoom));
    const gap = STACK_GAP * gather * (1 - travel);
    const drawn = Math.max(0, h * scale * riseOf(index, rise) - gap);
    return { index, x: x - w / 2, y: bottom - drawn, w, h: drawn, left: lambda >= 0.5 };
  });
}

export interface GroupLabel {
  readonly x: number;
  /** Top edge of the group's tallest block (for the label above it). */
  readonly top: number;
  readonly mean: number;
  readonly total: number;
  readonly n: number;
}

/** Centre, top, mean and total of the left and right group at the scene's cut. */
export function groupLabels(cutF: number, m: number, rise = 1, stack = 1): { a: GroupLabel; b: GroupLabel } {
  const list = blocks(cutF, m, rise, stack);
  const k = Math.round(clamp(cutF, MIN_CUT, MAX_CUT));
  const line = cutX(cutF);
  const make = (members: readonly Block[], x: number, indices: readonly number[]): GroupLabel => {
    const total = indices.reduce((sum, index) => sum + (REVENUES[index] as number), 0);
    return {
      x,
      top: Math.min(...members.map((block) => block.y)),
      mean: total / indices.length,
      total,
      n: indices.length,
    };
  };
  const aIdx = REVENUES.map((_, index) => index).filter((index) => index < k);
  const bIdx = REVENUES.map((_, index) => index).filter((index) => index >= k);
  return {
    a: make(aIdx.map((index) => list[index] as Block), (STAGE.pad + line) / 2, aIdx),
    b: make(bIdx.map((index) => list[index] as Block), (line + STAGE.width - STAGE.pad) / 2, bIdx),
  };
}

/** y of a group's mean level line in the per-week view (drawn at the row's zoom). */
export const meanY = (mean: number) => STAGE.base - mean * STAGE.pxPerEur * ROW_ZOOM;

/* ---- ruler ------------------------------------------------------------ */

export const RULER = { width: 360, height: 62, axisY: 34, min: -0.6, max: 1.1, pad: 14 } as const;
export const rulerX = (fraction: number) =>
  RULER.pad + ((fraction - RULER.min) / (RULER.max - RULER.min)) * (RULER.width - 2 * RULER.pad);

/* ---- Act 2 bars ------------------------------------------------------- */

export const BARS = { width: 360, rowHeight: 38, left: 64, right: 52, top: 30, perMax: 3.5 } as const;

export interface BarRow {
  readonly line: string;
  readonly y: number;
  /** Top of the row's slot in the count view and in the per 1.000 view: the name labels crossfade between them. */
  readonly fromY: number;
  readonly toY: number;
  readonly length: number;
  readonly value: number;
}

/** Opacity of a moving row's name and value: gone before the swap starts, back after it ends, never two at once. */
export const rowLabelOpacity = (u: number) => (u < 0.5 ? 1 - smoothstep(0.05, 0.3, u) : smoothstep(0.7, 0.95, u));

/**
 * The defect bars: counts (u = 0) to per 1.000 units (u = 1). Rows re-sort
 * with the same easing as the bar lengths; lengths are fractions of the track.
 */
export function bars(
  rows: readonly { line: string; records: number; rate: number }[],
  u: number,
): readonly BarRow[] {
  const e = blend(u);
  // Bars grow or shrink over the whole morph; rows swap places only in its middle, while their labels are away.
  const swap = easeInOut(norm(u, 0.3, 0.7));
  const maxRecords = Math.max(...rows.map((row) => row.records));
  const byCount = [...rows].sort((x, y) => y.records - x.records);
  const byRate = [...rows].sort((x, y) => y.rate - x.rate);
  return rows.map((row) => {
    const from = byCount.indexOf(row);
    const to = byRate.indexOf(row);
    return {
      line: row.line,
      y: BARS.top + lerp(from, to, swap) * BARS.rowHeight,
      fromY: BARS.top + from * BARS.rowHeight,
      toY: BARS.top + to * BARS.rowHeight,
      length: lerp(row.records / maxRecords, row.rate / BARS.perMax, e),
      value: row.rate,
    };
  });
}
