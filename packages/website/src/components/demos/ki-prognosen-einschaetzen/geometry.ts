import { SCENARIOS } from "@/lib/demo-cases/ki-prognosen-einschaetzen/quantile";

/** Width of the right gutter that carries the handle (the touch-action: none strip). */
export const GUTTER = 58;
export const HANDLE = 48;
const AXIS_LEFT = 36;
const PLOT_PAD_RIGHT = 4;
/** Room above the plot so the handle never leaves the chart at the top of the axis. */
const PAD_TOP = 26;
/** Room under the plot for the three axis words and the axis tag. */
const PAD_BOTTOM = 42;
/** A magnet catches the line within this many pixels. */
export const MAGNET_PX = 8;
/** A detent counts as "under the line" within this many pixels (its name shows). */
export const NEAR_PX = 6;

export interface Frame {
  readonly W: number;
  readonly H: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly lo: number;
  readonly hi: number;
  /** Width of one of the 100 weeks. */
  readonly unit: number;
}

export function makeFrame(
  W: number,
  H: number,
  domain: readonly [number, number],
  pad: { left?: number; right?: number; top?: number; bottom?: number } = {},
): Frame {
  const left = pad.left ?? AXIS_LEFT;
  const right = W - (pad.right ?? GUTTER + PLOT_PAD_RIGHT);
  return {
    W,
    H,
    left,
    right,
    top: pad.top ?? PAD_TOP,
    bottom: H - (pad.bottom ?? PAD_BOTTOM),
    lo: domain[0],
    hi: domain[1],
    unit: (right - left) / SCENARIOS,
  };
}

/** Pixel y of a value (higher value, smaller y). Not clamped. */
export const yOf = (frame: Frame, value: number) =>
  frame.bottom -
  ((value - frame.lo) / (frame.hi - frame.lo)) * (frame.bottom - frame.top);

/** The value at a pixel y, clamped to the axis. */
export function valueAt(frame: Frame, y: number): number {
  const value =
    frame.lo +
    ((frame.bottom - y) / (frame.bottom - frame.top)) * (frame.hi - frame.lo);
  return Math.min(frame.hi, Math.max(frame.lo, value));
}

/** The cap for a pointer at pixel y: the nearest detent within the magnet radius wins. */
export function capAt(
  frame: Frame,
  y: number,
  detents: readonly number[],
): number {
  let best: number | null = null;
  let distance = MAGNET_PX;
  for (const detent of detents) {
    const gap = Math.abs(yOf(frame, detent) - y);
    if (gap <= distance) {
      best = detent;
      distance = gap;
    }
  }
  return best ?? Math.round(valueAt(frame, y));
}

const STEPS = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];

/** Round axis values, at most six. */
export function niceTicks(lo: number, hi: number): readonly number[] {
  const step = STEPS.find((candidate) => (hi - lo) / candidate <= 5) ?? 10000;
  const ticks: number[] = [];
  for (let value = Math.ceil(lo / step) * step; value <= hi; value += step)
    ticks.push(value);
  return ticks;
}

const f1 = (value: number) => Math.round(value * 10) / 10;

export interface ColumnPaths {
  /** Sold: the black staircase up to min(demand, stock). */
  readonly ink: string;
  /** Missing: demand above the stock, one solid red shape. */
  readonly short: string;
  /** Left over: stock above demand. */
  readonly left: string;
  /** Weeks the scan has not settled yet (a quiet grey silhouette). */
  readonly pending: string;
  /** Dashed outline along the estimated tails (the lowest and the highest ten weeks). */
  readonly tails: string;
  /** Hairline gaps between the hundred columns, so every week can be counted. */
  readonly seams: string;
  /** The gap after every tenth week, a little wider: ten blocks of ten. */
  readonly tens: string;
}

/**
 * The staircase of 100 weeks as SVG paths, each a union of steps drawn as one
 * polygon: ink up to min(demand, stock), red above the stock, dotted grey
 * between demand and stock, the dashed tails, and a separate path of paper
 * seams that cuts the shapes into countable columns. `scanned` is how many
 * weeks (from the left) have been settled; the rest is drawn as `pending`
 * while the count-in runs. With every week settled the pending path is empty.
 */
export function columnPaths(
  frame: Frame,
  samples: readonly number[],
  cap: number,
  scanned: number = samples.length,
): ColumnPaths {
  const base = f1(yOf(frame, frame.lo));
  const capY = f1(yOf(frame, cap));
  const n = samples.length;
  const settled = Math.max(0, Math.min(n, Math.floor(scanned)));
  const x = (k: number) => f1(frame.left + k * frame.unit);
  const tops = samples.map((sample) =>
    f1(Math.max(frame.top, yOf(frame, sample))),
  );

  /** Contiguous runs [from, to] of settled weeks for which `test` holds. */
  const runs = (test: (top: number) => boolean) => {
    const out: [number, number][] = [];
    let start = -1;
    for (let k = 0; k <= settled; k += 1) {
      const on = k < settled && test(tops[k] as number);
      if (on && start < 0) start = k;
      if (!on && start >= 0) {
        out.push([start, k - 1]);
        start = -1;
      }
    }
    return out;
  };

  const ink = runs(() => true)
    .map(([a, b]) => {
      let d = `M${x(a)} ${base}`;
      for (let k = a; k <= b; k += 1) {
        const top = Math.max(tops[k] as number, capY);
        d += `L${x(k)} ${top}L${x(k + 1)} ${top}`;
      }
      return `${d}L${x(b + 1)} ${base}Z`;
    })
    .join("");

  const short = runs((top) => top < capY)
    .map(([a, b]) => {
      let d = `M${x(a)} ${capY}`;
      for (let k = a; k <= b; k += 1)
        d += `L${x(k)} ${tops[k]}L${x(k + 1)} ${tops[k]}`;
      return `${d}L${x(b + 1)} ${capY}Z`;
    })
    .join("");

  const rest = runs((top) => top > capY)
    .map(([a, b]) => {
      let d = `M${x(a)} ${capY}L${x(b + 1)} ${capY}`;
      for (let k = b; k >= a; k -= 1)
        d += `L${x(k + 1)} ${tops[k]}L${x(k)} ${tops[k]}`;
      return `${d}Z`;
    })
    .join("");

  let pending = "";
  if (settled < n) {
    pending = `M${x(settled)} ${base}`;
    for (let k = settled; k < n; k += 1)
      pending += `L${x(k)} ${tops[k]}L${x(k + 1)} ${tops[k]}`;
    pending += `L${x(n)} ${base}Z`;
  }

  const tail = (a: number, b: number) => {
    if (settled < b) return "";
    let d = `M${x(a)} ${tops[a]}`;
    for (let k = a; k < b; k += 1)
      d += `H${x(k + 1)}${k + 1 < b ? `V${tops[k + 1]}` : ""}`;
    return d;
  };

  let seams = "";
  let tens = "";
  for (let k = 1; k < n; k += 1) {
    const top = Math.min(
      tops[k - 1] as number,
      tops[k] as number,
      k <= settled ? capY : base,
    );
    const line = `M${x(k)} ${Math.max(frame.top, top)}V${base}`;
    if (k % 10 === 0) tens += line;
    else seams += line;
  }
  return {
    ink,
    short,
    left: rest,
    pending,
    tails: tail(0, 10) + tail(90, n),
    seams,
    tens,
  };
}

export interface LabelBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * Where the big "short in N of 100" label goes: on the red region, right
 * aligned, just above the line, when the red is tall enough there (the column
 * under the box's left edge must reach above its top); otherwise just above
 * the right end of the staircase, so it never sits on the black. Null when
 * no week is short.
 */
export function redLabelBox(
  frame: Frame,
  samples: readonly number[],
  cap: number,
  w: number,
  h: number,
): LabelBox | null {
  const n = samples.length;
  if (n === 0 || (samples[n - 1] as number) <= cap) return null;
  const x = frame.right - 14 - w;
  const top = (k: number) =>
    Math.max(frame.top, yOf(frame, samples[Math.max(0, Math.min(n - 1, k))] as number));
  const column = Math.floor((x - frame.left) / frame.unit);
  const capY = yOf(frame, cap);
  const inside = capY - 8 - h;
  // Red only counts where the column beneath the left edge is above the cap.
  if (
    (samples[Math.max(0, column)] as number) > cap &&
    top(column) <= inside - 4
  ) {
    return { x, y: inside, w, h };
  }
  const above = Math.max(2, top(n - 1) - 6 - h);
  return { x, y: above, w, h };
}
