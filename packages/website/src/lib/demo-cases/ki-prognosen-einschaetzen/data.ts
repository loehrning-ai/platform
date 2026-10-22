/**
 * Demo 01 "1.050 Stück, sieben Morgen": the case data.
 *
 * Case values come from the Workshop 01 launch case
 * (public/workshops/ki-prognosen-einschaetzen/case-study/index.html): asks,
 * preorders and medians per store, the 1.050 cap, the four daily checks and
 * morning 1's board. Values marked [demo] are invented for this exercise:
 * the store names, the delivery cadence, mornings 2 to 7 and the window of
 * the range check. Names live in copy.ts.
 */

export const STORE_IDS = ["zentrum", "stadtrand", "kleinstadt"] as const;
export type StoreId = (typeof STORE_IDS)[number];

/** Three numbers in store order: Zentrum, Stadtrand, Kleinstadt. */
export type Triple = readonly [number, number, number];

export interface Store {
  readonly id: StoreId;
  /** What the store asked for. */
  readonly ask: number;
  /** Firm customer preorders: the earliest signal. */
  readonly preorders: number;
  /** The model's estimated demand (p50). */
  readonly median: number;
}

export const SUPPLY_CAP = 1050;

export const STORES: readonly Store[] = [
  { id: "zentrum", ask: 610, preorders: 392, median: 540 },
  { id: "stadtrand", ask: 470, preorders: 288, median: 410 },
  { id: "kleinstadt", ask: 290, preorders: 121, median: 230 },
];

export const ASKS: Triple = [610, 470, 290];
export const PREORDERS: Triple = [392, 288, 121];
export const MEDIANS: Triple = [540, 410, 230];

export const TOTAL_ASK = 1370;
export const TOTAL_MEDIAN = 1180;
/** Asked for and missing: stays visible to everyone. */
export const ASK_OVER_CAP = TOTAL_ASK - SUPPLY_CAP;
/** Customers without a unit at median demand under any split. */
export const UNAVOIDABLE_SHORT = TOTAL_MEDIAN - SUPPLY_CAP;

/** The split the case chart shows (sdmStores). */
export const CASE_SPLIT: Triple = [500, 370, 180];
/** The split by median, largest remainder: splitBy(1050, MEDIANS). */
export const MEDIAN_SPLIT: Triple = [480, 365, 205];

/** [demo] The launch week received 700 units by the standing plan. */
export const LAUNCH_WEEK_UNITS = 700;
/** [demo] Week 2 brings one delivery of 50 per morning: 700 + 7 x 50 = 1.050. */
export const DELIVERY_PER_MORNING = 50;
export const MORNING_COUNT = 7;

/** The daily gate as the case writes it. Every limit is strict. */
export const GATE = {
  freshMaxHours: 2,
  wapeMax: 0.14,
  absBiasMax: 0.05,
  coverageMin: 0.8,
} as const;

export const CHECK_KEYS = ["fresh", "wape", "bias", "coverage"] as const;
export type CheckKey = (typeof CHECK_KEYS)[number];

export const OPTION_KEYS = [
  "release",
  "holdUnknown",
  "holdNearLimit",
  "releaseOthersGreen",
  "waitRefresh",
  "retrain",
  "releaseBestWape",
  "overrideReportBias",
  "waitFresh",
  "releaseMedianFine",
  "overrideAskWhy",
  "lowerLimit",
  "retrainRaw",
  "overrideReconstruct",
  "releaseAnyway",
] as const;
export type OptionKey = (typeof OPTION_KEYS)[number];

export type Outcome = "right" | "missed" | "needless" | "wrongStep";

/**
 * What happens to the morning's 50 after a pick:
 * - model: the model's plan ships;
 * - standing: the person on duty decides, and the standing plan ships;
 * - waitData: the 50 wait for fresh data;
 * - waitStock: the 50 stay in the warehouse today;
 * - waitRetrain: the 50 wait for a retrained model.
 */
export type DeliveryKind = "model" | "standing" | "waitData" | "waitStock" | "waitRetrain";

export const OPTION_DELIVERY: Readonly<Record<OptionKey, DeliveryKind>> = {
  release: "model",
  holdUnknown: "standing",
  holdNearLimit: "standing",
  releaseOthersGreen: "model",
  waitRefresh: "waitData",
  retrain: "waitRetrain",
  releaseBestWape: "model",
  overrideReportBias: "standing",
  waitFresh: "waitStock",
  releaseMedianFine: "model",
  overrideAskWhy: "standing",
  // A lowered limit lets the plan pass, so the model's plan ships.
  lowerLimit: "model",
  retrainRaw: "waitRetrain",
  overrideReconstruct: "standing",
  releaseAnyway: "model",
};

export type MorningDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type MorningEvent = "competitorToday" | "stockoutZentrum";

export interface Morning {
  readonly day: MorningDay;
  readonly freshHours: number;
  readonly wape: number;
  /** Country bias of the last close: forecast over actual is positive. */
  readonly bias: number;
  /** Share of days the p10 to p90 range held, over the last 4 weeks [demo]. */
  readonly coverage: number;
  /** Bias per store, in store order. */
  readonly storeBias: Triple;
  readonly event?: MorningEvent;
  /** The three options in render order. */
  readonly options: readonly [OptionKey, OptionKey, OptionKey];
  readonly grade: Readonly<Partial<Record<OptionKey, Outcome>>>;
}

const GREEN_SET = ["release", "holdUnknown", "holdNearLimit"] as const;

/**
 * The week. Morning 1 is the case's own board; mornings 2 to 7 are [demo].
 * Country bias = sum of median share x store bias (shares .4576 / .3475 / .1949).
 */
export const MORNINGS: readonly Morning[] = [
  {
    day: 1,
    freshHours: 1.2,
    wape: 0.12,
    bias: 0.024,
    coverage: 0.81,
    storeBias: [0.004, 0.008, 0.1],
    options: GREEN_SET,
    grade: { release: "right", holdUnknown: "needless", holdNearLimit: "needless" },
  },
  {
    day: 2,
    freshHours: 3.4,
    wape: 0.12,
    bias: 0.024,
    coverage: 0.81,
    storeBias: [0.004, 0.008, 0.1],
    options: ["releaseOthersGreen", "waitRefresh", "retrain"],
    grade: { releaseOthersGreen: "missed", waitRefresh: "right", retrain: "wrongStep" },
  },
  {
    day: 3,
    freshHours: 1.1,
    wape: 0.108,
    bias: 0.063,
    coverage: 0.83,
    storeBias: [0.01, 0.015, 0.273],
    options: ["releaseBestWape", "overrideReportBias", "waitFresh"],
    grade: { releaseBestWape: "missed", overrideReportBias: "right", waitFresh: "wrongStep" },
  },
  {
    day: 4,
    freshHours: 1.4,
    wape: 0.131,
    bias: -0.012,
    coverage: 0.71,
    storeBias: [-0.015, -0.01, -0.009],
    options: ["releaseMedianFine", "overrideAskWhy", "lowerLimit"],
    grade: { releaseMedianFine: "missed", overrideAskWhy: "right", lowerLimit: "wrongStep" },
  },
  {
    day: 5,
    freshHours: 0.9,
    wape: 0.119,
    bias: 0.016,
    coverage: 0.84,
    storeBias: [0.015, 0.015, 0.02],
    event: "competitorToday",
    options: GREEN_SET,
    grade: { release: "missed", holdUnknown: "right", holdNearLimit: "wrongStep" },
  },
  {
    day: 6,
    freshHours: 1.6,
    wape: 0.137,
    bias: -0.046,
    coverage: 0.81,
    storeBias: [-0.05, -0.045, -0.039],
    options: GREEN_SET,
    grade: { release: "right", holdUnknown: "needless", holdNearLimit: "needless" },
  },
  {
    day: 7,
    freshHours: 1.0,
    wape: 0.152,
    bias: 0.074,
    coverage: 0.79,
    storeBias: [0.142, 0.02, 0.01],
    event: "stockoutZentrum",
    options: ["retrainRaw", "overrideReconstruct", "releaseAnyway"],
    grade: { retrainRaw: "wrongStep", overrideReconstruct: "right", releaseAnyway: "missed" },
  },
];

export const OWNER_KEYS = ["plannerOnDuty", "analytics", "whoeverFree", "custom"] as const;
export type OwnerKey = (typeof OWNER_KEYS)[number];
export const CUSTOM_ROLE_MAX = 40;
export const SENTENCE_BLANK_MAX = 80;

/** How close (units per store) a split must be to count as a named rule. */
export const PATTERN_TOLERANCE = 5;
