/**
 * Motion primitives of the hero figures. Pure functions of a progress value:
 * no clock, no timer, no unseeded randomness. A value with several targets is
 * a sum of one spring per change, so any frame is computable without
 * replaying the frames before it.
 *
 * The presets are the book's four springs (SOFT, MED, STIFF, SNAP, see
 * math.ts). Numbers never overshoot: they use `settle`, a critically damped
 * response that reaches its value exactly and never passes it.
 */

import { clamp, mulberry32, spring, SPRINGS, type SpringName } from "./math.ts";
import { segment } from "./timing.ts";

/** Seconds the closed-form springs run for a whole 0 to 1 segment. */
export const SPRING_SECONDS = 1.2;

/** Critically damped response with natural frequency w: 0 at 0, never above 1. */
export function crit(tau: number, w: number): number {
  if (tau <= 0) return 0;
  return 1 - (1 + w * tau) * Math.exp(-w * tau);
}

const SETTLE_W = 14;
const SETTLE_NORM = crit(SPRING_SECONDS, SETTLE_W);

/**
 * Eases a segment (0 to 1) without overshoot: exactly 0 at 0 and exactly 1 at
 * 1. Used for everything that must not pass its final value: numbers, bars
 * that carry a printed value, slides onto a mean line.
 */
export function settle(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return Math.min(1, crit(t * SPRING_SECONDS, SETTLE_W) / SETTLE_NORM);
}

/**
 * Spring response of a segment of progress: the spring named `name` run over
 * the window [start, end]. May pass 1 a little in between (marks only), is
 * exactly 1 from `end` on.
 */
export function springIn(progress: number, start: number, end: number, name: SpringName = "med"): number {
  const t = segment(progress, start, end);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const [k, d] = SPRINGS[name];
  return spring(t * SPRING_SECONDS, k, d);
}

/** `settle` over the window [start, end] of a progress. */
export function settleIn(progress: number, start: number, end: number): number {
  return settle(segment(progress, start, end));
}

/**
 * Start of item `index` of `count` when they enter one after another inside
 * [from, to] with each taking `length`. `order` may permute the items.
 */
export function staggerStart(index: number, count: number, from: number, to: number, length: number): number {
  if (count <= 1) return from;
  const span = Math.max(0, to - from - length);
  return from + (index / (count - 1)) * span;
}

/** A seeded permutation of 0 to n - 1 (Fisher-Yates with mulberry32). */
export function seededOrder(seed: number, n: number): number[] {
  const order = Array.from({ length: n }, (_v, i) => i);
  const rand = mulberry32(seed >>> 0);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const a = order[i] as number;
    order[i] = order[j] as number;
    order[j] = a;
  }
  return order;
}

/** Linear mix of two values. */
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * Value of a quantity that changes between detents: from `a` to `b` by the
 * shift of a short spring. The printed value is always one of the two.
 */
export function between(a: number, b: number, shift: number): number {
  return mix(a, b, clamp(shift));
}

/** The shift (0 to 1) a control change has reached `progress01` of the way (STIFF, no overshoot past 1 shown). */
export function shiftEase(progress01: number): number {
  return Math.min(1, springIn(clamp(progress01), 0, 1, "stiff"));
}

/**
 * The book's motion vocabulary: four verbs and one rest, with their durations in
 * milliseconds. One verb leads each chapter (H02 split, H05 drain, H06 fill as a slope that
 * draws, H08 fill, H12 pour); the closing numeral always waits `hold` after the last move.
 * A figure reads these as shares of its own 0 to 1 progress through `verbShare`.
 */
export const MOTION_VERBS = {
  fill: 700,
  drain: 500,
  pour: 900,
  split: 1200,
  hold: 600,
} as const;

export type MotionVerb = keyof typeof MOTION_VERBS;

/** Share of a total running time (ms) that a verb takes, for windows inside a 0 to 1 progress. */
export function verbShare(verb: MotionVerb, totalMs: number): number {
  return Math.min(1, MOTION_VERBS[verb] / Math.max(1, totalMs));
}

/**
 * Straight-down fall of a block: ease-out (cubic-bezier .2 .8 .2 1 in spirit), no overshoot, so a block
 * never dips below the baseline of its bin. About 450 ms at the book's pacing.
 */
export function fallEase(t01: number): number {
  const t = clamp(t01);
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Timings of one stage entry, in one place so the critique rounds can tune them: shares of a step's 0 to 1
 * progress. Blocks fall in bin by bin (first bin starts at `first`, each next one `perBin` later, each block
 * `perSlot` after the one before) and take `fall` of the progress to land.
 */
export const ENTRY = {
  first: 0.14,
  perBin: 0.1,
  perSlot: 0.003,
  fall: 0.2,
} as const;
