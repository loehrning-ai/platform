/*
 * The stage as pure functions of progress. p is the handle (0 to 1, driven by
 * the visitor's finger); introT, snapT and sendT are clocks. Nothing here
 * reads time or the DOM, so a frame can be scrubbed back: the gesture that
 * blacks the text out is the same one that un-sends it.
 */
export const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
export const easeOut = (x: number): number => 1 - (1 - x) ** 3;

/**
 * Each hit owns a window of HIT_SPAN slots and the windows overlap, so a hit
 * has time to be seen: marker, then the bar sweeping across it, then the bar
 * held full for a beat, then the pill. n hits plus one closing slot make the
 * handle's whole travel: q = p * (n + HIT_SPAN) slots, hit i lives in
 * [i, i + HIT_SPAN], the lock settles in the last slot.
 */
export const HIT_SPAN = 2.5;
const travel = (n: number): number => n + HIT_SPAN;

/**
 * A hit counts as blacked out the moment its pill is fully drawn: u >= DONE_AT.
 * One threshold for the pill, the counter, the screen reader's value text, the
 * stops and the Rest-Scan, so nothing can read "4" while a finished pill shows.
 */
export const DONE_AT = 0.9;

/** 0..1 progress of hit i inside its own window. */
export const hitU = (p: number, i: number, n: number): number => clamp01((p * travel(n) - i) / HIT_SPAN);

/** The handle positions at which each hit is finished, then 1: PageUp and PageDown stops. */
export const stopsFor = (n: number): readonly number[] => [
  ...Array.from({ length: n }, (_, i) => (i + HIT_SPAN * DONE_AT) / travel(n)),
  1,
];

export interface HitFrame {
  /** Marker opacity. */
  readonly marker: number;
  /** Bar scaleX, origin left. */
  readonly bar: number;
  /** Pill opacity. */
  readonly pill: number;
  readonly done: boolean;
}

/** Beats inside a window: the bar sweeps over u 0.05 to 0.45, holds to 0.62, the pill is fully drawn at DONE_AT. */
export const BAR_FROM = 0.05;
export const BAR_FULL = 0.45;
export const PILL_FROM = 0.62;

/** `steps` rounds u to 0 or 1: hits switch state with no sweep or crossfade. */
export function hitFrame(p: number, i: number, n: number, steps = false): HitFrame {
  const raw = hitU(p, i, n);
  const done = raw >= DONE_AT;
  const u = steps ? (done ? 1 : 0) : raw;
  return {
    marker: u === 0 ? 1 : 1 - clamp01((u - (BAR_FULL - 0.05)) / 0.1),
    bar: u < DONE_AT ? easeOut(clamp01((u - BAR_FROM) / (BAR_FULL - BAR_FROM))) : 0,
    pill: steps ? (done ? 1 : 0) : clamp01((u - PILL_FROM) / (DONE_AT - PILL_FROM)),
    done,
  };
}

/**
 * The one definition of "blacked out": hit i is done at u >= DONE_AT (its pill is whole). The counter,
 * the screen reader's value text, the pills and the Rest-Scan all read it, in
 * every motion mode (reduced motion only skips the in-between frames).
 */
export const remaining = (p: number, n: number): number =>
  Array.from({ length: n }, (_, i) => hitU(p, i, n) < DONE_AT).filter(Boolean).length;

export const doneCount = (p: number, n: number): number => n - remaining(p, n);

/** 0..1 for the lock glyph and the rest-scan line: the last slot of the travel. */
export const settle = (p: number, n: number): number => clamp01(p * travel(n) - (travel(n) - 1));

/** n === 0 settles at once. */
export const isSettled = (p: number, n: number): boolean => (n === 0 ? p >= 1 : settle(p, n) >= 1);

/**
 * The first beat, played once on its own, slow enough to read one hit alone:
 * the handle eases to the end of the FIRST hit (marker, bar, pill, the counter
 * ticks down by one), holds there, runs on to 1 (the rest follow, the lock
 * closes), rests, and eases back to 0. t in [0, 1] is the sweep clock; 0 and 1
 * are both rest, so the first frame is the discovery state, never an end state.
 */
const easeInOut = (x: number): number => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
export const SWEEP_BEATS = { start: 0.04, firstEnd: 0.3, firstHold: 0.44, allEnd: 0.7, allHold: 0.82 } as const;
export const sweepP = (t: number, n: number): number => {
  if (t <= 0 || t >= 1) return 0;
  const { start, firstEnd, firstHold, allEnd, allHold } = SWEEP_BEATS;
  const first = stopsFor(n)[0] as number;
  if (t < start) return 0;
  if (t < firstEnd) return first * easeInOut((t - start) / (firstEnd - start));
  if (t < firstHold) return first;
  if (t < allEnd) return first + (1 - first) * easeInOut((t - firstHold) / (allEnd - firstHold));
  if (t < allHold) return 1;
  return 1 - easeInOut((t - allHold) / (1 - allHold));
};

/** The hint: the handle leans right twice (about 14 px on a phone), then is back at rest. */
export const nudge = (t: number, amount = 0.06): number =>
  t <= 0 || t >= 1 ? 0 : amount * Math.abs(Math.sin(2 * Math.PI * t));

/** Release value to 1 over the snap clock. */
export const snapValue = (from: number, t: number): number => from + (1 - from) * easeOut(clamp01(t));

/** Releasing at or past this snaps to 1. */
export const SNAP_AT = 0.92;

export interface SendFrame {
  /** Share of the way still to go from the raw detail to its slot in the strip: 1 at the start, 0 when landed. */
  readonly away: number;
  /** The ghost slot the chip lands in: drawn until the chip is there. */
  readonly ghost: number;
  /** scaleX of the thick closing bar. */
  readonly line: number;
  /** 0..1: how far the SENDEN caption and the handle step back (to 0.4 opacity) while the chips fly past them. */
  readonly hush: number;
}

/**
 * Chip i lifts off its own raw detail in the card and flies to its own row in
 * the strip. All chips share one clock (no stagger): rows are in text order, so
 * with a common progress the gap between neighbours is a blend of their start
 * gap and their row gap (28 px, a chip plus its margin). It never shrinks, so
 * no chip can ride on another. The line shuts after they land. The caption and the handle dim while they fly.
 */
export function sendFrame(t: number): SendFrame {
  const fly = easeOut(clamp01(t / 0.55));
  return {
    away: 1 - fly,
    ghost: 1 - fly,
    line: clamp01((t - 0.65) / 0.25),
    hush: Math.min(clamp01(t / 0.05), 1 - clamp01((t - 0.5) / 0.1)),
  };
}
