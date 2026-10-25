/**
 * What the stage points at, derived from a check instead of written down:
 * the week the pin explains in the baseline beat, the date the range breaks,
 * the red runs of the rule strip and the running tallies of the replay. Pure,
 * so the kit's numbers and a visitor's file go through the same lines
 * (derive.test.ts pins the kit's values).
 */
import { binomialAtMost, LAMP_KEYS, PRUEF, TREFFER_MIN, type Checker, type CheckResult, type LampKey } from "./check";

export interface Pin {
  readonly t: number;
  readonly woche: string;
  readonly note: string;
}

/** The scored week with a note where the forecast beat the rule by the widest margin (the promotion in the kit). */
export function baselinePin(check: Checker): (Pin & { readonly ruleError: number; readonly forecastError: number }) | null {
  let best: { t: number; gain: number } | null = null;
  for (const t of check.wochen) {
    const row = check.rows[t];
    const forecast = check.forecast(t);
    const rule = check.rule(t);
    if (!row || !row.hinweis || row.ist === null || forecast === null || rule === null) continue;
    const gain = Math.abs(rule - row.ist) - Math.abs(forecast - row.ist);
    if (!best || gain > best.gain) best = { t, gain };
  }
  if (!best || best.gain <= 0) return null;
  const row = check.rows[best.t]!;
  return {
    t: best.t,
    woche: row.woche,
    note: row.hinweis,
    ruleError: Math.round(Math.abs((check.rule(best.t) as number) - (row.ist as number))),
    forecastError: Math.round(Math.abs((check.forecast(best.t) as number) - (row.ist as number))),
  };
}

export interface RedRun {
  readonly from: number;
  readonly to: number;
  /** The lamps that were red in every week of the run. */
  readonly lamps: readonly LampKey[];
  /** Lamps red in only some weeks of the run, with those weeks. */
  readonly extra: readonly { readonly key: LampKey; readonly weeks: readonly number[] }[];
}

/**
 * The red weeks of the strip as runs of consecutive strip weeks. A run names
 * the lamps red in all of its weeks and, apart, a lamp red only in some, so
 * a sentence never claims a lamp was red where it was green.
 */
export function redRuns(check: Checker): readonly RedRun[] {
  const runs: { from: number; to: number; weeks: { t: number; red: readonly LampKey[] }[] }[] = [];
  for (const t of check.streifen) {
    const lamps = check.lamps(t);
    if (!lamps || lamps.frei) continue;
    const red = LAMP_KEYS.filter((key) => lamps[key] === false);
    const last = runs[runs.length - 1];
    if (last && last.to === t - 1) {
      last.to = t;
      last.weeks.push({ t, red });
    } else runs.push({ from: t, to: t, weeks: [{ t, red }] });
  }
  return runs.map((run) => {
    const always = LAMP_KEYS.filter((key) => run.weeks.every((week) => week.red.includes(key)));
    const extra = LAMP_KEYS.filter((key) => !always.includes(key))
      .map((key) => ({ key, weeks: run.weeks.filter((week) => week.red.includes(key)).map((week) => week.t) }))
      .filter((entry) => entry.weeks.length > 0);
    return { from: run.from, to: run.to, lamps: always, extra };
  });
}

/** Why the data lamp of week t is red: no stored forecast, or no actual the week before. */
export function dataGap(check: Checker, t: number): "prognose" | "ist" {
  return check.forecast(t) === null ? "prognose" : "ist";
}

/** The longest red run (the first on a tie). */
export function longestRun(runs: readonly RedRun[]): RedRun | null {
  let best: RedRun | null = null;
  for (const run of runs) if (!best || run.to - run.from > best.to - best.from) best = run;
  return best;
}

/** The latest week with a note (not a sell-out) at or before t: the cause the rule reacts to. */
export function causeBefore(check: Checker, t: number): Pin | null {
  for (let k = t; k >= 0; k -= 1) {
    const row = check.rows[k];
    if (row && row.hinweis && !row.zensiert) return { t: k, woche: row.woche, note: row.hinweis };
  }
  return null;
}

export interface RangeSplit {
  readonly cause: Pin;
  readonly before: { readonly hits: number; readonly weeks: number };
  readonly after: { readonly hits: number; readonly weeks: number };
  readonly misses: number;
  readonly missesAfter: number;
}

/** Range hits before and from the cause week, over the scored weeks that have a range. */
export function rangeSplit(check: Checker, cause: Pin | null): RangeSplit | null {
  if (!cause) return null;
  const scored = check.wochen.filter((t) => check.hit(t) !== null);
  const before = scored.filter((t) => t < cause.t);
  const after = scored.filter((t) => t >= cause.t);
  const hits = (weeks: readonly number[]) => weeks.filter((t) => check.hit(t) === true).length;
  if (before.length === 0 || after.length === 0) return null;
  return {
    cause,
    before: { hits: hits(before), weeks: before.length },
    after: { hits: hits(after), weeks: after.length },
    misses: scored.length - hits(scored),
    missesAfter: after.length - hits(after),
  };
}

/** Mean absolute error of the forecast and the rule over the first n scored weeks (the replay's tally). */
export function runningMeans(check: Checker, n: number): { readonly forecast: number; readonly rule: number } {
  const weeks = check.wochen.slice(0, Math.max(0, n));
  if (weeks.length === 0) return { forecast: 0, rule: 0 };
  let f = 0;
  let r = 0;
  for (const t of weeks) {
    const ist = check.rows[t]!.ist as number;
    f += Math.abs((check.forecast(t) as number) - ist);
    r += Math.abs((check.rule(t) as number) - ist);
  }
  return { forecast: f / weeks.length, rule: r / weeks.length };
}

/** Range hits over the first n scored weeks that have a range. */
export function runningHits(check: Checker, n: number): number {
  return check.wochen
    .filter((t) => check.hit(t) !== null)
    .slice(0, Math.max(0, n))
    .filter((t) => check.hit(t) === true).length;
}

/** The chance lines: an honest 80 % range at or under the observed hits, and under the 9-of-13 lamp. */
export function chances(result: CheckResult): { readonly year: number; readonly lamp: number } {
  return {
    year: binomialAtMost(result.spanne_treffer, result.spanne_wochen, 0.8),
    lamp: binomialAtMost(TREFFER_MIN - 1, PRUEF, 0.8),
  };
}

/** The 26 errors the planning number is read from, sorted, and the buffer the costs pick. */
export function planErrors(check: Checker, result: CheckResult): { readonly errors: readonly number[]; readonly buffer: number | null } {
  if (check.naechste === null) return { errors: [], buffer: null };
  const errors = [...check.errorsBefore(check.naechste, 26).errors].sort((a, b) => a - b);
  const next = result.naechste;
  const buffer = next?.planzahl !== undefined ? next.planzahl - next.prognose : null;
  return { errors, buffer };
}
