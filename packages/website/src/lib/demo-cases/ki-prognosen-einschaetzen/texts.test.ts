import { describe, expect, it } from "vitest";
import { COPY } from "./copy";
import { buildTakeaways } from "./texts";

const BAND = { p10: 980, p50: 1180, p90: 1320 };
const base = { band: BAND, cap: 1050, ratio: 3, unit: "" };
const de = (input: Partial<typeof base> = {}) =>
  buildTakeaways(COPY.de, { ...base, ...input });
const en = (input: Partial<typeof base> = {}) =>
  buildTakeaways(COPY.en, { ...base, ...input });
const words = (text: string) => text.trim().split(/\s+/).length;

describe("default texts (spec 6.1 to 6.3)", () => {
  it("writes the German mail sentence", () => {
    expect(de().mail).toBe(
      "Prognose 1.180 Stück (Spanne 980 bis 1.320), Lager 1.050: In 76 von 100 möglichen Startwochen reicht das Lager nicht, im Schnitt fehlen 126 Stück. Bei Lager 1.180 wären es noch 50 von 100. Wiegt ein verpasster Verkauf 3-mal so schwer wie ein übriges Stück (unsere Annahme), ist 1.268 die bessere Planzahl. Offen: Wer bekommt die fehlenden Stück zuerst, und nach welcher Regel?",
    );
  });

  it("writes the English mail sentence", () => {
    expect(en().mail).toBe(
      "Forecast 1,180 units (range 980 to 1,320), stock 1,050: in 76 of 100 possible launch weeks the stock is not enough, on average 126 units are missing. At stock 1,180 it would still be 50 of 100. If a missed sale weighs 3 times as much as a leftover unit (our assumption), 1,268 is the better plan number. Open: who gets the missing units first, and by which rule?",
    );
  });

  it("writes the questions", () => {
    expect(de().questions).toBe(
      "Vor jeder Prognose-Zahl fragen:\n1. Welche Spanne gehört zur Zahl, von unten bis oben?\n2. Was wiegt schwerer, zu wenig oder zu viel, und um welchen Faktor?\n3. Fehler worauf: Stück oder Prozent je Zeile? Und wer entscheidet, wenn der Tages-Check kippt?",
    );
    expect(en().questions).toContain(
      "3. Error on what: units or percent per row?",
    );
  });

  it("writes the working", () => {
    expect(de().working).toBe(
      "Planzahl 1.268 = 75. Perzentil bei Verhältnis 3 : 1 (unsere Annahme). Quelle: Prognose-Spanne p10 980, p50 1.180, p90 1.320; Annahme: linear zwischen den drei Werten, 100 gleich wahrscheinliche Szenarien, keine Messung. Lager 1.050: fehlt in 76 von 100, Ø fehlt 126, Ø übrig 14.",
    );
    expect(en().working).toBe(
      "Plan number 1,268 = 75th percentile at ratio 3 : 1 (our assumption). Source: forecast range p10 980, p50 1,180, p90 1,320; assumption: linear between the three values, 100 equally likely scenarios, not a measurement. Stock 1,050: short in 76 of 100, avg. missing 126, avg. leftover 14.",
    );
  });
});

describe("branches", () => {
  it("drops the forecast sentence when the cap is the forecast", () => {
    expect(de({ cap: 1180 }).mail).not.toContain("Bei Lager");
    expect(de({ cap: 1180 }).mail).toContain("In 50 von 100");
    expect(en({ cap: 1180.3 }).mail).not.toContain("At stock");
  });

  it("says 'noch' only when the forecast stock would be better", () => {
    expect(de({ cap: 1050 }).mail).toContain("wären es noch 50");
    expect(de({ cap: 1300 }).mail).toContain(
      "Bei Lager 1.180 wären es 50 von 100.",
    );
    expect(en({ cap: 1300 }).mail).toContain(
      "At stock 1,180 it would be 50 of 100.",
    );
  });

  it("handles equal weight", () => {
    expect(de({ ratio: 1 }).mail).toContain(
      "Bei gleichem Gewicht beider Fehler ist die Prognose 1.180 selbst die Planzahl.",
    );
    expect(en({ ratio: 1 }).mail).toContain("itself is the plan number");
    expect(de({ ratio: 1 }).working).toContain("= 50. Perzentil");
  });

  it("handles a cap at or above the better plan number", () => {
    expect(de({ cap: 1268 }).mail).toContain(
      "liegt das Lager auf oder über der besseren Planzahl 1.268.",
    );
    expect(de({ cap: 1320, ratio: 9 }).mail).toContain(
      "auf oder über der besseren Planzahl 1.320",
    );
    expect(en({ cap: 1400 }).mail).toContain(
      "at or above the better plan number 1,268",
    );
  });

  it("stays grammatical at 0 short weeks", () => {
    expect(de({ cap: 1500 }).mail).toContain(
      "In 0 von 100 möglichen Startwochen reicht das Lager nicht, im Schnitt fehlen 0 Stück.",
    );
  });

  it("uses a custom unit in plural and Rest slots", () => {
    const text = de({ unit: "Kisten" }).mail;
    expect(text).toContain("fehlen 126 Kisten");
    // The singular leftover slot never takes the plural unit: "eine übrige Einheit".
    expect(text).toContain("wie eine übrige Einheit (unsere Annahme)");
    expect(text).not.toContain("übrige Kisten");
    expect(text).toContain("die fehlenden Kisten zuerst");
    expect(text).toContain("Prognose 1.180 Kisten (Spanne 980 bis 1.320), Lager 1.050:");
    expect(en({ unit: "boxes" }).mail).toContain(
      "a leftover unit (our assumption)",
    );
    expect(en({ unit: "boxes" }).mail).toContain("on average 126 boxes are missing");
  });

  it("formats a fractional weight with one decimal and English ordinals", () => {
    expect(de({ ratio: 2.5 }).mail).toContain("2,5-mal");
    expect(en({ ratio: 2.5 }).working).toContain("71st percentile");
    expect(en({ ratio: 1.5 }).working).toContain("60th percentile");
    expect(en({ ratio: 4 }).working).toContain("80th percentile");
    expect(en({ ratio: 3.5 }).working).toContain("78th percentile");
  });

  it("follows an own band", () => {
    const text = de({ band: { p10: 90, p50: 100, p90: 130 }, cap: 95 }).mail;
    expect(text).toContain("Prognose 100 Stück (Spanne 90 bis 130), Lager 95");
  });
});

describe("before the Waage has been seen", () => {
  it("leaves the weighting out of the mail and the working", () => {
    for (const build of [de, en]) {
      const result = build({ weighted: false } as never);
      expect(result.mail).not.toMatch(/3-mal|3 times|Planzahl|plan number/);
      expect(result.working).not.toMatch(/Planzahl|Plan number|Perzentil|percentile/);
      expect(result.working).toMatch(/p10 980/);
      expect(result.mail).toMatch(/Lager 1\.050|stock 1,050/);
    }
  });
  it("keeps the weighting once it is seen", () => {
    expect(de({ weighted: true } as never).mail).toContain("3-mal so schwer");
  });
});

describe("hygiene", () => {
  it("keeps every block at most 75 words (the spec's own English default has 69), in both languages, over a sweep of lines", () => {
    for (const build of [de, en]) {
      for (let cap = 500; cap <= 1500; cap += 50) {
        for (const ratio of [1, 3, 9, 20]) {
          const result = build({ cap, ratio, unit: "Einheiten" });
          expect(words(result.mail), `${cap}/${ratio}`).toBeLessThanOrEqual(75);
          expect(words(result.working)).toBeLessThanOrEqual(75);
          expect(words(result.questions)).toBeLessThanOrEqual(75);
        }
      }
    }
  });

  it("has no dashes and no unfilled slots", () => {
    for (const build of [de, en]) {
      const all = Object.values(build()).join("\n");
      expect(all).not.toMatch(/[–—]/);
      expect(all).not.toMatch(/\{\w+\}/);
    }
  });

  it("never calls the spread a history", () => {
    expect(de().mail).not.toMatch(/Szenarien|Historie/);
    expect(en().mail).not.toMatch(/scenarios|history/i);
  });
});
