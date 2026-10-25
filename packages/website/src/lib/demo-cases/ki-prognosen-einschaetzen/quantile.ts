import type { CaseWeek } from "./case";

/** A forecast range: p10 below p50 below p90. */
export interface Band {
  readonly p10: number;
  readonly p50: number;
  readonly p90: number;
}

/** The number of equally likely scenarios every statistic is computed on. */
export const SCENARIOS = 100;

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

/**
 * Piecewise linear quantile through (0.1, p10), (0.5, p50), (0.9, p90), the
 * two slopes continued into both tails (the dashed extension), floored at 0.
 * This is an assumption, not a measurement; the demo says so on screen.
 */
export function quantile(band: Band, u: number): number {
  const slope =
    u < 0.5 ? (band.p50 - band.p10) / 0.4 : (band.p90 - band.p50) / 0.4;
  return Math.max(0, band.p50 + (u - 0.5) * slope);
}

/** 100 samples, ascending: sample k sits at u = (k + 0.5) / 100. */
export function scenarios(band: Band): readonly number[] {
  return Array.from({ length: SCENARIOS }, (_, k) =>
    quantile(band, (k + 0.5) / SCENARIOS),
  );
}

/** Samples above the cap among the first `visible` ones: the weeks the stock is not enough. */
export function shortCount(
  samples: readonly number[],
  cap: number,
  visible = samples.length,
): number {
  let count = 0;
  for (let k = 0; k < Math.min(visible, samples.length); k += 1) {
    if ((samples[k] as number) > cap) count += 1;
  }
  return count;
}

export interface Stats {
  readonly cap: number;
  /** Scenarios with demand above the cap, 0..100. */
  readonly short: number;
  /** Mean missing units over all 100 scenarios (0 where the stock is enough). */
  readonly avgShort: number;
  /** Mean leftover units over all 100 scenarios. */
  readonly avgLeft: number;
  /** Q(r / (1 + r)): the newsvendor plan number when a missed sale weighs r leftovers. */
  readonly optimum: number;
  /** round(100 * r / (1 + r)) */
  readonly optimumPct: number;
  /** Scenarios above the cap if the cap were the forecast median. */
  readonly shortAtP50: number;
}

export function computeStats(
  samples: readonly number[],
  cap: number,
  ratio: number,
  band: Band,
): Stats {
  let missing = 0;
  let left = 0;
  for (const sample of samples) {
    missing += Math.max(0, sample - cap);
    left += Math.max(0, cap - sample);
  }
  const u = clamp(ratio / (1 + ratio), 0.005, 0.995);
  return {
    cap,
    short: shortCount(samples, cap),
    avgShort: missing / samples.length,
    avgLeft: left / samples.length,
    optimum: quantile(band, u),
    optimumPct: Math.round((100 * ratio) / (1 + ratio)),
    shortAtP50: shortCount(samples, band.p50),
  };
}

/** The point on a forecast week fractional index w (0..6), interpolated linearly. */
export interface WeekPoint extends Band {
  readonly request: number;
}

export function interpolateBand(
  weeks: readonly CaseWeek[],
  w: number,
): WeekPoint {
  const at = clamp(w, 0, weeks.length - 1);
  const low = Math.floor(at);
  const high = Math.min(weeks.length - 1, Math.ceil(at));
  const from = weeks[low] as CaseWeek;
  const to = weeks[high] as CaseWeek;
  const f = at - low;
  const mix = (a: number, b: number) => a + (b - a) * f;
  return {
    p10: mix(from.p10, to.p10),
    p50: mix(from.p50, to.p50),
    p90: mix(from.p90, to.p90),
    request: mix(from.request, to.request),
  };
}

/**
 * The y axis. The workshop case passes a fixed domain; an own case gets one
 * from its numbers (rounded to hundreds, at least 200 wide). It does not
 * start at 0, so the chart draws an "Achse ab" tag.
 */
export function axisDomain(
  samples: readonly number[],
  supply: number,
  request?: number,
): readonly [number, number] {
  const low = Math.min(samples[0] as number, supply);
  const high = Math.max(
    samples[samples.length - 1] as number,
    supply,
    request ?? 0,
  );
  const lo = Math.max(0, Math.floor((low * 0.9) / 100) * 100);
  let hi = Math.ceil((high * 1.05) / 100) * 100;
  if (hi - lo < 200) hi = lo + 200;
  return [lo, hi];
}
