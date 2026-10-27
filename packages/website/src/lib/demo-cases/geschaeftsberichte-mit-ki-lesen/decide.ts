/**
 * The decision a metric card produces, with no LLM: four outcomes from
 * (counter, period), the release trigger and its three checks. Values we chose
 * for the demo carry source "demo"; the kit's own suggestion carries "kit".
 */
import { CRAFT_MODELS, REPORT } from "./data";
import { growth, machines, maxMerges, numerator, rate, reading, recordsOf, unitsShipped, type Counter, type Denom, type Period } from "./definitions";

export type DecisionKey = "rework" | "holdCause" | "vp" | "holdDemand";

export interface Decision {
  readonly key: DecisionKey;
  readonly counter: Counter;
  readonly period: Period;
}

/** The Entscheidungsraster: 3 Zähler by 2 Zeiträume, four distinct decisions in six cells. */
export function decide(counter: Counter, period: Period): Decision {
  const key: DecisionKey = counter === "scrapped" ? "rework" : counter === "affected" ? "holdCause" : period === "month" ? "vp" : "holdDemand";
  return { key, counter, period };
}

/**
 * Free play: the grid's decision for a card that takes this numerator as a
 * month total (free play has no period lever). Without a denominator the
 * figure compares two months of different size, and the grid decides nothing.
 */
export function freeDecision(counter: Counter, denom: Denom): Decision | null {
  return denom === "none" ? null : decide(counter, "month");
}

export interface Setting {
  readonly value: number;
  readonly source: "kit" | "demo";
}

/** The kit's suggested trigger (metric-cards.md, Lösungsvorschlag): 80 verschrottete Stück je 1.000. */
export const KIT_TRIGGER: Readonly<{ scrapped: Setting }> = {
  scrapped: { value: 80, source: "kit" },
};

/** Slider start values we chose for the two counters the kit gives no trigger for. */
export const DEMO_START: Readonly<{ affected: Setting; records: Setting }> = {
  affected: { value: 250, source: "demo" },
  records: { value: REPORT.vpDefectsSep, source: "demo" },
};

export function startTrigger(counter: Counter): Setting {
  return counter === "scrapped" ? KIT_TRIGGER.scrapped : DEMO_START[counter];
}

/** The slider's range per counter, per 1.000 units shipped. */
export const TRIGGER_RANGE: Readonly<Record<Counter, { min: number; max: number; step: number }>> = {
  records: { min: 0.5, max: 4, step: 0.01 },
  affected: { min: 50, max: 450, step: 5 },
  scrapped: { min: 20, max: 250, step: 5 },
};

export interface TriggerCheck {
  readonly counter: Counter;
  readonly threshold: number;
  /** September's value on this counter. */
  readonly today: number;
  /** 1: counts units, not documents. */
  readonly countsUnits: boolean;
  /** 2: not met today ("below the threshold" is false for September). */
  readonly notMetToday: boolean;
  /** 3: period and source are named on the card. */
  readonly named: boolean;
  /** Records only: the merged September rate meets the trigger although the plain one does not. */
  readonly mergeGameable: boolean;
  readonly mergedToday: number;
}

export function checkTrigger(counter: Counter, threshold: number, named = true): TriggerCheck {
  const today = rate(counter, "sep");
  const mergedToday = rate(counter, "sep", maxMerges());
  const notMetToday = !(today < threshold);
  return {
    counter,
    threshold,
    today,
    countsUnits: counter !== "records",
    notMetToday,
    named,
    mergeGameable: counter === "records" && notMetToday && mergedToday < threshold,
    mergedToday,
  };
}

/** Mean of CRAFT's list prices: the scrap valuation, because a record names no model. */
export const SCRAP_PRICE_EUR = CRAFT_MODELS.reduce((sum, model) => sum + model.price, 0) / CRAFT_MODELS.length;

/** Scrapped September units valued at the mean list price, and their share of CRAFT revenue. */
export function scrapValue(): {
  readonly units: number;
  readonly eur: number;
  readonly shareOfRevenue: number;
} {
  const units = numerator("scrapped", "sep");
  const eur = units * SCRAP_PRICE_EUR;
  return { units, eur, shareOfRevenue: eur / REPORT.craftRevenueEur };
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
    mergedSep: rate("records", "sep", maxMerges()),
    recordsSepCount: recordsOf("sep").length,
    mergedCount: recordsOf("sep").length - maxMerges(),
    growthMonth: growth("month"),
    growthWeek: growth("week"),
    scrapUnits: scrap.units,
    scrapEur: scrap.eur,
    scrapShare: scrap.shareOfRevenue,
    scrapPrice: SCRAP_PRICE_EUR,
    machines: machines(),
    unitsSep: unitsShipped("sep"),
    verdicts: {
      records: reading({ counter: "records" }).verdict,
      affected: reading({ counter: "affected" }).verdict,
      scrapped: reading({ counter: "scrapped" }).verdict,
    },
  };
}
