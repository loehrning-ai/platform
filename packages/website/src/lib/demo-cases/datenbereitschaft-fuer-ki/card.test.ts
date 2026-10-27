import { describe, expect, it } from "vitest";
import { cell, columnIssue, EMPTY_CARD, forbiddenChar, isAiSource, isDate, isoDate, lintQuestion, metricSlug, neverItems, parseExpected, validateCard, type OwnCard } from "./card";
import { DE } from "./copy-de";
import { EN } from "./copy-en";

const FOLDLINE = DE.presets[0]?.card as OwnCard;

describe("validateCard", () => {
  it("accepts every preset that is not empty, in both languages", () => {
    for (const pack of [DE, EN]) {
      for (const preset of pack.presets) {
        if (preset.id === "empty") continue;
        expect(validateCard(preset.card, pack.locale), `${pack.locale} ${preset.id}`).toEqual([]);
      }
    }
  });

  it("names every required field of the empty card in box order", () => {
    const fields = validateCard(EMPTY_CARD).map((error) => error.field);
    expect(fields).toEqual(["metric", "question", "clock", "view", "kind", "who", "never", "lockedBy", "expected", "unit", "source"]);
  });

  it("rejects characters that break the files, and names them", () => {
    expect(validateCard({ ...FOLDLINE, metric: "MRR <b>" })).toContainEqual({ field: "metric", code: "forbidden", detail: "<" });
    expect(forbiddenChar("a `b`")).toBe("`");
    expect(validateCard({ ...FOLDLINE, view: "analytics#mrr" })).toContainEqual({ field: "view", code: "chars" });
  });

  it("takes file and column names as people write them", () => {
    expect(validateCard({ ...FOLDLINE, view: "OP-Liste (Export) Q3.xlsx", column: "Betrag offen" })).toEqual([]);
    expect(validateCard({ ...FOLDLINE, view: "Finanzen/Übersicht.xlsx", column: "Größe_Stück" }).map((error) => error.field)).toEqual([]);
  });

  it("never blocks the files on the optional column", () => {
    expect(validateCard({ ...FOLDLINE, column: "betrag#offen" })).toEqual([]);
    expect(columnIssue({ column: "betrag#offen" })).toEqual({ field: "column", code: "chars" });
    expect(columnIssue({ column: "a`b" })).toEqual({ field: "column", code: "forbidden", detail: "`" });
    expect(columnIssue({ column: "" })).toBeNull();
    expect(columnIssue({ column: "Betrag offen" })).toBeNull();
  });

  it("names a token that is not a number, and the count limits", () => {
    expect(validateCard({ ...FOLDLINE, expected: "334.675 / viel" })).toContainEqual({ field: "expected", code: "token", detail: "viel" });
    expect(validateCard({ ...FOLDLINE, expected: "1 / 2 / 3 / 4 / 5 / 6 / 7" })).toContainEqual({ field: "expected", code: "count", detail: "1-6" });
  });

  it("refuses an expected value that comes from an AI", () => {
    expect(validateCard({ ...FOLDLINE, source: "Claude" })).toContainEqual({ field: "source", code: "ai-source" });
    expect(isAiSource("laut KI-Bericht")).toBe(true);
    expect(isAiSource("Gemini Export")).toBe(true);
    expect(isAiSource("Monatsabschluss Finanzen")).toBe(false);
    expect(isAiSource("Kassenbuch Kaiser")).toBe(false);
  });

  it("checks the clock and the never list", () => {
    expect(isDate("2026-02-29")).toBe(false);
    expect(isDate("2028-02-29")).toBe(true);
    expect(validateCard({ ...FOLDLINE, clock: "1.7.2026" })).toEqual([]);
    expect(validateCard({ ...FOLDLINE, clock: "01.10.2026" })).toEqual([]);
    expect(validateCard({ ...FOLDLINE, clock: "31.09.2026" })).toContainEqual({ field: "clock", code: "date" });
    expect(validateCard({ ...FOLDLINE, clock: "Juli 2026" })).toContainEqual({ field: "clock", code: "date" });
    expect(isoDate("01.10.2026")).toBe("2026-10-01");
    expect(isoDate(" 2026-07-01 ")).toBe("2026-07-01");
    expect(isoDate("2026-7-1")).toBeNull();
    expect(neverItems(" Namen,  E-Mail ; ,Telefon ")).toEqual(["Namen", "E-Mail", "Telefon"]);
    expect(validateCard({ ...FOLDLINE, never: "a,b,c,d,e,f,g" })).toContainEqual({ field: "never", code: "items", detail: "1-6" });
  });
});

describe("parseExpected", () => {
  it("reads both number formats and the usual separators", () => {
    expect(parseExpected("334.675 / 344.450 / 387.015")).toEqual({ values: [334_675, 344_450, 387_015] });
    expect(parseExpected("334,675 / 344,450 / 387,015", "en")).toEqual({ values: [334_675, 344_450, 387_015] });
    expect(parseExpected("9,5")).toEqual({ values: [9.5] });
    expect(parseExpected("110\n95\n110")).toEqual({ values: [110, 95, 110] });
    expect(parseExpected("9.5", "en")).toEqual({ values: [9.5] });
    expect(parseExpected("−19,960, 9,775", "en")).toEqual({ values: [-19_960, 9_775] });
    expect(parseExpected("334,675", "de")).toEqual({ bad: "334,675" });
  });
});

describe("metricSlug", () => {
  it("transliterates and trims", () => {
    expect(metricSlug("Ending MRR")).toBe("ending_mrr");
    expect(metricSlug("Austrittsquote Größe")).toBe("austrittsquote_groesse");
    expect(metricSlug("  !!  ")).toBe("kennzahl");
    expect(metricSlug("x".repeat(60)).length).toBe(40);
  });
});

describe("lintQuestion", () => {
  it("hints a missing period, kind and unit, never more", () => {
    expect(lintQuestion({ question: "Wie viel MRR haben wir?", kind: "", unit: "", who: "" })).toEqual(["period", "kind", "unit"]);
    expect(lintQuestion({ question: FOLDLINE.question, kind: "level", unit: "EUR", who: FOLDLINE.who })).toEqual([]);
    expect(lintQuestion({ question: "How much MRR do we have?", kind: "level", unit: "EUR", who: "" })).toEqual(["period"]);
  });

  it("catches levels added over time and averaged rates", () => {
    expect(lintQuestion({ question: "Bestand Q2 2026 summiert, in Stück", kind: "level", unit: "Stück", who: "" })).toContain("levels-summed");
    expect(lintQuestion({ question: "Durchschnitt der Quoten Q2 2026, in %", kind: "rate", unit: "%", who: "" })).toContain("rates-averaged");
  });
});

describe("cell", () => {
  it("escapes a pipe, and a backslash first, so no cell splits", () => {
    expect(cell("a | b")).toBe("a \\| b");
    expect(cell("x \\| y")).toBe("x \\\\\\| y");
    expect(cell("C:\\data")).toBe("C:\\\\data");
  });
});
