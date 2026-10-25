import { describe, expect, it } from "vitest";
import {
  followSupply,
  parseNumber,
  supplyRelation,
  validateOwn,
  type RawCase,
} from "./validate";

describe("parseNumber", () => {
  it("reads German input", () => {
    expect(parseNumber("1.180", "de")).toBe(1180);
    expect(parseNumber("1180", "de")).toBe(1180);
    expect(parseNumber("1180,5", "de")).toBe(1180.5);
    expect(parseNumber("1.180.000", "de")).toBe(1180000);
    expect(parseNumber("1.180,5", "de")).toBe(1180.5);
    expect(parseNumber(" 980 ", "de")).toBe(980);
  });

  it("reads English input", () => {
    expect(parseNumber("1,180", "en")).toBe(1180);
    expect(parseNumber("1180", "en")).toBe(1180);
    expect(parseNumber("1180.5", "en")).toBe(1180.5);
    expect(parseNumber("1,180.5", "en")).toBe(1180.5);
  });

  it("calls a separator with a wrong-sized group ambiguous: NaN, not a misread number", () => {
    expect(parseNumber("1.1801", "de")).toBeNaN();
    expect(parseNumber("1,1801", "en")).toBeNaN();
    expect(parseNumber("1234.567", "de")).toBeNaN();
    expect(parseNumber("1180.5", "de")).toBe(1180.5);
  });

  it("treats a lone 1.5 as a decimal, not a thousand", () => {
    expect(parseNumber("1.5", "de")).toBe(1.5);
    expect(parseNumber("1.5", "en")).toBe(1.5);
    expect(parseNumber("1,5", "de")).toBe(1.5);
  });

  it("returns NaN for empty and garbage and keeps the sign", () => {
    for (const bad of ["", "  ", "abc", "1.2.3,4,5", "12a", "1e3", "--1"]) {
      expect(parseNumber(bad, "de"), bad).toBeNaN();
    }
    expect(parseNumber("-5", "de")).toBe(-5);
  });
});

const GOOD: RawCase = {
  p10: "980",
  p50: "1.180",
  p90: "1.320",
  supply: "1.050",
  ratio: "3",
  unit: "",
};

describe("validateOwn", () => {
  it("accepts a good case", () => {
    expect(validateOwn(GOOD, "de")).toEqual({
      ok: true,
      value: {
        band: { p10: 980, p50: 1180, p90: 1320 },
        supply: 1050,
        ratio: 3,
        unit: "",
      },
    });
  });

  it("uses the fallback weight for an empty Gewicht", () => {
    const result = validateOwn({ ...GOOD, ratio: "" }, "de");
    expect(result.ok && result.value.ratio).toBe(3);
  });

  const errorsOf = (raw: RawCase, locale: "de" | "en" = "de") => {
    const result = validateOwn(raw, locale);
    return result.ok
      ? []
      : result.errors.map((error) => `${error.field}:${error.key}`);
  };

  it("flags order, number, negative, ratio and unit", () => {
    expect(errorsOf({ ...GOOD, p10: "1.200" })).toEqual(["p50:order"]);
    expect(errorsOf({ ...GOOD, p50: "980" })).toEqual(["p50:order"]);
    expect(errorsOf({ ...GOOD, p90: "" })).toEqual(["p90:number"]);
    expect(errorsOf({ ...GOOD, supply: "abc" })).toEqual(["supply:number"]);
    expect(errorsOf({ ...GOOD, p10: "-5" })).toEqual(["p10:negative"]);
    expect(errorsOf({ ...GOOD, ratio: "0,5" })).toEqual(["ratio:ratio"]);
    expect(errorsOf({ ...GOOD, ratio: "21" })).toEqual(["ratio:ratio"]);
    expect(errorsOf({ ...GOOD, unit: "dreizehn Zeich" })).toEqual([
      "unit:unit",
    ]);
  });

  it("accepts 0 as stock and a 12 character unit, and reads English separators", () => {
    expect(
      validateOwn({ ...GOOD, supply: "0", unit: "123456789012" }, "de").ok,
    ).toBe(true);
    const en = validateOwn(
      { ...GOOD, p50: "1,180", p90: "1,320", supply: "1,050" },
      "en",
    );
    expect(en.ok && en.value.band.p90).toBe(1320);
  });

  it("reports every broken field at once", () => {
    expect(errorsOf({ ...GOOD, p10: "x", supply: "-1", ratio: "99" })).toEqual([
      "p10:number",
      "supply:negative",
      "ratio:ratio",
    ]);
  });
});

describe("supplyRelation", () => {
  const band = { p10: 980, p50: 1180, p90: 1320 };
  it("is inside from p10 to p90, near up to 30 percent of the spread beyond, far after", () => {
    expect(supplyRelation(band, 1050)).toBe("inside");
    expect(supplyRelation(band, 980)).toBe("inside");
    expect(supplyRelation(band, 1320)).toBe("inside");
    expect(supplyRelation(band, 900)).toBe("near");
    expect(supplyRelation(band, 1400)).toBe("near");
    expect(supplyRelation(band, 800)).toBe("far");
    expect(supplyRelation(band, 1500)).toBe("far");
  });
  it("flags the dead own case: stock 1.050 against 400 / 500 / 700", () => {
    expect(supplyRelation({ p10: 400, p50: 500, p90: 700 }, 1050)).toBe("far");
  });
});

describe("followSupply", () => {
  const raw = (p10: string, p50: string, p90: string, supply: string) => ({
    p10,
    p50,
    p90,
    supply,
    ratio: "3",
    unit: "",
  });
  it("moves a stock outside the new range onto the forecast", () => {
    expect(followSupply(raw("400", "500", "700", "1.050"), "de")).toBe("500");
    expect(followSupply(raw("1.500", "2.000", "2.400", "1.050"), "de")).toBe(
      "2.000",
    );
    expect(followSupply(raw("1,500", "2,000", "2,400", "1,050"), "en")).toBe(
      "2,000",
    );
  });
  it("keeps a stock inside the range", () => {
    expect(followSupply(raw("980", "1.180", "1.320", "1.050"), "de")).toBeNull();
  });
  it("waits while the three fields do not form a range", () => {
    expect(followSupply(raw("400", "5", "700", "1.050"), "de")).toBeNull();
    expect(followSupply(raw("", "500", "700", "1.050"), "de")).toBeNull();
  });
  it("replaces a stock that is not a number", () => {
    expect(followSupply(raw("400", "500", "700", ""), "de")).toBe("500");
  });
});
