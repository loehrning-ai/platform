/**
 * The scene of demo 03 as a pure function of one progress variable p in
 * 0..1 (seek). Nothing here has its own clock: dragging the lever, the two
 * buttons, the intro and the release tween only choose p.
 *
 * Every number the scene prints is a number that exists in the data. The
 * bars are built, not blended: each month is a STEP (the change, always
 * exactly its true length) that the lever lifts onto the GROUND of the
 * staircase (the level before it). Only the position of the step moves;
 * its length never does. Below p = LIFT_END the labels print the changes,
 * from there on the levels, and at that p the picture is already final, so
 * the switch changes words, not shapes.
 */
import { canPair, headline, type Reading, type Series } from "./series";

export const smooth = (x: number): number => x * x * (3 - 2 * x);
export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
/** 0 before `from`, exactly 1 from `to` on, linear between. */
export const ramp = (p: number, from: number, to: number): number => (p >= to ? 1 : clamp01((p - from) / (to - from)));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The step is lifted between these two values of p; at LIFT_END it stands on its rung. */
export const LIFT_START = 0.04;
export const LIFT_END = 0.5;
/**
 * The floor of the frame lags behind the lift: the frame first zooms out (the top rises) while the
 * zero line stays, and only in the last fifth of the lift the floor climbs to the level frame. So the
 * zero line, and with it the claim "Stand nie < 0", stays in the picture until about p = 0.4 and
 * leaves in one go with the note that zero lies below the frame.
 */
export const FLOOR_LAG = 0.8;
/** The numbers and labels dip in this window and come back as the other reading (true values only). */
export const SWAP_FROM = 0.46;
export const SWAP_TO = 0.54;
const SWAP_FLOOR = 0.35;

export interface Step {
  /** Where the step starts (its ground) and where it ends, in data units: `to - from` is exactly the change. */
  readonly from: number;
  readonly to: number;
}

export interface Scene {
  readonly lo: number;
  readonly hi: number;
  /** Where bars grow from: zero while it is in frame, else the frame floor. */
  readonly base: number;
  /** 0..1: how far the steps are lifted onto the staircase. */
  readonly lift: number;
  /** One step per month, exactly as long as its change. */
  readonly steps: readonly Step[];
  /** The top of the solid ground under each step, or null where there is none (a step standing on the line). */
  readonly pillars: readonly (number | null)[];
  /** What each bar's label prints: the changes before LIFT_END, the levels from there on. */
  readonly labels: readonly number[];
  readonly labelsOf: Reading;
  readonly zeroVisible: boolean;
  /** 0..1: how far the zero line has left the frame; the torn axis tears as it goes. */
  readonly tornAxis: number;
  /** 0..1, tied to the zero line really being out of frame. */
  readonly zeroNote: number;
  /** 0..1: opacity of the printed numbers (counter and bar labels) while they change reading. */
  readonly swap: number;
  /** 0..1: the two tones are named on one bar once the picture is final. */
  readonly tones: number;
  readonly startRung: number;
  /** The rung's label waits until the stamp has landed. */
  readonly startLabel: number;
  /** The big number: the change headline before LIFT_END, the level headline from there on. */
  readonly counter: number;
  /** Which reading the lever is nearer to; the word tag and the counter's caption cut over hard at LIFT_END. */
  readonly word: Reading;
  /** The first month's change, kept beside the counter once the level shows. */
  readonly ghost: number;
  /** The stamps are claims, shown only at rest. */
  readonly stampBefore: number;
  readonly stampAfter: number;
  /** Whether this series ever shows each stamp. */
  readonly canBefore: boolean;
  readonly canAfter: boolean;
  readonly sentence: number;
  readonly pair: number;
  readonly ticks: readonly number[];
  /** The first month has no known change (levels typed without a start). */
  readonly unknownFirst: boolean;
}

/** 1/2/5 steps so that at most four ticks fit the range. */
export function niceTicks(lo: number, hi: number): readonly number[] {
  const span = hi - lo;
  if (!(span > 0)) return [];
  const raw = span / 3;
  const power = 10 ** Math.floor(Math.log10(raw));
  const unit = raw / power;
  const step = (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power;
  const ticks: number[] = [];
  for (let value = Math.ceil(lo / step) * step; value <= hi + step * 1e-9; value += step) {
    ticks.push(Math.round(value / step) * step || 0);
  }
  return ticks;
}

/** The level a month stands on before its own step: the start for the first, the month before for the rest. */
const groundOf = (series: Series, index: number): number => (index === 0 ? series.startLevel : (series.levels[index - 1] ?? 0));

export function sceneAt(series: Series, progress: number, neverNegative = true): Scene {
  const p = clamp01(progress);
  const { changes, levels, frames } = series;
  const t = p <= LIFT_START ? 0 : p >= LIFT_END ? 1 : smooth((p - LIFT_START) / (LIFT_END - LIFT_START));
  // The top rides on the same t as the steps, the floor a little behind it (never above the blend
  // of the two frames), so a step, a blend of two points that both lie in their frames, never
  // leaves the window and nothing needs a safety margin.
  const floor = ramp(t, FLOOR_LAG, 1);
  const lo = floor === 1 ? frames.level.lo : lerp(frames.change.lo, frames.level.lo, floor);
  const hi = t === 1 ? frames.level.hi : lerp(frames.change.hi, frames.level.hi, t);
  const span = hi - lo || 1;
  const zeroVisible = lo <= 0 && hi >= 0;
  const base = Math.min(Math.max(0, lo), hi);
  const steps = changes.map((change, index): Step => {
    const from = t === 0 ? 0 : t === 1 ? groundOf(series, index) : t * groundOf(series, index);
    return { from, to: from + change };
  });
  const pillars = steps.map((step) => {
    const top = Math.min(step.from, step.to);
    return top > base + span * 0.004 ? top : null;
  });
  const reading: Reading = p < LIFT_END ? "change" : "level";
  // "Level never < 0" is about a typed number below zero in a column that cannot go below zero.
  const canBefore = series.valuesKind !== "level" && changes.some((change) => change < 0) && neverNegative;
  // "passt" claims the level fits the changes: only against a start the visitor typed (the first level or an assumed zero would fit by construction).
  const canAfter = series.startNote === "given";
  const head = headline(series);
  const zeroNote = zeroVisible ? 0 : clamp01(lo / (0.06 * span));
  // The claim stays exactly as long as the zero line does: it leaves with the same quantity that
  // brings the zero note in (and, for a frame that keeps zero, no later than the end of the lift).
  const leave = Math.min(1 - zeroNote, 1 - ramp(p, 0.4, 0.46));
  const swap = p < LIFT_END ? 1 - (1 - SWAP_FLOOR) * ramp(p, SWAP_FROM, LIFT_END) : SWAP_FLOOR + (1 - SWAP_FLOOR) * ramp(p, LIFT_END, SWAP_TO);
  return {
    lo,
    hi,
    base,
    lift: t,
    steps,
    pillars,
    labels: reading === "change" ? changes : levels,
    labelsOf: reading,
    zeroVisible,
    tornAxis: clamp01(1 + lo / (0.12 * span)),
    zeroNote,
    swap,
    tones: ramp(p, LIFT_END, 0.6),
    startRung: series.startNote === "given" ? ramp(p, LIFT_END, 0.62) : 0,
    startLabel: series.startNote === "given" ? ramp(p, 0.6, 0.7) : 0,
    counter: reading === "change" ? head.change : head.level,
    word: reading,
    ghost: head.first ? ramp(p, 0.66, 0.74) : 0,
    stampBefore: canBefore ? leave : 0,
    stampAfter: canAfter ? ramp(p, 0.7, 0.8) : 0,
    canBefore,
    canAfter,
    sentence: ramp(p, 0.82, 0.92),
    pair: canPair(series) ? ramp(p, 0.86, 1) : 0,
    ticks: niceTicks(lo, hi),
    unknownFirst: series.startNote === "first",
  };
}

/**
 * The intro, one pure function of time in ms: hold, pull the lever, hold, return to the hero
 * state. It plays once per page view and ends exactly where it began; after it the page is
 * still and only the hard-edged ring around the handle says "this moves". A touch cancels it.
 */
export const INTRO_MS = 3700;
export function introAt(ms: number): number {
  if (ms <= 700) return 0;
  if (ms <= 2100) return smooth((ms - 700) / 1400);
  if (ms <= 2700) return 1;
  if (ms <= INTRO_MS) return smooth(1 - (ms - 2700) / 1000);
  return 0;
}

/**
 * The reaction to the visitor's own numbers: one short trip to the other reading and
 * back to their own, 1.1 s in all, so the real values are on screen almost at once.
 * Returns the position of the lever for a lever that rests at `base` (0 or 1).
 */
export const OWN_MS = 1100;
export function ownAt(ms: number, base: 0 | 1): number {
  const x = clamp01(ms / OWN_MS);
  const away = smooth(1 - Math.abs(2 * x - 1));
  return base === 0 ? away : 1 - away;
}
