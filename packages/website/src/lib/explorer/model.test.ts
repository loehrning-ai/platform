import { describe, expect, it } from "vitest";
import {
  ExplorerModelError,
  fieldCounts,
  hasValue,
  intervalPerHundred,
  levelCountText,
  numeralPerHundred,
  parseExplorerModel,
  perHundred,
  predict,
  readoutSentence,
  staticTable,
  supportText,
  type ExplorerModel,
} from "./model";
import { syntheticModel } from "./synthetic-model";

const MODEL = syntheticModel();

describe("parseExplorerModel", () => {
  it("accepts the synthetic model and round-trips it", () => {
    const parsed = parseExplorerModel(JSON.parse(JSON.stringify(MODEL)));
    expect(parsed.factors.map((f) => f.id)).toEqual(["branche", "bundesland", "size", "textmenge"]);
    expect(parsed.intercept.boot).toHaveLength(80);
  });

  it("rejects a level below the floor of five firms (k = 5)", () => {
    const bad = JSON.parse(JSON.stringify(MODEL)) as { factors: { levels: { n: number }[] }[] };
    bad.factors[1]!.levels[0]!.n = 4;
    expect(() => parseExplorerModel(bad)).toThrow(/floor of 5/);
  });

  it("rejects ragged draw counts, a missing factor and a wrong number of text fifths", () => {
    const ragged = JSON.parse(JSON.stringify(MODEL)) as { factors: { levels: { boot: number[] }[] }[] };
    ragged.factors[0]!.levels[0]!.boot.pop();
    expect(() => parseExplorerModel(ragged)).toThrow(ExplorerModelError);

    const missing = JSON.parse(JSON.stringify(MODEL)) as { factors: unknown[] };
    missing.factors = missing.factors.slice(0, 3);
    expect(() => parseExplorerModel(missing)).toThrow(/missing "textmenge"/);

    const four = JSON.parse(JSON.stringify(MODEL)) as { factors: { id: string; levels: unknown[] }[] };
    four.factors.find((f) => f.id === "textmenge")!.levels.pop();
    expect(() => parseExplorerModel(four)).toThrow(/five levels/);
  });

  it("rejects a default that is not a level", () => {
    const bad = JSON.parse(JSON.stringify(MODEL)) as { default: Record<string, string> };
    bad.default["branche"] = "gibt-es-nicht";
    expect(() => parseExplorerModel(bad)).toThrow(/not a level/);
  });
});

describe("predict", () => {
  it("is deterministic, keeps the estimate inside its interval and stays a probability", () => {
    const a = predict(MODEL, MODEL.default);
    const b = predict(MODEL, MODEL.default);
    expect(a).toEqual(b);
    expect(a.lo).toBeLessThanOrEqual(a.p);
    expect(a.p).toBeLessThanOrEqual(a.hi);
    expect(a.p).toBeGreaterThan(0);
    expect(a.hi).toBeLessThan(1);
  });

  it("rises with the text volume, the strongest predictor", () => {
    const shares = ["q1", "q2", "q3", "q4", "q5"].map((q) => predict(MODEL, { ...MODEL.default, textmenge: q }).p);
    expect([...shares].sort((x, y) => x - y)).toEqual(shares);
    expect(shares[4]! / shares[0]!).toBeGreaterThan(10);
  });

  it("reports the thinnest level as support and marks a pooled Land with its note", () => {
    const pooled = predict(MODEL, { ...MODEL.default, bundesland: "pool" });
    expect(pooled.support).toBe(120);
    expect(pooled.pooledNotes).toEqual(["zu wenige Daten für ein eigenes Land"]);
    expect(pooled.thin).toBe(false);
    const thin: ExplorerModel = {
      ...MODEL,
      factors: MODEL.factors.map((f) => (f.id === "size" ? { ...f, levels: f.levels.map((l) => (l.id === "10+" ? { ...l, n: 12 } : l)) } : f)),
    };
    const result = predict(thin, { ...MODEL.default, size: "10+" });
    expect(result.thin).toBe(true);
    expect(readoutSentence(result)).toContain("wenige Startseiten wie deine");
  });

  it("throws for a level that does not exist instead of guessing", () => {
    expect(() => predict(MODEL, { ...MODEL.default, branche: "nope" })).toThrow(ExplorerModelError);
  });
});

describe("wording", () => {
  it("prints one decimal of a hundred and never a bare zero", () => {
    expect(perHundred(0.032)).toBe("3,2");
    expect(perHundred(0.0049)).toBe("0,5");
    expect(perHundred(0.0004)).toBe("unter 0,1");
    expect(perHundred(0.126)).toBe("12,6");
  });

  it("keeps the giant numeral short: a number with one decimal, or <0,1", () => {
    expect(numeralPerHundred(0.032)).toBe("3,2");
    expect(numeralPerHundred(0.0004)).toBe("<0,1");
  });

  it("widens the interval outward to the tenth and never prints a lower bound of zero", () => {
    expect(intervalPerHundred(0.0201, 0.0449)).toBe("2,0 bis 4,5");
    expect(intervalPerHundred(0.02, 0.045)).toBe("2,0 bis 4,5");
    expect(intervalPerHundred(0.0004, 0.031)).toBe("unter 0,1 bis 3,1");
  });

  it("states the sentence the live region reads, with n and the meaning line separate", () => {
    const sentence = readoutSentence(predict(MODEL, MODEL.default));
    expect(sentence).toMatch(/^(Etwa [\d,]+|Weniger als 0,1) von 100 GmbH-Startseiten wie deine nennen KI, wahrscheinlich (unter 0,1|[\d,]+) bis [\d,]+\.$/);
  });

  it("shows no value below the k = 5 floor", () => {
    const tiny = { p: 0.01, lo: 0.002, hi: 0.04, support: 4, thin: true, pooledNotes: [] };
    expect(hasValue(tiny)).toBe(false);
    expect(supportText(tiny)).toBe("zu wenige Firmen, kein Wert");
    expect(readoutSentence(tiny)).toMatch(/keinen Wert/);
    expect(readoutSentence(tiny)).not.toMatch(/\d/);
  });

  it("prints a marginal count only from 60 firms", () => {
    expect(levelCountText({ id: "a", label: "A", n: 59, coef: 0, boot: [] })).toBeNull();
    expect(levelCountText({ id: "a", label: "A", n: 1400, coef: 0, boot: [] })).toBe("1.400 Firmen in dieser Gruppe");
  });
});

describe("fieldCounts", () => {
  it("fills whole squares and a partial square, never rounding up", () => {
    const counts = fieldCounts({ p: 0.0037, lo: 0.002, hi: 0.0061, support: 100, thin: false, pooledNotes: [] });
    expect(counts.solid).toBe(3);
    expect(counts.partial).toBeCloseTo(0.7, 5);
    expect(counts.bandFrom).toBe(2);
    expect(counts.bandTo).toBe(7);
  });

  it("is exact on a whole square and at the edges of the field", () => {
    expect(fieldCounts({ p: 0.03, lo: 0.02, hi: 0.05, support: 100, thin: false, pooledNotes: [] })).toMatchObject({ solid: 30, partial: 0, bandFrom: 20, bandTo: 50 });
    expect(fieldCounts({ p: 1, lo: 1, hi: 1, support: 100, thin: false, pooledNotes: [] })).toMatchObject({ solid: 1000, partial: 0, bandTo: 1000 });
  });
});

describe("staticTable", () => {
  it("holds Land and Größe at the default and covers every Branche and every fifth", () => {
    const table = staticTable(MODEL);
    expect(table.rowLabels).toHaveLength(8);
    expect(table.columnLabels).toHaveLength(5);
    expect(table.cells.every((row) => row.length === 5)).toBe(true);
    expect(table.fixed).toBe("Bayern, 5 bis 9 Vertretungsberechtigte");
    expect(table.cells[1]![2]).toMatch(/^(unter 0,1|[\d,]+) \((unter 0,1|[\d,]+) bis [\d,]+\)$/);
  });
});
