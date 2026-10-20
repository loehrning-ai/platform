/**
 * The field engine. `evalField(t, out)` is a pure function of time that fills
 * one preallocated Float32Array with the squares to draw: x, y, w, h, class,
 * partial fill, six numbers per square, in stage pixels. A square's path
 * through the reel is a list of segments (one per state it is part of); a
 * segment is a closed-form spring between two positions, so any time can be
 * computed without replaying the earlier ones.
 */

import { Builder, N, type StateDef } from "./builder.ts";
import type { ReelLayout } from "./layout.ts";
import { VH, VW } from "./layout.ts";
import { DURATION, move, type Mover } from "./motion.ts";

/** x, y, w, h, class, partial fill, slot id. */
export const STRIDE = 7;
const DEFAULT_CLS_AT = 0.2;

interface Seg {
  readonly start: number;
  readonly mover: Mover;
  readonly clsAt: number;
  readonly from: readonly number[];
  readonly to: readonly number[];
}

export interface Field {
  readonly states: readonly StateDef[];
  readonly builders: readonly Builder[];
  /** Fill `out` for time t; returns the number of visible squares. */
  readonly evalField: (t: number, out: Float32Array) => number;
}

/** Position vector: x, y, w, h, class, fill. */
type Vec = number[];

function vecOf(b: Builder, i: number): Vec {
  return [b.x[i] as number, b.y[i] as number, b.w[i] as number, b.h[i] as number, b.cls[i] as number, b.fill[i] as number];
}

/** Write the position at time t into `v` (6 numbers); false before the first segment. */
function sampleInto(segs: readonly Seg[], t: number, wrapStart: number | null, v: Float64Array): boolean {
  let tt = t;
  if (wrapStart !== null && tt >= DURATION + wrapStart) tt -= DURATION;
  for (let s = segs.length - 1; s >= 0; s -= 1) {
    const seg = segs[s] as Seg;
    if (tt >= seg.start) {
      const p = move(tt - seg.start, seg.mover);
      const q = p < 0 ? 0 : p > 1 ? 1 : p;
      const f = seg.from;
      const g = seg.to;
      v[0] = (f[0] as number) + ((g[0] as number) - (f[0] as number)) * p;
      v[1] = (f[1] as number) + ((g[1] as number) - (f[1] as number)) * p;
      v[2] = (f[2] as number) + ((g[2] as number) - (f[2] as number)) * p;
      v[3] = (f[3] as number) + ((g[3] as number) - (f[3] as number)) * p;
      v[4] = q >= seg.clsAt ? (g[4] as number) : (f[4] as number);
      v[5] = (f[5] as number) + ((g[5] as number) - (f[5] as number)) * q;
      return true;
    }
  }
  return false;
}

export function createField(states: readonly StateDef[], layout: ReelLayout): Field {
  const K = states.length;
  const builders: Builder[] = [];
  const lastX = new Float32Array(N);
  for (let k = 0; k < K; k += 1) {
    const b = new Builder();
    b.px.set(lastX);
    (states[k] as StateDef).build(b);
    for (let i = 0; i < N; i += 1) if (b.act[i]) lastX[i] = b.x[i] as number;
    builders.push(b);
  }

  const scratch = new Float64Array(6);
  const segsBySlot: Seg[][] = Array.from({ length: N }, () => []);
  const wrapStart = new Float64Array(N).fill(Number.NaN);
  const below = VH + 48;
  const above = -48;

  for (let k = 0; k < K; k += 1) {
    const def = states[k] as StateDef;
    const b = builders[k] as Builder;
    const prev = builders[(k + K - 1) % K] as Builder;
    const startBase = k === 0 ? def.t - DURATION : def.t;
    for (let i = 0; i < N; i += 1) {
      const act = b.act[i] === 1;
      const prevAct = prev.act[i] === 1;
      if (!act && !prevAct) continue;
      const start = startBase + (b.delay[i] as number);
      let from: Vec;
      if (prevAct) {
        if (k === 0) from = vecOf(prev, i);
        else {
          from = sampleInto(segsBySlot[i] as Seg[], start, null, scratch) ? Array.from(scratch) : vecOf(prev, i);
        }
      } else {
        from = [b.x[i] as number, above, b.w[i] as number, b.h[i] as number, b.cls[i] as number, b.fill[i] as number];
      }
      let to: Vec;
      if (act) to = vecOf(b, i);
      else to = [prev.x[i] as number, below, from[2] as number, from[3] as number, from[4] as number, from[5] as number];
      (segsBySlot[i] as Seg[]).push({
        start,
        mover: def.mover,
        clsAt: def.clsAt ?? DEFAULT_CLS_AT,
        from,
        to,
      });
      if (k === 0) wrapStart[i] = start;
    }
  }

  // Segments must be in time order per slot: state 0 first (negative start).
  for (let i = 0; i < N; i += 1) (segsBySlot[i] as Seg[]).sort((p, q) => p.start - q.start);

  const { x: fx, y: fy, sc } = layout.field;

  const evalField = (t: number, out: Float32Array): number => {
    let n = 0;
    for (let i = 0; i < N; i += 1) {
      const segs = segsBySlot[i] as Seg[];
      if (segs.length === 0) continue;
      const w0 = Number.isNaN(wrapStart[i] as number) ? null : (wrapStart[i] as number);
      if (!sampleInto(segs, t, w0, scratch)) continue;
      const y = scratch[1] as number;
      const h = scratch[3] as number;
      if (y > VH + 1 || y + h < -1) continue;
      const o = n * STRIDE;
      out[o] = fx + (scratch[0] as number) * sc;
      out[o + 1] = fy + y * sc;
      out[o + 2] = (scratch[2] as number) * sc;
      out[o + 3] = h * sc;
      out[o + 4] = scratch[4] as number;
      out[o + 5] = scratch[5] as number;
      out[o + 6] = i;
      n += 1;
    }
    return n;
  };

  void VW;
  return { states, builders, evalField };
}
