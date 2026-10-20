/**
 * Pure helpers for the figure engine: scales, ticks, Wilson interval, seeded
 * randomness, easing and a closed-form spring. No state, no unseeded
 * randomness, no clock. The ideas (scaleLinear, scaleBand, niceTicks, mulberry32, spring) were
 * written down independently for this engine; nothing is imported from outside.
 */

export const clamp = (x: number, a = 0, b = 1): number =>
  Math.min(b, Math.max(a, x));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Round to 2 decimals, the precision of every coordinate we write. */
export const r2 = (x: number): number => Math.round(x * 100) / 100;

/* ----------------------------------------------------------------- scales */

export interface LinearScale {
  (v: number): number;
  readonly domain: readonly [number, number];
  readonly range: readonly [number, number];
  invert(px: number): number;
}

export function scaleLinear(
  domain: readonly [number, number],
  range: readonly [number, number],
): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const fn = ((v: number) =>
    span === 0 ? r0 : r0 + ((v - d0) / span) * (r1 - r0)) as LinearScale;
  const invert = (px: number) =>
    r1 === r0 ? d0 : d0 + ((px - r0) / (r1 - r0)) * span;
  return Object.assign(fn, { domain, range, invert });
}

/** Log10 scale; domain values must be positive. */
export function scaleLog(
  domain: readonly [number, number],
  range: readonly [number, number],
): LinearScale {
  if (domain[0] <= 0 || domain[1] <= 0) {
    throw new RangeError("scaleLog needs a positive domain");
  }
  const lin = scaleLinear(
    [Math.log10(domain[0]), Math.log10(domain[1])],
    range,
  );
  const fn = ((v: number) => lin(Math.log10(Math.max(v, domain[0])))) as LinearScale;
  const invert = (px: number) => 10 ** lin.invert(px);
  return Object.assign(fn, { domain, range, invert });
}

export interface BandScale {
  /** Start of band i. */
  pos(i: number): number;
  readonly bandwidth: number;
  readonly step: number;
}

/** n bands in [r0, r1]; padding is the share of a step left empty (0 to 1). */
export function scaleBand(
  count: number,
  range: readonly [number, number],
  padding = 0.2,
): BandScale {
  const n = Math.max(1, count);
  const [r0, r1] = range;
  const step = (r1 - r0) / n;
  const bandwidth = step * (1 - padding);
  return {
    pos: (i: number) => r0 + step * i + (step - bandwidth) / 2,
    bandwidth,
    step,
  };
}

/** Round-number ticks covering [min, max], about `count` of them. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min, min + 1];
  const raw = (max - min) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step * 1e-9; v += step) {
    out.push(Math.round(v / step) * step);
  }
  return out;
}

/** 1-2-5 ticks for a log axis, inside [min, max] (both positive). */
export function logTicks(min: number, max: number): number[] {
  const out: number[] = [];
  const first = Math.floor(Math.log10(min));
  const last = Math.ceil(Math.log10(max));
  for (let e = first; e <= last; e += 1) {
    for (const m of [1, 2, 5]) {
      const v = m * 10 ** e;
      if (v >= min * (1 - 1e-9) && v <= max * (1 + 1e-9)) out.push(v);
    }
  }
  return out;
}

/** Smallest 1-2-5 extent [lo, hi] on a log axis that covers min and max. */
export function logExtent(min: number, max: number): [number, number] {
  const ladder: number[] = [];
  for (let e = Math.floor(Math.log10(min)) - 1; e <= Math.ceil(Math.log10(max)) + 1; e += 1) {
    for (const m of [1, 2, 5]) ladder.push(m * 10 ** e);
  }
  const lo = [...ladder].reverse().find((v) => v <= min * (1 + 1e-9)) ?? min;
  const hi = ladder.find((v) => v >= max * (1 - 1e-9)) ?? max;
  return [lo, hi];
}

/* ---------------------------------------------------------------- statistics */

export interface Interval {
  readonly p: number;
  readonly lo: number;
  readonly hi: number;
}

/** Wilson score interval for hits out of n; shares in 0 to 1. null when n < 1. */
export function wilson(hits: number, n: number, z = 1.959964): Interval | null {
  if (!(n >= 1) || hits < 0 || hits > n) return null;
  const p = hits / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return { p, lo: Math.max(0, centre - half), hi: Math.min(1, centre + half) };
}

/** z for the two-sided coverage values the funnel plot accepts. */
export const COVERAGE_Z: Readonly<Record<string, number>> = {
  "90": 1.644854,
  "95": 1.959964,
  "99": 2.575829,
  "99.8": 3.090232,
};

export function zForCoverage(coverage: number): number {
  const z = COVERAGE_Z[String(coverage)];
  if (z === undefined) {
    throw new RangeError(`Unsupported coverage ${coverage}; use 90, 95, 99 or 99.8`);
  }
  return z;
}

/** Normal-approximation funnel limits for a rate p (0 to 1) at sample size n. */
export function funnelLimits(p: number, n: number, z: number): [number, number] {
  const se = Math.sqrt((p * (1 - p)) / n);
  return [Math.max(0, p - z * se), Math.min(1, p + z * se)];
}

/* ------------------------------------------------------------------ random */

/** mulberry32: deterministic generator, same sequence on server and client. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash of a string, for seeds. */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Stable offset in a disc of the given radius for element `index`. */
export function jitterOffset(
  seed: number,
  index: number,
  radius: number,
): readonly [number, number] {
  const rand = mulberry32((seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0);
  const angle = rand() * Math.PI * 2;
  const dist = Math.sqrt(rand()) * radius;
  return [Math.cos(angle) * dist, Math.sin(angle) * dist];
}

/* ------------------------------------------------------------------ easing */

export const easeOutCubic = (t: number): number => 1 - (1 - clamp(t)) ** 3;
export const easeOutQuart = (t: number): number => 1 - (1 - clamp(t)) ** 4;
export const easeInOutCubic = (t: number): number => {
  const p = clamp(t);
  return p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
};

/** Spring presets as [stiffness, damping]. */
export const SPRINGS = {
  soft: [140, 14],
  med: [300, 30],
  stiff: [600, 48],
  snap: [900, 40],
} as const;

export type SpringName = keyof typeof SPRINGS;

/** Closed-form damped spring from 0 towards 1 at time t (seconds). */
export function spring(t: number, k = 170, d = 26): number {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k);
  const z = d / (2 * w0);
  if (z < 1) {
    const wd = w0 * Math.sqrt(1 - z * z);
    return (
      1 -
      Math.exp(-z * w0 * t) *
        (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t))
    );
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}

const SETTLE_SECONDS = 1.2;

/**
 * A spring as an easing of progress: 0 at 0, exactly 1 at 1 and from 1 on.
 * It may overshoot 1 a little in between, so use it for position, never for
 * opacity.
 */
export function springEase(progress: number, name: SpringName = "med"): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  const [k, d] = SPRINGS[name];
  return spring(progress * SETTLE_SECONDS, k, d);
}
