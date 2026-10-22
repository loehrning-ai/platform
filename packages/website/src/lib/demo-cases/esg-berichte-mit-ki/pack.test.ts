import { describe, expect, it } from "vitest";
import type { Locale } from "@/lib/i18n/locale";
import { bindCopy } from "./copy-bind";
import { ESG_COPY, ESG_STRINGS } from "./copy";
import { createLogic } from "./core";
import { FACT_IDS, FACTS, STROM_MONDAY } from "./facts";
import { ESG_LOGIC } from "./logic";
import { buildPack, onlyLocale } from "./pack";
import { ROWS, STAYS_BECAUSE } from "./rows";
import { TAKEAWAYS } from "./takeaways";
import type { Status } from "./types";

const LOCALES: readonly Locale[] = ["de", "en"];
const STATUSES: readonly Status[] = ["ok", "check", "notFound"];
const other = (locale: Locale): Locale => (locale === "de" ? "en" : "de");

/** Every key of every object inside `value`. */
function keysOf(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) keysOf(item, out);
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      out.add(key);
      keysOf(item, out);
    }
  }
  return out;
}

describe("the locale pack", () => {
  it("is plain data: it survives JSON unchanged (a server-to-client prop)", () => {
    for (const locale of LOCALES) {
      const pack = buildPack(locale);
      expect(JSON.parse(JSON.stringify(pack)), locale).toEqual(pack);
    }
  });

  it("carries one locale only", () => {
    for (const locale of LOCALES) {
      const pack = buildPack(locale);
      expect(keysOf(pack).has(other(locale)), locale).toBe(false);
      expect(pack.strings).toBe(ESG_STRINGS[locale]);
      expect(pack.takeaways).toBe(TAKEAWAYS[locale]);
      const json = JSON.stringify(pack);
      // Spot checks from each data module of the other locale.
      for (const text of [
        STROM_MONDAY.why[other(locale)],
        (ROWS[0]?.label ?? { de: "", en: "" })[other(locale)],
        (STAYS_BECAUSE.Q1 ?? { de: "", en: "" })[other(locale)],
        ESG_STRINGS[other(locale)].monday.invoiceMath,
        (TAKEAWAYS[other(locale)][1] ?? { text: "" }).text,
      ]) {
        expect(json.includes(text), `${locale}: ${text}`).toBe(false);
      }
    }
  });

  it("keeps the facts in card order", () => {
    expect(FACTS.map((fact) => fact.id)).toEqual(FACT_IDS);
    expect(buildPack("de").world.facts.map((fact) => fact.id)).toEqual(FACT_IDS);
  });

  it("prunes only locale pairs and leaves everything else as it is", () => {
    const value = { a: { de: "x", en: "y" }, b: [1, null, "z"], c: { de: "x", en: "y", n: 1 } };
    expect(onlyLocale(value, "de")).toEqual({ a: { de: "x" }, b: [1, null, "z"], c: { de: "x", en: "y", n: 1 } });
  });

  it("binds the same copy as the full data", () => {
    for (const locale of LOCALES) {
      const bound = bindCopy(buildPack(locale).strings);
      const full = ESG_COPY[locale];
      expect(bound.card.heading(3, "T")).toBe(full.card.heading(3, "T"));
      expect(bound.sheet.differ(1)).toBe(full.sheet.differ(1));
      expect(bound.sheet.differ(4)).toBe(full.sheet.differ(4));
      expect(bound.monday.score(1, ["Q1"], ["F3"])).toBe(full.monday.score(1, ["Q1"], ["F3"]));
    }
    expect(ESG_COPY.de.sheet.differ(1)).toBe("Mit deinen Stempeln wäre 1 Antwort anders rausgegangen:");
    expect(ESG_COPY.de.sheet.differ(2)).toBe("Mit deinen Stempeln wären 2 Antworten anders rausgegangen:");
  });

  it("judges every answer on both days exactly like the full data, in the pack's locale only", () => {
    for (const locale of LOCALES) {
      const pack = buildPack(locale);
      const logic = createLogic(pack.world);
      for (const day of ["friday", "monday"] as const) {
        for (const id of FACT_IDS) {
          const base = logic.factById(id);
          const fact = logic.factFor(base, day);
          for (const status of STATUSES) {
            for (const option of logic.detailOptions(fact, status)) {
              for (const action of status === "ok" ? [true, false] : [false]) {
                const answer = { status, detail: option.id, action };
                const where = `${locale} ${day} ${id} ${status}/${option.id}/${action}`;
                const mine = logic.judge(base, answer, day);
                const full = ESG_LOGIC.judge(ESG_LOGIC.factById(id), answer, day);
                expect(mine.grade, where).toBe(full.grade);
                expect(mine.rule, where).toBe(full.rule);
                expect(mine.lines.map((line) => Object.keys(line)), where).toEqual(mine.lines.map(() => [locale]));
                expect(mine.lines.map((line) => line[locale]), where).toEqual(full.lines.map((line) => line[locale]));
                for (const line of mine.lines) expect(line[locale], where).not.toMatch(/undefined|\{\w+\}/);
              }
            }
          }
        }
      }
      expect(logic.keyStamps()).toEqual(ESG_LOGIC.keyStamps());
      expect(logic.keyStamps(pack.world.facts, "monday")).toEqual(ESG_LOGIC.keyStamps(FACTS, "monday"));
    }
  });
});
