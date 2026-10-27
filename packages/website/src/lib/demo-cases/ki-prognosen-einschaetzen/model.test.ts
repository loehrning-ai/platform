import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readZipText } from "@/lib/zip/read";
import { BIAS_MAX, LAMP_KEYS } from "./check";
import { biasWindow, bufferArgmin, bufferCost, exportAccuracy, lampRuns, lampsSpanning } from "./derive";
import { KIT_COSTS, kitCheck, kitCsv } from "./kit";
import { KIT_CSV } from "./kit-series";
import { buildModel, hitsUpTo, quantileBuffer, scoredUpTo, shiftedAccuracy, sortedWindow } from "./model";

const SITE = path.resolve(__dirname, "../../../..");
const ZIPS = {
  de: { file: "public/workshops/ki-prognosen-einschaetzen/prognose-pruefen-kit.zip", entry: "prognose-pruefen-kit/daten/tool-export.txt" },
  en: { file: "public/workshops/ki-prognosen-einschaetzen/forecast-check.zip", entry: "forecast-check/data/tool-export.txt" },
} as const;

function model(canteen = true, locale: "de" | "en" = "de") {
  const co = canteen ? KIT_COSTS.restKantine : KIT_COSTS.restOhne;
  const { check, result } = kitCheck(KIT_COSTS.fehlmenge, co, locale);
  return buildModel(check, result, { cu: KIT_COSTS.fehlmenge, co });
}

const week = (m: ReturnType<typeof model>, t: number | null | undefined) => (t === null || t === undefined ? null : m.check.rows[t]?.woche);

describe("scene 1: the baseline built by hand", () => {
  const m = model();
  it.each(["de", "en"] as const)("the tool's accuracy is the line of tool-export.txt (%s)", (locale) => {
    const zip = new Uint8Array(readFileSync(path.join(SITE, ZIPS[locale].file)));
    const text = readZipText(zip, ZIPS[locale].entry);
    expect(text).not.toBeNull();
    const shown = exportAccuracy(text as string);
    expect(shown).not.toBeNull();
    expect(m.toolAccuracy as number).toBeCloseTo(shown as number, 3);
    expect(m.wape).toBeCloseTo(1 - (m.toolAccuracy as number), 12);
  });

  it("sliding the sales line one week gives exactly the rule's accuracy, zero weeks the identity", () => {
    expect(shiftedAccuracy(m, 0)).toBe(1);
    expect(shiftedAccuracy(m, 1)).toBeCloseTo(m.ruleAccuracy as number, 12);
    expect(Math.round((m.ruleAccuracy as number) * 1000) / 10).toBe(92.6);
    expect(m.points).toBe(1.6);
  });
});

describe("scene 2: the error list", () => {
  const m = model();
  it("closer, rule closer and ties add up to the scored weeks", () => {
    expect(m.closer).toEqual({ tool: 30, rule: 20, ties: 0 });
    expect(m.closer.tool + m.closer.rule + m.closer.ties).toBe(m.result.wochen);
  });

  it("the row sheet quotes the raw line of the kit CSV, with its line number", () => {
    const t = m.check.rows.findIndex((row) => row.woche === "2025-05-12");
    const row = m.check.rows[t];
    expect(row?.line).toBe(74);
    const raw = KIT_CSV.replace(/\r\n/g, "\n").split("\n")[(row?.line as number) - 1];
    expect(raw).toBe("2025-05-12;637;671;Aktion Reformhaus-Kette, 20 % Rabatt");
    expect(kitCsv("en").split("\n")[73]).toMatch(/^2025-05-12;637;671;/);
    expect(m.pin?.t).toBe(t);
  });

  it("the timeline runs from 30.12.2024 to 22.12.2025 over 50 scored weeks", () => {
    expect(week(m, m.span[0])).toBe("2024-12-30");
    expect(week(m, m.span[m.span.length - 1])).toBe("2025-12-22");
    expect(scoredUpTo(m.check, m.span[m.span.length - 1] as number)).toBe(50);
  });
});

describe("scene 3: the range", () => {
  const m = model();
  it("parks on 31.03., is done on 05.05., and splits the misses at 07.04.", () => {
    expect(week(m, m.park)).toBe("2025-03-31");
    expect(week(m, m.rangeDone)).toBe("2025-05-05");
    expect(week(m, m.cause?.t)).toBe("2025-04-07");
    expect(m.split).toMatchObject({ before: { hits: 9, weeks: 12 }, after: { hits: 27, weeks: 38 }, misses: 14, missesAfter: 11 });
    expect(hitsUpTo(m.check, m.span[m.span.length - 1] as number)).toEqual({ hits: 36, seen: 50 });
  });

  it("the sorted window of 07.04. gives the hand calculation of the exercise", () => {
    const sorted = sortedWindow(m.check, m.cause?.t as number);
    expect(sorted?.errors).toHaveLength(26);
    expect(sorted?.low).toBeCloseTo(-50.5, 9);
    expect(sorted?.high).toBeCloseTo(18, 9);
    expect(m.check.forecast(m.cause?.t as number)).toBe(607);
    expect(m.check.rows[m.cause?.t as number]?.ist).toBe(484);
  });
});

describe("scene 4: the order quantity, in lockstep with the kit's ledger", () => {
  it("with the canteen the curve's lowest point is the kit's buffer: +19, 748 jars, 379,00 €", () => {
    const m = model(true);
    const plan = m.plan!;
    expect(plan.errors).toHaveLength(26);
    expect(plan.forecast).toBe(729);
    expect(plan.planzahl).toBe(748);
    expect(plan.argmin).toBe(plan.planzahl - plan.forecast);
    expect(plan.argminCost).toBeCloseTo(379, 9);
    expect(plan.zeroCost).toBeCloseTo(559.5, 9);
    expect(plan.gap).toBeCloseTo(0, 9);
    expect(bufferArgmin(plan.errors, 1.5, 0.4)).toEqual({ buffer: 19, cost: plan.argminCost });
  });

  it("without the canteen the lowest point is 728, within one jar of the kit's 729, a gap of 1,30 €", () => {
    const m = model(false);
    const plan = m.plan!;
    expect(plan.planzahl).toBe(729);
    expect(plan.forecast + plan.argmin).toBe(728);
    expect(Math.abs(plan.argmin - (plan.planzahl - plan.forecast))).toBeLessThanOrEqual(1);
    expect(plan.argminCost).toBeCloseTo(936.2, 9);
    expect(plan.gap).toBeCloseTo(1.3, 9);
    expect(bufferCost(plan.errors, 1.5, 1.6, plan.planzahl - plan.forecast) - bufferCost(plan.errors, 1.5, 1.6, plan.argmin)).toBeCloseTo(1.3, 9);
  });

  it("the savings sentences are the kit's ledger differences", () => {
    const on = model(true).result.kosten!;
    expect(on.Messlatte - on.Prognose).toBeCloseTo(946.3, 2);
    expect(on.Prognose - on.Planzahl).toBeCloseTo(82.11, 2);
    const off = model(false).result.kosten!;
    expect(Math.round(off.Messlatte - off.Prognose)).toBe(649);
    expect(Math.round(off.Prognose - off.Planzahl)).toBe(124);
  });

  it("the kit's interpolated buffer is the quantile at the cost share", () => {
    const m = model(true);
    const plan = m.plan!;
    expect(Math.floor(plan.forecast + quantileBuffer(plan.errors, plan.share) + 0.5)).toBe(plan.planzahl);
  });
});

describe("scene 5: the release rule", () => {
  const m = model();
  it("the bias mean line leaves the ±5 % band in exactly the weeks the bias lamp is red", () => {
    let red = 0;
    for (const t of m.strip) {
      const lamps = m.check.lamps(t);
      const window = biasWindow(m.check, t);
      if (!lamps || !window) continue;
      expect(Math.abs(window.mean) > window.band, m.check.rows[t]?.woche).toBe(!lamps.bias);
      expect(window.mean).toBeCloseTo(-lamps.bias_wert * (window.band / BIAS_MAX), 9);
      if (!lamps.bias) red += 1;
    }
    expect(red).toBe(14);
  });

  it("bias and range stay red for 14 weeks from 21.04., the first lamp two weeks after the cause", () => {
    const runs = lampRuns(m.check);
    for (const key of ["bias", "spanne"] as const) {
      expect(runs[key]?.weeks).toBe(14);
      expect(week(m, runs[key]?.from)).toBe("2025-04-21");
    }
    expect(m.spanning).toEqual(["bias", "spanne"]);
    expect(lampsSpanning(m.check, m.longest!)).toEqual(m.spanning);
    expect(m.lag).toBe(2);
    expect(week(m, m.ruleDone)).toBe("2025-07-28");
    expect(m.result.regel_frei).toBe(37);
    expect(m.result.regel_rot).toHaveLength(15);
  });

  it("the plan week has all four lamps green", () => {
    const next = m.check.naechste as number;
    const lamps = m.check.lamps(next);
    for (const key of LAMP_KEYS) expect(lamps?.[key]).toBe(true);
    expect(m.strip[m.strip.length - 1]).toBe(next);
  });
});
