/**
 * Everything the five scenes of the v4 demo read, derived once from a check
 * (the kit's or the visitor's own file): the timelines, the weeks the
 * scenes park on and finish at, and the numbers their sentences fill in.
 * Pure, so the kit's values are pinned in model.test.ts and an own file goes
 * through the same lines. Nothing here is written by hand for the kit: the
 * dates (31.03., 05.05., 28.07.) come from the cause note and the red runs.
 */
import { FENSTER, LERNEN, quantile7, type CheckResult, type Checker, type LampKey } from "./check";
import {
  baselinePin,
  bufferArgmin,
  bufferCost,
  causeBefore,
  chances,
  closerCounts,
  lampRuns,
  lampsSpanning,
  longestRun,
  planErrors,
  rangeSplit,
  redRuns,
  type LampRun,
  type Pin,
  type RangeSplit,
  type RedRun,
} from "./derive";

export interface Costs {
  readonly cu: number;
  readonly co: number;
}

export interface PlanModel {
  /** The 26 errors before the plan week, sorted. */
  readonly errors: readonly number[];
  readonly forecast: number;
  readonly week: string;
  /** The kit's order quantity (interpolated quantile, rounded half up). */
  readonly planzahl: number;
  /** The whole-jar buffer with the lowest cost over the 26 errors, and that cost. */
  readonly argmin: number;
  readonly argminCost: number;
  /** Cost with no buffer at all. */
  readonly zeroCost: number;
  /** cost(planzahl) minus cost(argmin), over the 26 errors. */
  readonly gap: number;
  readonly share: number;
}

export interface Model {
  readonly check: Checker;
  readonly result: CheckResult;
  /** The scored window on the timeline: every row from the first to the last week of the 52, gaps included. */
  readonly span: readonly number[];
  /** The 52 weeks of the rule strip, ending with the plan week. */
  readonly strip: readonly number[];
  readonly toolAccuracy: number | null;
  readonly ruleAccuracy: number | null;
  readonly wape: number | null;
  /** Percentage points between tool and rule, rounded to one decimal as shown. */
  readonly points: number | null;
  /** Mean absolute week-to-week change over the scored weeks, as a share of sales: the slope of scene 1's copy line. */
  readonly shiftSlope: number;
  readonly closer: { readonly tool: number; readonly rule: number; readonly ties: number };
  readonly pin: (Pin & { readonly ruleError: number; readonly forecastError: number }) | null;
  readonly longest: RedRun | null;
  readonly cause: Pin | null;
  readonly split: RangeSplit | null;
  readonly chance: { readonly year: number; readonly lamp: number };
  /** Scenes 3 and 5 start on this row (the week before the cause). */
  readonly park: number;
  /** Scene 3 is done at this row (four weeks after the cause). */
  readonly rangeDone: number;
  /** Scene 5 is done at this row (the first green week after the longest red run). */
  readonly ruleDone: number;
  readonly runs: Readonly<Record<LampKey, LampRun | null>>;
  /** The lamps red in every week of the longest run. */
  readonly spanning: readonly LampKey[];
  /** Weeks from the cause to the first red week of the longest run. */
  readonly lag: number | null;
  readonly plan: PlanModel | null;
}

function clampIndex(list: readonly number[], t: number): number {
  if (list.length === 0) return t;
  if (t <= (list[0] as number)) return list[0] as number;
  const last = list[list.length - 1] as number;
  return t >= last ? last : t;
}

function planModel(check: Checker, result: CheckResult, costs: Costs | null): PlanModel | null {
  const next = result.naechste;
  if (!costs || !next || next.planzahl === undefined || result.anteil === undefined) return null;
  const { errors } = planErrors(check, result);
  if (errors.length === 0) return null;
  const best = bufferArgmin(errors, costs.cu, costs.co);
  const planBuffer = next.planzahl - next.prognose;
  return {
    errors,
    forecast: next.prognose,
    week: next.woche,
    planzahl: next.planzahl,
    argmin: best.buffer,
    argminCost: best.cost,
    zeroCost: bufferCost(errors, costs.cu, costs.co, 0),
    gap: bufferCost(errors, costs.cu, costs.co, planBuffer) - best.cost,
    share: result.anteil,
  };
}

export function buildModel(check: Checker, result: CheckResult, costs: Costs | null): Model {
  const first = Math.max(0, check.letzte - FENSTER + 1);
  const span: number[] = [];
  for (let t = first; t <= check.letzte; t += 1) span.push(t);
  const tool = result.tabelle.Prognose;
  const rule = result.tabelle[result.messlatte];
  const toolAccuracy = tool ? 1 - tool.wape : null;
  const ruleAccuracy = rule ? 1 - rule.wape : null;
  const points = toolAccuracy !== null && ruleAccuracy !== null ? Math.round((toolAccuracy - ruleAccuracy) * 1000) / 10 : null;
  let moves = 0;
  let sales = 0;
  for (const t of check.wochen) {
    const ist = check.rows[t]!.ist as number;
    const before = check.rows[t - 1]?.ist;
    sales += ist;
    if (before !== null && before !== undefined) moves += Math.abs(before - ist);
  }
  const runs = redRuns(check);
  const longest = longestRun(runs);
  const cause = longest ? causeBefore(check, longest.from) : null;
  const park = clampIndex(span, cause ? cause.t - 1 : (span[Math.floor(span.length / 3)] ?? first));
  const rangeDone = clampIndex(span, cause ? cause.t + 4 : check.letzte);
  const ruleDone = clampIndex(check.streifen, longest ? longest.to + 1 : (check.streifen[check.streifen.length - 1] ?? check.letzte));
  return {
    check,
    result,
    span,
    strip: check.streifen,
    toolAccuracy,
    ruleAccuracy,
    wape: tool ? tool.wape : null,
    points,
    shiftSlope: sales > 0 ? moves / sales : 0,
    closer: closerCounts(check),
    pin: baselinePin(check),
    longest,
    cause,
    split: rangeSplit(check, cause),
    chance: chances(result),
    park,
    rangeDone: Math.max(rangeDone, park),
    ruleDone: Math.max(ruleDone, park),
    runs: lampRuns(check),
    spanning: longest ? lampsSpanning(check, longest) : [],
    lag: cause && longest ? longest.from - cause.t : null,
    plan: planModel(check, result, costs),
  };
}

/** Scene 1: the accuracy of the sales line copied s weeks later (0 = the sales themselves, 1 = the rule). */
export function shiftedAccuracy(model: Model, s: number): number {
  const clamped = Math.min(1, Math.max(0, s));
  return 1 - clamped * model.shiftSlope;
}

/** The scored weeks at or before row t: how many there are (the running tallies of scenes 2 and 3). */
export function scoredUpTo(check: Checker, t: number): number {
  let n = 0;
  for (const week of check.wochen) if (week <= t) n += 1;
  return n;
}

/** The scored weeks with a range at or before row t, and how many of them were hits. */
export function hitsUpTo(check: Checker, t: number): { readonly hits: number; readonly seen: number } {
  let hits = 0;
  let seen = 0;
  for (const week of check.wochen) {
    if (week > t) break;
    const hit = check.hit(week);
    if (hit === null) continue;
    seen += 1;
    if (hit) hits += 1;
  }
  return { hits, seen };
}

/** Scene 3: the sorted errors before row t and the two cut values of the range. */
export function sortedWindow(check: Checker, t: number): { readonly errors: readonly number[]; readonly low: number; readonly high: number } | null {
  const { errors } = check.errorsBefore(t, LERNEN);
  const band = check.band(t);
  if (!band) return null;
  return { errors: [...errors].sort((a, b) => a - b), low: band[0], high: band[1] };
}

/** Scene 4: the kit's buffer at a share of the sorted errors (the interpolated quantile). */
export function quantileBuffer(errors: readonly number[], share: number): number {
  return quantile7(errors, share);
}

/** The step a beat is done at, as a pure predicate on the playhead (scenes 2, 3 and 5). */
export function reached(playhead: number, target: number): boolean {
  return playhead >= target;
}
