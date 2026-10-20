/**
 * Pure motion helpers for the reel. No clock, no unseeded randomness, no
 * module state: every value is a function of the time it is asked for, so any
 * frame can be computed without replaying the earlier ones.
 */

import { SPRINGS, clamp, hashSeed, mulberry32, spring } from "../../../lib/figures/math.ts";

export { clamp, hashSeed, mulberry32 };

export type Mover = readonly [number, number] | "crit";

/** Spring presets from the house rules: SOFT for big type and falls, MED for moves. */
export const SOFT: Mover = SPRINGS.soft;
export const MED: Mover = SPRINGS.med;
export const SNAP: Mover = SPRINGS.snap;
/** Critically damped: never overshoots, used wherever a mark sits on a data axis. */
export const CRIT: Mover = "crit";

/** Length of the reel in seconds, and its loop. */
export const DURATION = 30;

/** Critically damped approach 0 to 1, rate w (1/s). */
export function crit(t: number, w = 9): number {
  if (t <= 0) return 0;
  return 1 - Math.exp(-w * t) * (1 + w * t);
}

/** Step response of a mover at time t seconds after it started. */
export function move(t: number, m: Mover): number {
  return m === "crit" ? crit(t) : spring(t, m[0], m[1]);
}

/** Seconds since t0 on a loop of DURATION seconds: in [0, DURATION). */
export function rel(t: number, t0: number): number {
  return (((t - t0) % DURATION) + DURATION) % DURATION;
}

/** Seeded Fisher-Yates permutation of 0..n-1. */
export function shuffled(n: number, salt: string): number[] {
  const rand = mulberry32(hashSeed(`reel:${salt}`));
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = a[i] as number;
    a[i] = a[j] as number;
    a[j] = tmp;
  }
  return a;
}

/** Two-decimal rounding for every coordinate written into markup. */
export const r2 = (x: number): number => Math.round(x * 100) / 100;
