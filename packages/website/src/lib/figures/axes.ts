/**
 * Shared axis and bar geometry. A bar axis maps (category index, value range)
 * to a rectangle for either orientation, so bars and waterfalls share one
 * implementation of both.
 */

import { formatBare, formatValue } from "./format.ts";
import { scaleBand, scaleLinear, type BandScale, type LinearScale } from "./math.ts";
import { FS, el, op, scaleAbout, text, type Ctx, type SvgNode } from "./svg.ts";
import { frameReveal } from "./timing.ts";
import type { NumFmt } from "./types.ts";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface BarAxis {
  readonly orient: "h" | "v";
  readonly plot: Rect;
  readonly val: LinearScale;
  readonly band: BandScale;
  /** Rectangle of category i between two values. */
  rect(i: number, v0: number, v1: number): Rect;
  /** Scale attribute that grows a bar from value v0 along the value axis. */
  grow(f: number, v0: number): string | undefined;
}

export function makeBarAxis(
  orient: "h" | "v",
  plot: Rect,
  count: number,
  domain: readonly [number, number],
  padding = 0.3,
): BarAxis {
  if (orient === "h") {
    const val = scaleLinear(domain, [plot.x, plot.x + plot.w]);
    const band = scaleBand(count, [plot.y, plot.y + plot.h], padding);
    return {
      orient,
      plot,
      val,
      band,
      rect: (i, v0, v1) => ({
        x: Math.min(val(v0), val(v1)),
        y: band.pos(i),
        w: Math.abs(val(v1) - val(v0)),
        h: band.bandwidth,
      }),
      grow: (f, v0) => scaleAbout(f, 1, val(v0), 0),
    };
  }
  const val = scaleLinear(domain, [plot.y + plot.h, plot.y]);
  const band = scaleBand(count, [plot.x, plot.x + plot.w], padding);
  return {
    orient,
    plot,
    val,
    band,
    rect: (i, v0, v1) => ({
      x: band.pos(i),
      y: Math.min(val(v0), val(v1)),
      w: band.bandwidth,
      h: Math.abs(val(v1) - val(v0)),
    }),
    grow: (f, v0) => scaleAbout(1, f, 0, val(v0)),
  };
}

/** Digits a tick needs to be written exactly (at most 3). */
function digitsFor(t: number): number {
  for (let d = 0; d < 3; d += 1) {
    if (Math.abs(Math.round(t * 10 ** d) / 10 ** d - t) < 1e-9) return d;
  }
  return 3;
}

/**
 * Tick strings; the unit is written once, on the last tick. When the format's
 * own digits would round a tick to a wrong value (0,02 written as 0,0 on a log
 * axis), each tick gets the digits it needs instead.
 */
export function tickStrings(fmt: NumFmt, ticks: readonly number[]): string[] {
  const whole = ticks.every((t) => Number.isInteger(t));
  const tickFmt: NumFmt = whole ? { ...fmt, digits: 0 } : fmt;
  const base = tickFmt.digits ?? 0;
  const exact = ticks.every((t) => digitsFor(t) <= base);
  return ticks.map((t, i) => {
    const f: NumFmt = exact ? tickFmt : { ...tickFmt, digits: digitsFor(t) };
    return i === ticks.length - 1 ? formatValue(f, t) : formatBare(f, t);
  });
}

/**
 * Value gridlines and tick labels for a bar axis. Horizontal bars get vertical
 * gridlines with labels on top; vertical bars get horizontal gridlines with
 * labels on the left.
 */
export function valueGrid(
  ctx: Ctx<unknown>,
  axis: BarAxis,
  ticks: readonly number[],
  fmt: NumFmt,
): SvgNode[] {
  const { pal, p } = ctx;
  const o = op(frameReveal(p));
  const labels = tickStrings(fmt, ticks);
  const { plot } = axis;
  return ticks.flatMap((t, i): SvgNode[] => {
    const pos = axis.val(t);
    if (axis.orient === "h") {
      return [
        el("line", { x1: pos, y1: plot.y - 4, x2: pos, y2: plot.y + plot.h, stroke: pal.track, strokeWidth: 1, opacity: o }),
        text(pos, plot.y - 8, labels[i] ?? "", { size: FS.small, fill: pal.mutedLight, anchor: i === ticks.length - 1 ? "end" : "middle", opacity: o }),
      ];
    }
    return [
      el("line", { x1: plot.x - 4, y1: pos, x2: plot.x + plot.w, y2: pos, stroke: pal.track, strokeWidth: 1, opacity: o }),
      text(plot.x - 8, pos + 4, labels[i] ?? "", { size: FS.small, fill: pal.mutedLight, anchor: "end", opacity: o }),
    ];
  });
}

/** Estimated widest value label, to reserve space at the end of bars. */
export function reserveValueWidth(
  fmt: NumFmt,
  values: readonly (number | null)[],
  measure: (s: string) => number,
): number {
  let widest = measure(formatValue(fmt, 0));
  for (const v of values) {
    if (v !== null) widest = Math.max(widest, measure(formatValue(fmt, v)));
  }
  return widest;
}
