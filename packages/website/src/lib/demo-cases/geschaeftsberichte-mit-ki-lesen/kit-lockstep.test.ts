import { describe, expect, it } from "vitest";
import { kitText } from "@/test/northwind-kit";
import { COPY } from "./copy";
import { LINE, REPORT } from "./data";
import { KIT_TRIGGER } from "./decide";
import { COUNTERS, PERIODS } from "./definitions";
import { kitCounterWords } from "./skill-file";
import { fill, formatNumber } from "./format";

/**
 * The words the demo hands back to the kit (step 2 writes them into
 * northwind-metrics/SKILL.md) and the sentences it quotes from the kit must
 * stand in the kit files exactly, so the demo is the kit visualized.
 */
const flat = (text: string) => text.replace(/\s+/g, " ");

describe.each(["de", "en"] as const)("kit lockstep, %s", (locale) => {
  const pack = COPY[locale];
  const per = formatNumber(1000, locale);
  const values = { line: LINE, per };
  const cards = flat(kitText(locale, "metric-cards.md"));

  it("writes the counters, the periods and the denominator in the kit's own words", () => {
    const counters = kitCounterWords(kitText(locale, "metric-cards.md"));
    for (const counter of COUNTERS) expect(cards).toContain(counters[counter]);
    expect(counters.records).toContain("ncr_records.csv");
    expect(counters.affected).toContain("qty_affected");
    expect(counters.scrapped).toContain("scrap_or_rework");
    for (const period of PERIODS) expect(cards).toContain(fill(pack.kit.bases[period], values));
    expect(cards).toContain(fill(pack.kit.denominatorLine, values).replace(/^- /, ""));
  });

  it("states the kit's suggested trigger word for word", () => {
    const sentence = fill(pack.decide.triggers.scrapped, {
      ...values,
      t: formatNumber(KIT_TRIGGER.scrapped.value, locale),
    });
    expect(cards).toContain(sentence);
  });

  it("quotes the report's claim as the report prints it", () => {
    const quote = [pack.report.quoteBefore, pack.report.quoteFigure, pack.report.quoteAfter].join("").replace(/[„“”"]/g, "");
    const filled = fill(quote, {
      ...values,
      a: formatNumber(REPORT.vpDefectsAug, locale, { digits: 2 }),
      b: formatNumber(REPORT.vpDefectsSep, locale, { digits: 2 }),
    });
    expect(flat(kitText(locale, "reports/2023-09-monthly-report.md"))).toContain(flat(filled).trim());
  });

  it("shows the workshop's rule exactly as START-HERE states it", () => {
    expect(flat(kitText(locale, "START-HERE.md"))).toContain(pack.decide.objective);
  });
});
