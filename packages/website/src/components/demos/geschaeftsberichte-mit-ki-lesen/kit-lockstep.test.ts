import { statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COPY } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/copy";
import { CRAFT_NCR_SEP, REPORT } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/data";
import { SCRAP_PRICE_EUR } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/decide";
import { BASES, COUNTERS, demand, growth, rate } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/definitions";
import { traceGroups, traceSum } from "@/lib/demo-cases/geschaeftsberichte-mit-ki-lesen/trace";
import { formatBytes } from "@/components/demos/take-home/for-your-claude";
import { getWorkshopBySlug } from "@/lib/workshops";
import { KITS, kitText } from "@/test/northwind-kit";
import { kitWords, triggerText } from "./decision-text";
import { fill, formatter } from "./fmt";

/**
 * The demo is the kit visualized: the numbers the kit tells a participant to
 * expect, the card wording the strips type and the report quote all come
 * from the files in the zip the visitor downloads.
 */
const flat = (text: string) => text.replace(/\s+/g, " ");

describe.each(["de", "en"] as const)("the %s kit", (locale) => {
  const pack = COPY[locale];
  const fmt = formatter(pack);
  const start = kitText(locale, "START-HERE.md");
  const cards = flat(kitText(locale, "metric-cards.md"));
  const report = flat(kitText(locale, "reports/2023-09-monthly-report.md"));

  it("expects the same table the demo computes", () => {
    const rows = start.split("\n").filter((line) => /^\| (Defe|Dema|Nach)/.test(line));
    const cells = rows.map((line) => line.split("|").slice(3, 5).map((cell) => cell.trim()));
    expect(cells).toEqual([
      ...COUNTERS.map((counter) => [fmt.rate(counter, rate(counter, "aug")), fmt.rate(counter, rate(counter, "sep"))]),
      ...BASES.map((basis) => [fmt.n(demand("aug", basis)), fmt.n(demand("sep", basis))]),
    ]);
    // the kit is plain Markdown: a normal space before %, where the site sets a narrow one
    const plain = (text: string) => text.replace(/\u202f/g, " ");
    expect(start).toContain(plain(fmt.pct(growth("month"))));
    expect(start).toContain(plain(fmt.pct(growth("week"))));
    expect(start).toContain(fmt.eur(traceSum(traceGroups())));
    expect(start).toContain(fmt.rate("records", rate("records", "sep", true)));
  });

  it("holds the card wording the skill strips type", () => {
    const words = kitWords(pack, fmt);
    for (const counter of COUNTERS) expect(cards).toContain(words.counters[counter]);
    for (const basis of BASES) expect(cards).toContain(words.bases[basis]);
    expect(cards).toContain(words.denominatorLine);
    // the reference release condition is the demo's scrapped trigger, word for word
    expect(cards).toContain(triggerText(pack, fmt, "scrapped"));
  });

  it("states the documentation count, the scrap price and the report price the notes quote", () => {
    const documentation = CRAFT_NCR_SEP.filter((row) => row.type === "documentation").length;
    expect(cards).toMatch(new RegExp(`${documentation} (of September's|der) ${CRAFT_NCR_SEP.length}`));
    expect(cards).toContain(fmt.eur(SCRAP_PRICE_EUR));
    expect(cards).toContain(fmt.eur(REPORT.avgPriceCents / 100, 2));
  });

  it("quotes the VP's claim from the report", () => {
    const claim = pack.claim;
    const figure = fill(claim.quoteFigure, { a: fmt.n(REPORT.vpDefectsAug, 2), b: fmt.n(REPORT.vpDefectsSep, 2), per: fmt.per });
    const quote = `${claim.quoteBefore}${figure}${claim.quoteAfter}`.replace(/["„“”]/g, "");
    expect(report).toContain(flat(quote));
  });
});

describe("the workshop page", () => {
  // The size as the demo's take-home block prints it (formatBytes), so page and demo never disagree.
  it.each(["de", "en"] as const)("links the %s kit with its measured size", (locale) => {
    const kit = getWorkshopBySlug("geschaeftsberichte-mit-ki-lesen", locale)?.materials.find((material) => material.role === "kit");
    expect(kit?.href.endsWith(KITS[locale].split("/").pop() ?? "")).toBe(true);
    const size = statSync(join(process.cwd(), KITS[locale])).size;
    expect(kit?.sizeLabel).toBe(formatBytes(size, locale));
  });
});
