import { describe, expect, it } from "vitest";
import { LAMP_KEYS } from "@/lib/demo-cases/ki-prognosen-einschaetzen/check";
import { COPY } from "@/lib/demo-cases/ki-prognosen-einschaetzen/copy";
import { KIT_COSTS, kitCheck } from "@/lib/demo-cases/ki-prognosen-einschaetzen/kit";
import { buildModel } from "@/lib/demo-cases/ki-prognosen-einschaetzen/model";
import { baselineCaption, errorsCaption, errorsMoment, freeCaption, planCaption, planGap, rangeCaption, ruleCaption, type Progress } from "./captions";
import { biasSentence, biasWords, fillProject, personalLine, weekSentence } from "./helpers";
import { lampValue } from "./scene-rule";

const DONE: Progress = {
  guess: "locked",
  guessValue: 91,
  baselineDone: true,
  errorsAt: 0,
  errorsDone: true,
  guess3: "locked",
  guess3Value: 30,
  rangeAt: 0,
  rangeDone: true,
  planDone: true,
  canteen: true,
  ruleDone: true,
  owner: "Leitung Disposition",
  kit: true,
  lampsReady: true,
};

function model(canteen: boolean, locale: "de" | "en") {
  const co = canteen ? KIT_COSTS.restKantine : KIT_COSTS.restOhne;
  const { check, result } = kitCheck(KIT_COSTS.fehlmenge, co, locale);
  return buildModel(check, result, { cu: KIT_COSTS.fehlmenge, co });
}

const NBSP = / /g;
const plain = (texts: readonly string[]) => texts.join(" ").replace(NBSP, " ");

describe.each(["de", "en"] as const)("every caption slot is filled from the model (%s)", (locale) => {
  const copy = COPY[locale];
  const on = model(true, locale);
  const off = model(false, locale);
  const all = [
    ...baselineCaption(copy, on, DONE),
    ...errorsCaption(copy, on, { ...DONE, errorsAt: on.span[on.span.length - 1] as number }),
    ...rangeCaption(copy, on, DONE),
    ...planCaption(copy, on, DONE),
    ...planCaption(copy, off, { ...DONE, canteen: false }),
    planGap(copy, off) ?? "",
    ...ruleCaption(copy, on, DONE),
    ...freeCaption(copy, on),
  ];

  it("leaves no {slot} open and writes no dash", () => {
    for (const text of all) {
      expect(text).not.toMatch(/\{\w+\}/);
      expect(text).not.toMatch(/[–—]/);
    }
  });

  it("states the kit's numbers", () => {
    const text = plain(all);
    const n = (de: string, en: string) => (locale === "de" ? de : en);
    expect(text).toContain(n("92,6 %", "92.6 %"));
    expect(text).toContain(n("1,6 Prozentpunkte", "1.6 percentage points"));
    expect(text).toContain(n("Tool in 30 von 50", "closer in 30 of 50"));
    expect(text).toContain(n("In 36 von 50 Wochen", "in 36 of 50 weeks"));
    expect(text).toContain(n("11 der 14 Fehltreffer", "11 of the 14 misses"));
    expect(text).toContain("748");
    expect(text).toContain("728");
    expect(text).toContain(n("946 €", "€946"));
    expect(text).toContain(n("82 €", "€82"));
    expect(text).toContain(n("1,30 €", "€1.30"));
    expect(text).toContain(n("In 37 Wochen", "In 37 weeks"));
    expect(text).toContain(n("14 Wochen lang rot", "red for 14 weeks"));
    expect(text).toContain(n("2 Wochen später", "2 weeks later"));
    expect(text).toContain("Leitung Disposition");
  });

  it("names the moments on the way from the data", () => {
    const at = (iso: string) => on.check.rows.findIndex((row) => row.woche === iso);
    expect(errorsMoment(copy, on, at("2025-02-03"), true)).toBe(copy.s2.noForecast);
    expect(errorsMoment(copy, on, at("2025-03-10"), true)).toBe(copy.s2.soldOut);
    expect(errorsMoment(copy, on, at("2025-05-12"), true)?.replace(NBSP, " ")).toMatch(/167.*34/);
  });

  it("never writes the bias signed, and says its direction in words", () => {
    const t = on.check.rows.findIndex((row) => row.woche === "2025-04-21");
    const lamps = on.check.lamps(t)!;
    const words = biasWords(copy, lamps).replace(NBSP, " ");
    expect(words).toBe(locale === "de" ? "5,4 % zu hoch" : "5.4 % too high");
    const sentence = biasSentence(copy, lamps, 0.05);
    expect(sentence).not.toMatch(/[−+-]\d/);
    for (const key of LAMP_KEYS) expect(lampValue(copy, on.check, t, key, lamps)).not.toMatch(/[−+]\d/);
    expect(weekSentence(copy, lamps, "")).toContain(copy.s5.ownerFallback);
  });

  it("writes the personal line and fills the project instructions in order", () => {
    expect(personalLine(copy, copy.product, "Leitung Disposition", on.result).replace(NBSP, " ")).toMatch(/729.*748.*Leitung Disposition/);
    const project = fillProject(copy.kitText.project, { series: "Tomatensuppe", rule: "x", cu: "1", co: "2", owner: "Frau A" });
    expect(project).toContain("Tomatensuppe");
    expect(project).toContain("Frau A");
    expect(project.match(/\[[^\]]+\]/g)).toHaveLength(1);
  });
});
