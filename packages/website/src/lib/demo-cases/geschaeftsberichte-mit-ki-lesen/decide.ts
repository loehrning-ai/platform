/**
 * The decision the visitor's cards produce, with no LLM: four outcomes from
 * (counter, basis), the opposite pole as the counter-position, and the three
 * checks of the release condition. decide.test.ts covers all six inputs.
 */
import { CRAFT_MODELS, CRAFT_NCR_SEP, REPORT } from "./data";
import { count, growth, mergeRecords, rate, unitsShipped, verdict, type Basis, type Counter } from "./definitions";

export type DecisionKey = "rework" | "holdCause" | "vp" | "holdDemand";

export interface Decision {
  readonly key: DecisionKey;
  readonly counter: Counter;
  readonly basis: Basis;
  /** The pole the counter-position argues from. */
  readonly opposite: { readonly counter: Counter; readonly basis: Basis };
}

export function decide(counter: Counter, basis: Basis): Decision {
  const key: DecisionKey =
    counter === "scrapped" ? "rework" : counter === "affected" ? "holdCause" : basis === "month" ? "vp" : "holdDemand";
  const opposite =
    counter === "records" && basis === "month"
      ? ({ counter: "scrapped", basis: "week" } as const)
      : ({ counter: "records", basis: "month" } as const);
  return { key, counter, basis, opposite };
}

/** The release threshold per counter, per 1.000 units shipped (a setting each card states). */
export const TRIGGER_PER_1000: Readonly<Record<Counter, number>> = {
  records: REPORT.vpDefectsSep,
  affected: 250,
  scrapped: 80,
};

export interface TriggerCheck {
  readonly counter: Counter;
  readonly threshold: number;
  /** September's value on this counter. */
  readonly today: number;
  /** ① counts units, not documents. Fails for records: merging alone meets it. */
  readonly countsUnits: boolean;
  /** ② not met today: "below the threshold" is false for September. */
  readonly notMetToday: boolean;
  /** ③ period and source are named in the sentence. */
  readonly named: boolean;
  /** For records: the September rate after merging (1,86). */
  readonly mergedToday: number | null;
}

export function checkTrigger(counter: Counter): TriggerCheck {
  const threshold = TRIGGER_PER_1000[counter];
  const today = rate(counter, "sep");
  const mergedToday = counter === "records" ? rate("records", "sep", true) : null;
  return {
    counter,
    threshold,
    today,
    countsUnits: counter !== "records",
    notMetToday: !(today < threshold),
    named: true,
    mergedToday,
  };
}

/** Mean of CRAFT's list prices: the scrap valuation, because an NCR names no model. */
export const SCRAP_PRICE_EUR = CRAFT_MODELS.reduce((sum, model) => sum + model.price, 0) / CRAFT_MODELS.length;

/** Scrapped September units valued at the mean list price, and their share of CRAFT revenue. */
export function scrapValue(): { readonly units: number; readonly eur: number; readonly shareOfRevenue: number } {
  const units = count("scrapped", "sep");
  const eur = units * SCRAP_PRICE_EUR;
  return { units, eur, shareOfRevenue: eur / REPORT.craftRevenueEur };
}

/** The machines September's CRAFT NCRs come from, sorted. */
export function machines(): readonly string[] {
  return [...new Set(CRAFT_NCR_SEP.map((row) => row.machine))].sort();
}

/** Numbers a decision sentence may quote, so copy never holds a literal. */
export function decisionFacts() {
  const scrap = scrapValue();
  return {
    scrapAug: rate("scrapped", "aug"),
    scrapSep: rate("scrapped", "sep"),
    affectedAug: rate("affected", "aug"),
    affectedSep: rate("affected", "sep"),
    recordsAug: rate("records", "aug"),
    recordsSep: rate("records", "sep"),
    mergedSep: rate("records", "sep", true),
    mergedCount: mergeRecords(CRAFT_NCR_SEP).length,
    growthMonth: growth("month"),
    growthWeek: growth("week"),
    scrapUnits: scrap.units,
    scrapEur: scrap.eur,
    scrapShare: scrap.shareOfRevenue,
    scrapPrice: SCRAP_PRICE_EUR,
    machines: machines(),
    unitsSep: unitsShipped("sep"),
    verdicts: { records: verdict("records"), affected: verdict("affected"), scrapped: verdict("scrapped") },
  };
}
