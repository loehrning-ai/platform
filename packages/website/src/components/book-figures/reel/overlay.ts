/**
 * Everything the reel draws besides squares and text: the ink ground, hairline
 * axes, bars, interval whiskers, ghost outlines of the 272 consultancy squares
 * and the edges of the feature network. Pure functions of time (and of the
 * square positions for the edges), returned as flat primitive lists that both
 * painters (SVG and canvas) draw the same way.
 */

import type { ReelData } from "./data.ts";
import { STRIDE } from "./field.ts";
import { type ReelLayout, COLORS, GRID_P, GRID_S, VH, VW, toStage } from "./layout.ts";
import { crit } from "./motion.ts";
import {
  H06_GRID_P,
  H06_GRID_S,
  H06_XB,
  SLAT_H,
  SLAT_Y,
  cellBottom,
  h06Y,
  binX,
} from "./states.ts";

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Hairline primitive: a rectangle outline/fill or a line, with alpha. */
export interface Prim {
  readonly kind: "rect" | "line" | "poly";
  readonly x: number;
  readonly y: number;
  /** rect: width/height; line: end point offsets. */
  readonly w: number;
  readonly h: number;
  readonly stroke?: string;
  readonly fill?: string;
  readonly sw: number;
  readonly a: number;
  /** poly: closed outline as x0, y0, x1, y1, ... */
  readonly pts?: readonly number[];
}

export interface Overlay {
  readonly under: readonly Prim[];
  readonly over: readonly Prim[];
}

/** The ink ground is the takeaway's alone: the hook stays on paper, the field is the one heavy thing. */
const INK_WORLDS: readonly (readonly [number, number])[] = [[24.85, 27.15]];

/** Ink ground as four horizontal slats that wipe in and out left to right. */
export function inkGround(t: number, layout: ReelLayout): Rect[] {
  const rects: Rect[] = [];
  const bandH = layout.H / 4;
  for (const [tin, tout] of INK_WORLDS) {
    for (let b = 0; b < 4; b += 1) {
      const xr = crit(t - tin - b * 0.04, 11);
      const xl = crit(t - tout - b * 0.04, 11);
      if (xr > xl + 0.0005) {
        rects.push({ x: xl * layout.W, y: b * bandH, w: (xr - xl) * layout.W, h: bandH + 0.5 });
      }
    }
  }
  return rects;
}

const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, sw: number, a: number): Prim => ({
  kind: "line", x: x1, y: y1, w: x2 - x1, h: y2 - y1, stroke, sw, a,
});
const rectP = (x: number, y: number, w: number, h: number, o: { stroke?: string; fill?: string; sw?: number; a?: number }): Prim => ({
  kind: "rect", x, y, w, h, stroke: o.stroke, fill: o.fill, sw: o.sw ?? 1, a: o.a ?? 1,
});

export function buildOverlay(
  data: ReelData,
  layout: ReelLayout,
  t: number,
  squares: Float32Array,
  count: number,
): Overlay {
  const under: Prim[] = [];
  const over: Prim[] = [];
  const sc = layout.field.sc;
  const S = (vx: number, vy: number): [number, number] => toStage(layout, vx, vy);
  const barW = (VW - 72) * sc;

  /* H05 bar: the track of all 89 websites and the interval of the lost share as outlined squares. */
  if (t >= 3.0 && t < 5.9) {
    const [x, y] = S(36, SLAT_Y);
    const p = crit(t - 3.0, 9);
    const fade = t > 5.7 ? 1 - crit(t - 5.7, 20) : 1;
    under.push(rectP(x, y, barW * p, SLAT_H * sc, { stroke: COLORS.hair, sw: 1.4, a: fade }));
    // The 36 to 56 % band: one outlined square for each website the interval still allows (solid = measured,
    // outline = could be), two rows above the bar, opening from the measured share outwards.
    const n = data.h05.of;
    const first = Math.floor((data.h05.ciLoPct / 100) * n);
    const last = Math.ceil((data.h05.ciHiPct / 100) * n);
    const mid = (data.h05.sharePct / 100) * n;
    const count = last - first;
    const cols = Math.ceil(count / 2);
    const bandX = x + (first / n) * barW;
    const bandW = ((last - first) / n) * barW;
    const side = bandW / cols - 2;
    for (let k = 0; k < count; k += 1) {
      const q = crit(t - 4.0 - Math.abs(first + k + 0.5 - mid) * 0.03, 12);
      if (q <= 0.01) continue;
      const col = k % cols;
      const row = Math.floor(k / cols);
      over.push(rectP(bandX + col * (side + 2) + 1, y - 2 * side - 14 + row * (side + 2), side, side, { stroke: COLORS.ink, sw: 1.4, a: fade * Math.min(1, q) }));
    }
  }

  /* H01 network: edges between the square centres of the first 60 slots. */
  if (t >= 8.8 && t < 11.2) {
    const net = data.h01.network;
    const cx = new Float64Array(net.nodes.length).fill(Number.NaN);
    const cy = new Float64Array(net.nodes.length).fill(Number.NaN);
    for (let n = 0; n < count; n += 1) {
      const slot = squares[n * STRIDE + 6] as number;
      if (slot < net.nodes.length) {
        cx[slot] = (squares[n * STRIDE] as number) + (squares[n * STRIDE + 2] as number) / 2;
        cy[slot] = (squares[n * STRIDE + 1] as number) + (squares[n * STRIDE + 3] as number) / 2;
      }
    }
    const kiIdx = net.nodes.findIndex((nd) => nd.ki);
    const grow = crit(t - 8.95, 8);
    const out = t > 10.85 ? 1 - crit(t - 10.85, 16) : 1;
    const fadeP = crit(t - 10.0, 7);
    const addP = crit(t - 10.35, 8);
    const edge = (pair: readonly [number, number], alpha: number): void => {
      const [i, j] = pair;
      if (alpha < 0.004 || Number.isNaN(cx[i] as number) || Number.isNaN(cx[j] as number)) return;
      const ki = i === kiIdx || j === kiIdx;
      under.push(line(cx[i] as number, cy[i] as number, cx[j] as number, cy[j] as number, ki ? COLORS.accent : COLORS.ink, ki ? 1.6 : 1, alpha * (ki ? 0.9 : 0.42)));
    };
    for (const e of net.stay) edge(e, grow * out);
    for (const e of net.fade) edge(e, grow * (1 - fadeP) * out);
    for (const e of net.add) edge(e, addP * out);
  }

  /* H02 bin floors. */
  if (t >= 11.55 && t < 16.2) {
    const a = crit(t - 11.55, 9);
    for (let b = 0; b < 6; b += 1) {
      const [x, y] = S(binX(b), 286 + 3);
      under.push(line(x, y, x + 66 * sc * a, y, COLORS.ink, 1.4, 1));
    }
  }

  /* H03 ghost frame: the outline around the cells of the 272 consultancy squares. */
  if (t >= 17.75 && t < 21.3) {
    const a = crit(t - 17.75, 10) * (t > 21.0 ? 1 - crit(t - 21.0, 14) : 1);
    const k = data.h03.consult.k;
    const full = Math.floor(k / 44);
    const rest = k % 44;
    const e = (GRID_P - GRID_S) / 2;
    const left = 0;
    const right = 44 * GRID_P;
    const yBottom = cellBottom(0)[1] + GRID_S + e;
    const yTopFull = cellBottom((full - 1) * 44)[1] - e;
    const pts: number[] = [];
    const add = (vx: number, vy: number): void => {
      const [x, y] = S(vx, vy);
      pts.push(x, y);
    };
    add(left, yBottom);
    add(right, yBottom);
    add(right, yTopFull);
    if (rest > 0) {
      const yTopRest = cellBottom(full * 44)[1] - e;
      add(rest * GRID_P, yTopFull);
      add(rest * GRID_P, yTopRest);
      add(left, yTopRest);
    } else {
      add(left, yTopFull);
    }
    over.push({ kind: "poly", x: 0, y: 0, w: 0, h: 0, pts, stroke: COLORS.ink, sw: 2.2, a });
  }

  /* H06 chart: the mean, the chance band, the ghost row of half A. */
  if (t >= 22.3 && t < 24.7) {
    const fade = t > 24.4 ? 1 - crit(t - 24.4, 16) : 1;
    const x0 = S(H06_XB - 10, 0)[0];
    const x1 = S(VW - 6, 0)[0];
    const yMean = S(0, h06Y(1))[1];
    const band = crit(t - 23.55, 8);
    if (band > 0.002) {
      const yHi = S(0, h06Y(data.h06.bandHi))[1];
      const yLo = S(0, h06Y(data.h06.bandLo))[1];
      under.push(rectP(x0, yMean + (yHi - yMean) * band, x1 - x0, (yLo - yHi) * band, { fill: COLORS.leinen, a: fade }));
    }
    under.push(line(x0, yMean, x1, yMean, COLORS.ink, 1.4, fade * crit(t - 22.3, 9)));
    if (t >= 22.55) {
      const gy = S(0, h06Y(data.h06.topA) - H06_GRID_S / 2)[1];
      const ga = crit(t - 22.75, 10) * fade;
      for (let j = 0; j < data.h06.top; j += 1) {
        const gx = S(36 + j * H06_GRID_P, 0)[0];
        over.push(rectP(gx - 0.5, gy - 0.5, H06_GRID_S * sc + 1, H06_GRID_S * sc + 1, { stroke: COLORS.ink, sw: 1.2, a: ga }));
      }
    }
  }
  void VH;
  return { under, over };
}
