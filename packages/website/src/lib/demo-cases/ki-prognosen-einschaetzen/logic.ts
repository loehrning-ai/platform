/**
 * Demo 01 "1.050 Stück, sieben Morgen": pure logic. No React, no DOM.
 *
 * The idea the split feedback teaches: under the cap, every split that keeps
 * each store at or below its median sells all 1.050 at median demand. A weak
 * split costs units above a median (they sit while another store turns
 * customers away) and uneven headroom (how far demand may fall below the
 * median before units are left over). The median split gives every store
 * about the same headroom, about 11 %.
 */
import {
  ASKS,
  CASE_SPLIT,
  DELIVERY_PER_MORNING,
  GATE,
  MEDIANS,
  MEDIAN_SPLIT,
  MORNINGS,
  MORNING_COUNT,
  OPTION_DELIVERY,
  PATTERN_TOLERANCE,
  PREORDERS,
  STORE_IDS,
  SUPPLY_CAP,
  CUSTOM_ROLE_MAX,
  type CheckKey,
  type DeliveryKind,
  type Morning,
  type OptionKey,
  type Outcome,
  type OwnerKey,
  type StoreId,
  type Triple,
} from "./data";

/* ─── Splits ──────────────────────────────────────────────────────────── */

/**
 * Splits `total` by `weights` with the largest-remainder method: the result
 * always sums to `total`, ties go to the earlier index. All-zero weights
 * split equally.
 */
export function splitBy(total: number, weights: readonly number[]): number[] {
  const safe = weights.map((weight) => (Number.isFinite(weight) && weight > 0 ? weight : 0));
  const sum = safe.reduce((acc, weight) => acc + weight, 0);
  const shares = sum > 0 ? safe : safe.map(() => 1);
  const shareSum = sum > 0 ? sum : shares.length;
  const exact = shares.map((weight) => (total * weight) / shareSum);
  const floors = exact.map((value) => Math.floor(value));
  let left = total - floors.reduce((acc, value) => acc + value, 0);
  const order = exact
    .map((value, index) => ({ index, rest: value - Math.floor(value) }))
    .sort((a, b) => b.rest - a.rest || a.index - b.index);
  const result = [...floors];
  for (const { index } of order) {
    if (left <= 0) break;
    result[index] = (result[index] ?? 0) + 1;
    left -= 1;
  }
  return result;
}

export function toTriple(values: readonly number[]): Triple {
  return [values[0] ?? 0, values[1] ?? 0, values[2] ?? 0];
}

export function sumOf(values: readonly number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

/** Clamps a typed or stepped value to a whole number in 0..1.050. */
export function clampUnits(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(SUPPLY_CAP, Math.max(0, Math.round(value)));
}

export type Pattern = "median" | "ask" | "preorders" | "equal" | "case" | "own";

export const PRESET_SPLITS: Readonly<Record<Exclude<Pattern, "own">, Triple>> = {
  median: MEDIAN_SPLIT,
  ask: toTriple(splitBy(SUPPLY_CAP, ASKS)),
  preorders: toTriple(splitBy(SUPPLY_CAP, PREORDERS)),
  equal: toTriple(splitBy(SUPPLY_CAP, [1, 1, 1])),
  case: CASE_SPLIT,
};

function within(alloc: Triple, reference: Triple, tolerance: number): boolean {
  return alloc.every((value, index) => Math.abs(value - (reference[index] ?? 0)) <= tolerance);
}

/** Names the rule a split follows: ±5 per store; "case" only exactly 500 / 370 / 180. */
export function detectPattern(alloc: Triple): Pattern {
  if (within(alloc, CASE_SPLIT, 0)) return "case";
  for (const pattern of ["median", "ask", "preorders", "equal"] as const) {
    if (within(alloc, PRESET_SPLITS[pattern], PATTERN_TOLERANCE)) return pattern;
  }
  return "own";
}

export interface Assessment {
  /** Units above a median: left over at median demand. */
  readonly unsoldAtMedian: number;
  readonly overMedian: Triple;
  /** Customers per store without a unit at median demand. */
  readonly shortAtMedian: Triple;
  /** All customers without a unit: 130 under any split, plus the unsold units. */
  readonly customersWithout: number;
  /** Allocation over median, per store. */
  readonly coverage: Triple;
  /** 1 - coverage: how far demand may fall below the median before units are left. */
  readonly headroom: Triple;
  readonly minHeadroomStore: number;
  readonly maxShortStore: number;
  readonly maxOverStore: number;
  readonly overAsk: readonly number[];
  /** Units moved away from the median split: sum |a - median split| / 2. */
  readonly movedFromMedianSplit: number;
  readonly pattern: Pattern;
}

function argMax(values: readonly number[]): number {
  let best = 0;
  values.forEach((value, index) => {
    if (value > (values[best] ?? -Infinity)) best = index;
  });
  return best;
}

function argMin(values: readonly number[]): number {
  let best = 0;
  values.forEach((value, index) => {
    if (value < (values[best] ?? Infinity)) best = index;
  });
  return best;
}

export function assessAllocation(alloc: Triple): Assessment {
  const overMedian = toTriple(alloc.map((value, i) => Math.max(0, value - (MEDIANS[i] ?? 0))));
  const shortAtMedian = toTriple(alloc.map((value, i) => Math.max(0, (MEDIANS[i] ?? 0) - value)));
  const coverage = toTriple(alloc.map((value, i) => value / (MEDIANS[i] ?? 1)));
  const headroom = toTriple(coverage.map((value) => 1 - value));
  const overAsk = alloc.flatMap((value, i) => (value > (ASKS[i] ?? Infinity) ? [i] : []));
  return {
    unsoldAtMedian: sumOf(overMedian),
    overMedian,
    shortAtMedian,
    customersWithout: sumOf(shortAtMedian),
    coverage,
    headroom,
    minHeadroomStore: argMin(headroom),
    maxShortStore: argMax(shortAtMedian),
    maxOverStore: argMax(overMedian),
    overAsk,
    movedFromMedianSplit:
      sumOf(alloc.map((value, i) => Math.abs(value - (MEDIAN_SPLIT[i] ?? 0)))) / 2,
    pattern: detectPattern(alloc),
  };
}

/** The pattern message of the split feedback, first match wins. */
export type SplitMessage =
  | { readonly kind: "equal"; readonly unsold: number; readonly coverageSmall: number; readonly coverageCentre: number; readonly shortCentre: number }
  | { readonly kind: "overAsk"; readonly store: number; readonly alloc: number; readonly ask: number; readonly left: number; readonly shortStore: number; readonly short: number }
  | { readonly kind: "overMedian"; readonly store: number; readonly over: number; readonly shortStore: number; readonly short: number }
  | { readonly kind: "case"; readonly headroomSmall: number; readonly headroomCentre: number }
  | { readonly kind: "median" }
  | { readonly kind: "ask"; readonly headroomSmall: number }
  | { readonly kind: "preorders"; readonly headroomCentre: number; readonly shortSmall: number }
  | { readonly kind: "own"; readonly store: number; readonly headroom: number };

/**
 * Equal shares come first: they also give the small town more than it asked
 * for, and the equal message says more than the generic over-ask one.
 */
export function splitMessage(alloc: Triple, assessment = assessAllocation(alloc)): SplitMessage {
  const a = assessment;
  if (a.pattern === "equal") {
    return {
      kind: "equal",
      unsold: a.unsoldAtMedian,
      coverageSmall: a.coverage[2],
      coverageCentre: a.coverage[0],
      shortCentre: a.shortAtMedian[0],
    };
  }
  if (a.overAsk.length > 0) {
    const store = a.overAsk.reduce((best, i) =>
      (alloc[i] ?? 0) - (ASKS[i] ?? 0) > (alloc[best] ?? 0) - (ASKS[best] ?? 0) ? i : best,
    );
    return {
      kind: "overAsk",
      store,
      alloc: alloc[store] ?? 0,
      ask: ASKS[store] ?? 0,
      left: a.overMedian[store] ?? 0,
      shortStore: a.maxShortStore,
      short: a.shortAtMedian[a.maxShortStore] ?? 0,
    };
  }
  if (a.unsoldAtMedian > 0) {
    return {
      kind: "overMedian",
      store: a.maxOverStore,
      over: a.overMedian[a.maxOverStore] ?? 0,
      shortStore: a.maxShortStore,
      short: a.shortAtMedian[a.maxShortStore] ?? 0,
    };
  }
  switch (a.pattern) {
    case "case":
      return { kind: "case", headroomSmall: a.headroom[2], headroomCentre: a.headroom[0] };
    case "median":
      return { kind: "median" };
    case "ask":
      return { kind: "ask", headroomSmall: a.headroom[2] };
    case "preorders":
      return { kind: "preorders", headroomCentre: a.headroom[0], shortSmall: a.shortAtMedian[2] };
    default:
      return { kind: "own", store: a.minHeadroomStore, headroom: a.headroom[a.minHeadroomStore] ?? 0 };
  }
}

/* ─── The gate ────────────────────────────────────────────────────────── */

export interface CheckResult {
  readonly key: CheckKey;
  readonly value: number;
  readonly pass: boolean;
}

/** The four checks as the machine runs them. Every limit is strict. */
export function gateChecks(morning: Pick<Morning, "freshHours" | "wape" | "bias" | "coverage">, gate = GATE): CheckResult[] {
  return [
    { key: "fresh", value: morning.freshHours, pass: morning.freshHours < gate.freshMaxHours },
    { key: "wape", value: morning.wape, pass: morning.wape < gate.wapeMax },
    { key: "bias", value: morning.bias, pass: Math.abs(morning.bias) < gate.absBiasMax },
    { key: "coverage", value: morning.coverage, pass: morning.coverage > gate.coverageMin },
  ];
}

export function isRed(morning: Morning): boolean {
  return gateChecks(morning).some((check) => !check.pass);
}

export function failedChecks(morning: Morning): CheckKey[] {
  return gateChecks(morning)
    .filter((check) => !check.pass)
    .map((check) => check.key);
}

/** Median-share-weighted store bias: the country bias the board shows. */
export function countryBias(storeBias: Triple): number {
  const total = sumOf(MEDIANS);
  return sumOf(storeBias.map((bias, i) => (bias * (MEDIANS[i] ?? 0)) / total));
}

/** What ships on a hold morning: the morning's 50 by the standing plan. */
export function standingDelivery(plan: Triple): Triple {
  return toTriple(splitBy(DELIVERY_PER_MORNING, plan));
}

/** The model's plan: the 50 by its refreshed medians, median x (1 + store bias). */
export function modelDelivery(morning: Morning): Triple {
  return toTriple(
    splitBy(
      DELIVERY_PER_MORNING,
      MEDIANS.map((median, i) => median * (1 + (morning.storeBias[i] ?? 0))),
    ),
  );
}

/** The 50 by the plain median split: 23 / 17 / 10. */
export const MEDIAN_DELIVERY: Triple = toTriple(splitBy(DELIVERY_PER_MORNING, MEDIANS));

/** True when a delivery differs from 23 / 17 / 10 by 2 or more units at a store. */
export function deviatesFromMedian(delivery: Triple): boolean {
  return delivery.some((units, i) => Math.abs(units - (MEDIAN_DELIVERY[i] ?? 0)) >= 2);
}

/* ─── Grading ─────────────────────────────────────────────────────────── */

export type StampKey = "rightRelease" | "rightHold" | "rightAction" | "missed" | "needless" | "wrongStep";

export interface Grade {
  readonly day: number;
  readonly option: OptionKey;
  readonly outcome: Outcome;
  readonly stamp: StampKey;
  readonly right: OptionKey;
  readonly delivery: { readonly kind: DeliveryKind; readonly units?: Triple };
}

export function rightOption(morning: Morning): OptionKey {
  const right = morning.options.find((option) => morning.grade[option] === "right");
  if (!right) throw new Error(`Morning ${morning.day} has no right option.`);
  return right;
}

function stampFor(morning: Morning, outcome: Outcome): StampKey {
  if (outcome !== "right") return outcome;
  if (isRed(morning)) return "rightAction";
  return OPTION_DELIVERY[rightOption(morning)] === "model" ? "rightRelease" : "rightHold";
}

export function gradeMorning(morning: Morning, option: OptionKey, plan: Triple): Grade {
  const outcome = morning.grade[option];
  if (!outcome || !morning.options.includes(option)) {
    throw new Error(`Option ${option} is not offered on morning ${morning.day}.`);
  }
  const kind = OPTION_DELIVERY[option];
  const units =
    kind === "model" ? modelDelivery(morning) : kind === "standing" ? standingDelivery(plan) : undefined;
  return {
    day: morning.day,
    option,
    outcome,
    stamp: stampFor(morning, outcome),
    right: rightOption(morning),
    delivery: units ? { kind, units } : { kind },
  };
}

export interface WeekSummary {
  readonly right: number;
  readonly missed: readonly number[];
  readonly needless: readonly number[];
  readonly wrongStep: readonly number[];
  /** Mornings on which the standing plan shipped. */
  readonly holdDays: number;
  /** The store whose hold-day total differs most from the median split, if by 2 or more. */
  readonly deviation?: { readonly store: number; readonly got: number; readonly median: number };
}

export function summarizeWeek(answers: readonly (OptionKey | null)[], plan: Triple): WeekSummary {
  const grades = MORNINGS.flatMap((morning, i) => {
    const option = answers[i];
    return option ? [gradeMorning(morning, option, plan)] : [];
  });
  const daysWith = (outcome: Outcome) =>
    grades.filter((grade) => grade.outcome === outcome).map((grade) => grade.day);
  const holdDays = grades.filter((grade) => grade.delivery.kind === "standing").length;
  const got = toTriple(standingDelivery(plan).map((units) => units * holdDays));
  const median = toTriple(MEDIAN_DELIVERY.map((units) => units * holdDays));
  const gaps = got.map((units, i) => Math.abs(units - (median[i] ?? 0)));
  const store = argMax(gaps);
  const deviation =
    holdDays > 0 && (gaps[store] ?? 0) >= 2
      ? { store, got: got[store] ?? 0, median: median[store] ?? 0 }
      : undefined;
  return {
    right: daysWith("right").length,
    missed: daysWith("missed"),
    needless: daysWith("needless"),
    wrongStep: daysWith("wrongStep"),
    holdDays,
    ...(deviation ? { deviation } : {}),
  };
}

/* ─── Owner ───────────────────────────────────────────────────────────── */

export interface Owner {
  readonly key: OwnerKey;
  /** The own role, trimmed to 40 characters; empty for the other keys. */
  readonly custom: string;
}

export function trimRole(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, CUSTOM_ROLE_MAX).trim();
}

/** A named on-duty role or an own role starts the mornings; the other two do not. */
export function ownerAccepted(owner: Owner | null): boolean {
  if (!owner) return false;
  if (owner.key === "plannerOnDuty") return true;
  return owner.key === "custom" && trimRole(owner.custom).length > 0;
}

/* ─── State ───────────────────────────────────────────────────────────── */

export type Step = "split" | "mornings" | "result";
export type PlanSource = "own" | "median" | "fallback";

export interface DemoState {
  readonly step: Step;
  readonly alloc: Triple;
  /** "Prüfen" has run at least once on the current split. */
  readonly checked: boolean;
  readonly plan: Triple | null;
  readonly planSource: PlanSource | null;
  /** The split the participant checked last before moving on (null on direct entry). */
  readonly opening: Triple | null;
  readonly owner: Owner | null;
  /** The mornings have started: the owner is fixed. */
  readonly ownerLocked: boolean;
  /** Index of the morning on screen, 0..6. */
  readonly day: number;
  readonly answers: readonly (OptionKey | null)[];
}

export const INITIAL_STATE: DemoState = {
  step: "split",
  alloc: [0, 0, 0],
  checked: false,
  plan: null,
  planSource: null,
  opening: null,
  owner: null,
  ownerLocked: false,
  day: 0,
  answers: Array.from({ length: MORNING_COUNT }, () => null),
};

export type DemoAction =
  | { readonly type: "SET_UNITS"; readonly store: number; readonly value: number }
  | { readonly type: "APPLY_PRESET"; readonly pattern: Exclude<Pattern, "own"> }
  | { readonly type: "CHECK" }
  | { readonly type: "CONTINUE"; readonly with: "own" | "median" }
  | { readonly type: "ENTER_MORNINGS" }
  | { readonly type: "PICK_OWNER"; readonly owner: Owner }
  | { readonly type: "START_MORNINGS" }
  | { readonly type: "ANSWER"; readonly day: number; readonly option: OptionKey }
  | { readonly type: "NEXT" }
  | { readonly type: "RESTART" }
  | { readonly type: "HYDRATE"; readonly state: DemoState };

function replaceAt<T>(values: readonly T[], index: number, value: T): T[] {
  return values.map((current, i) => (i === index ? value : current));
}

/**
 * The one reducer. There are no back-edit actions: once a step is left, its
 * values are fixed until RESTART, so no downstream value can go stale.
 */
export function reducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "SET_UNITS": {
      if (state.step !== "split" || action.store < 0 || action.store > 2) return state;
      return { ...state, alloc: toTriple(replaceAt(state.alloc, action.store, clampUnits(action.value))) };
    }
    case "APPLY_PRESET": {
      if (state.step !== "split" || !state.checked) return state;
      return { ...state, alloc: PRESET_SPLITS[action.pattern] };
    }
    case "CHECK": {
      if (state.step !== "split" || sumOf(state.alloc) !== SUPPLY_CAP) return state;
      return { ...state, checked: true };
    }
    case "CONTINUE": {
      if (state.step !== "split" || !state.checked) return state;
      if (action.with === "own" && sumOf(state.alloc) !== SUPPLY_CAP) return state;
      const plan = action.with === "own" ? state.alloc : MEDIAN_SPLIT;
      return {
        ...state,
        step: "mornings",
        plan,
        planSource: action.with === "own" ? "own" : "median",
        opening: sumOf(state.alloc) === SUPPLY_CAP ? state.alloc : null,
      };
    }
    case "ENTER_MORNINGS": {
      if (state.step !== "split") return state;
      return {
        ...INITIAL_STATE,
        step: "mornings",
        alloc: MEDIAN_SPLIT,
        plan: MEDIAN_SPLIT,
        planSource: "fallback",
      };
    }
    case "PICK_OWNER": {
      if (state.step !== "mornings" || state.ownerLocked) return state;
      const custom = action.owner.key === "custom" ? trimRole(action.owner.custom) : "";
      return { ...state, owner: { key: action.owner.key, custom } };
    }
    case "START_MORNINGS": {
      if (state.step !== "mornings" || state.ownerLocked || !ownerAccepted(state.owner)) return state;
      return { ...state, ownerLocked: true, day: 0 };
    }
    case "ANSWER": {
      const morning = MORNINGS[action.day];
      if (
        state.step !== "mornings" ||
        !state.ownerLocked ||
        action.day !== state.day ||
        !morning ||
        state.answers[action.day] !== null ||
        !morning.options.includes(action.option)
      ) {
        return state;
      }
      return { ...state, answers: replaceAt(state.answers, action.day, action.option) };
    }
    case "NEXT": {
      if (state.step !== "mornings" || state.answers[state.day] == null) return state;
      if (state.day >= MORNING_COUNT - 1) return { ...state, step: "result" };
      return { ...state, day: state.day + 1 };
    }
    case "RESTART":
      return INITIAL_STATE;
    case "HYDRATE":
      return action.state;
    default:
      return state;
  }
}

/** The plan in force: the standing plan once set, else the median split. */
export function planOf(state: DemoState): Triple {
  return state.plan ?? MEDIAN_SPLIT;
}

export { STORE_IDS };
export type { StoreId };
