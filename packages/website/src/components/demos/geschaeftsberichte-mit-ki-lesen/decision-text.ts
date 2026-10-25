import type { DemoPack } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { CRAFT_NCR_SEP } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { checkTrigger, decide, decisionFacts, TRIGGER_PER_1000 } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/decide";
import { count, growth, rate, type Basis, type Counter } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import type { KitCardWords } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/skill-file";
import { fill, type Fmt } from "./fmt";

/** "2,51 je 1.000" style rate with its counter's rounding. */
const rateText = (fmt: Fmt, counter: Counter, month: "aug" | "sep") => fmt.rate(counter, rate(counter, month));

/** The release sentence for a counter, with the threshold from decide.ts. */
export function triggerText(pack: DemoPack, fmt: Fmt, counter: Counter): string {
  return fill(pack.decide.triggers[counter], { t: fmt.rate(counter, TRIGGER_PER_1000[counter]), per: fmt.per });
}

/** The kit Skill's wording, filled with this pack's numbers (word for word from metric-cards.md). */
export function kitWords(pack: DemoPack, fmt: Fmt): KitCardWords {
  return {
    defectsHeading: pack.kit.defectsHeading,
    demandHeading: pack.kit.demandHeading,
    releaseHeading: pack.kit.releaseHeading,
    numeratorLabel: pack.kit.numeratorLabel,
    periodLabel: pack.kit.periodLabel,
    denominatorLine: fill(pack.kit.denominatorLine, { per: fmt.per }),
    counters: pack.kit.counters,
    bases: pack.kit.bases,
    releases: {
      records: triggerText(pack, fmt, "records"),
      affected: triggerText(pack, fmt, "affected"),
      scrapped: triggerText(pack, fmt, "scrapped"),
    },
  };
}

export interface DecisionText {
  readonly headline: string;
  readonly because: string;
  readonly number: string;
  readonly risk: string;
  readonly counter: string;
  readonly trigger: string;
  readonly checks: readonly { readonly ok: boolean; readonly short: string; readonly text: string }[];
}

/** The six fields of the decision block for (counter, basis); no LLM, four outcomes. */
export function decisionText(pack: DemoPack, fmt: Fmt, counter: Counter, basis: Basis): DecisionText {
  const copy = pack.decide;
  const decision = decide(counter, basis);
  const facts = decisionFacts();
  const demandLine = fill(copy.demand[basis], { g: fmt.share(Math.abs(growth(basis))) });
  const number =
    counter === "scrapped"
      ? fill(copy.number.scrapped, {
          units: fmt.n(facts.scrapUnits),
          eur: fmt.eur(facts.scrapEur),
          price: fmt.eur(facts.scrapPrice),
          share: fmt.share(facts.scrapShare),
        })
      : counter === "affected"
        ? fill(copy.number.affected, { units: fmt.n(count("affected", "sep")), scrap: fmt.n(count("scrapped", "sep")) })
        : fill(copy.number.records, { n: CRAFT_NCR_SEP.length, merged: facts.mergedCount });
  const machines = facts.machines;
  const opposite = decision.opposite;
  const counterText =
    opposite.counter === "records"
      ? fill(copy.opposite.vp, {
          a: rateText(fmt, "records", "aug"),
          b: rateText(fmt, "records", "sep"),
          per: fmt.per,
          g: fmt.pct(growth("month")),
        })
      : fill(copy.opposite.strict, {
          a: rateText(fmt, "scrapped", "aug"),
          b: rateText(fmt, "scrapped", "sep"),
          per: fmt.per,
          g: fmt.pct(growth("week")),
          headline: copy.headlines[decide(opposite.counter, opposite.basis).key],
        });
  const check = checkTrigger(counter);
  return {
    headline: copy.headlines[decision.key],
    because: fill(copy.because, {
      counter: pack.counters[counter].name,
      a: rateText(fmt, counter, "aug"),
      b: rateText(fmt, counter, "sep"),
      per: fmt.per,
      demand: demandLine,
    }),
    number,
    risk: fill(copy.risk, { m: machines.length, first: machines[0] ?? "", last: machines[machines.length - 1] ?? "" }),
    counter: counterText,
    trigger: triggerText(pack, fmt, counter),
    checks: [
      {
        ok: check.countsUnits,
        short: copy.checks.units,
        text: check.countsUnits
          ? copy.checks.units
          : fill(copy.checks.unitsFail, { n: facts.mergedCount, rate: fmt.n(check.mergedToday ?? 0, 2) }),
      },
      (() => {
        const text = fill(copy.checks.notMet, { today: fmt.rate(counter, check.today) });
        return { ok: check.notMetToday, short: text, text };
      })(),
      { ok: check.named, short: copy.checks.named, text: copy.checks.named },
    ],
  };
}

