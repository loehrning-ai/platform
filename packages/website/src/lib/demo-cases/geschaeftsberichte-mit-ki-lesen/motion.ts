import { REPORT_CUT } from "./data";
import { clamp } from "./logic";

/**
 * Motion as pure functions of progress. Every drawn frame is
 * render(scene): no state hides in elements, so seeking to any value twice
 * gives the same picture. The only clock is one rAF driver in use-scene.ts.
 */
export const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
export const norm = (p: number, from: number, to: number) => clamp((p - from) / (to - from), 0, 1);
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const smoothstep = (a: number, b: number, x: number) => {
  const t = norm(x, a, b);
  return t * t * (3 - 2 * t);
};

/** Everything a frame needs. `cutF` is a float between snapped cuts, `m` 0 = total, 1 = per week, `u` 0 = count, 1 = per 1.000. */
export interface Scene {
  readonly cutF: number;
  readonly m: number;
  readonly u: number;
  /** 0 = nine columns on the baseline, 1 = the two month towers. */
  readonly s: number;
  /** Columns risen, 0..1 (staggered per column in geometry). */
  readonly rise: number;
  /** One handle pulse, 0..1..0. */
  readonly pulse: number;
  /** A short flash around week 5 while it changes side, 0..1..0. */
  readonly flash: number;
  /** Intro clock in seconds while it plays, null after it. */
  readonly clock: number | null;
  /** The cut-5 tick has landed on the ruler. */
  readonly tick5: boolean;
  /** 0..1 while the question "Stimmt das?" is flashed beside the number (the -20 % beat of the first pass). */
  readonly ask: number;
}

/**
 * The first frame, also what the server renders and what reduced motion keeps
 * until the first input: the nine weeks as columns, report cut 4 | 5, +26 %.
 * It is the hub tile's picture, so tile and stage are one demo.
 */
export const HERO_SCENE: Scene = {
  cutF: REPORT_CUT,
  m: 0,
  u: 0,
  s: 0,
  rise: 1,
  pulse: 0,
  flash: 0,
  clock: null,
  tick5: false,
  ask: 0,
};

/** The settled state once the visitor has the line: total view, report cut, the weeks stacked into two towers. */
export const END_SCENE: Scene = { ...HERO_SCENE, s: 1, tick5: true };

/** Seconds the first-run pass takes. */
export const INTRO_SECONDS = 4.2;

/** Overshoot ease for the spring back: lands on 1, swings a little past it first. */
const easeOutBack = (t: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

const bump = (t: number, from: number, to: number) => {
  const x = norm(t, from, to);
  return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x);
};

/**
 * The first pass, seek-driven, starting on the hero (nine columns, +26 %):
 *   0.0 to 0.5  the picture stands, so it can be read
 *   0.5 to 1.1  the line steps one column right; week 5 flashes and takes the
 *               other colour; the number rolls to -20 %
 *   1.1 to 2.3  -20 % stands, the question lights up beside it
 *   2.3 to 2.9  the line springs back; week 5 flips back; +26 %
 *   2.9 to 3.7  the nine columns gather into the two month towers (the totals)
 *   3.7 to 4.2  the handle pulses once: yours now
 * Any touch jumps to the settled state. Pure function of the clock.
 */
export function introScene(seconds: number): Scene {
  const t = clamp(seconds, 0, INTRO_SECONDS);
  const step = easeOut(norm(t, 0.5, 0.95));
  const back = easeOutBack(norm(t, 2.3, 2.8));
  const cutF = t < 2.3 ? REPORT_CUT + step : REPORT_CUT + 1 - back;
  const flash = Math.max(bump(t, 0.6, 1.1), bump(t, 2.35, 2.85));
  const stack = easeInOut(norm(t, 2.9, 3.7));
  return {
    cutF,
    m: 0,
    u: 0,
    s: stack,
    rise: 1,
    pulse: bump(t, 3.7, INTRO_SECONDS),
    flash,
    clock: t >= INTRO_SECONDS ? null : t,
    tick5: t >= 0.95,
    ask: smoothstep(0.9, 1.2, t) * (1 - smoothstep(2.3, 2.6, t)),
  };
}

/** A per-cut value (headline, per week) at a float cut: eased between the two neighbouring cuts. */
export function atCut(valueOf: (k: number) => number, cutF: number): number {
  const low = Math.floor(cutF);
  const frac = cutF - low;
  if (frac < 1e-9) return valueOf(low);
  return lerp(valueOf(low), valueOf(low + 1), easeInOut(frac));
}

/** Total view to per-week view, eased, for numbers and the ruler. */
export const blend = (m: number) => easeInOut(clamp(m, 0, 1));
