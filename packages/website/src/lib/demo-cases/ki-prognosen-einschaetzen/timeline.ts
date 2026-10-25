/**
 * The stage as a pure function of the beat's progress p in [0, 1] (the
 * shell's clock). p = 0 is the empty frame, p = 1 the end frame that reduced
 * motion shows at once. Every count the stage reveals grows with p and never
 * shrinks. No DOM, no clock: timeline.test.ts samples it.
 */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** The site's soft ease-out. */
export const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 3;

/** The guesses of the commit beat, in percent ("um 75 %" ...). */
export const GUESSES = [75, 85, 93] as const;
/** The tip of the range beat: more than, about, fewer than the promised share. */
export const RANGE_TIPS = ["more", "about", "fewer"] as const;
export type RangeTip = (typeof RANGE_TIPS)[number];

/** Arrival: bar i of n has risen to this share (bars rise left to right). */
export function barRise(i: number, n: number, p: number): number {
  const start = (i / Math.max(1, n)) * 0.6;
  return easeOut((p - start) / 0.4);
}

/** Messlatte: the copy of the sales line slides one week to the right first, then the replay sweeps. */
export const SHIFT_END = 0.2;

export interface MesslatteFrame {
  /** 0..1 of the one-week slide of the "same as last week" line. */
  readonly shift: number;
  /** The counter card, from the guess to the computed accuracy. */
  readonly counter: number;
  /** How many of the scored weeks the sweep has passed. */
  readonly revealed: number;
}

export function messlatteFrame(p: number, scored: number, guess: number, accuracy: number): MesslatteFrame {
  const shift = easeOut(p / SHIFT_END);
  return {
    shift,
    counter: guess + (accuracy - guess) * shift,
    revealed: Math.floor(clamp01((p - SHIFT_END) / (1 - SHIFT_END)) * scored + 1e-9),
  };
}

/** Spanne and Regel: a plain sweep over n weeks (the last 15 % of p holds the end frame). */
export function sweep(p: number, n: number): number {
  return Math.floor(clamp01(p / 0.85) * n + 1e-9);
}

/** Planzahl: the jars settle into their sorted row, then the order line drops in. */
export interface PlanFrame {
  readonly jars: number;
  readonly line: number;
}

export function planFrame(p: number, count: number): PlanFrame {
  return { jars: Math.floor(clamp01(p / 0.6) * count + 1e-9), line: easeOut((p - 0.6) / 0.4) };
}

/** The range tip that matches a count against the promised count. */
export function tipFor(hits: number, promised: number): RangeTip {
  if (hits > promised) return "more";
  if (hits === promised) return "about";
  return "fewer";
}
