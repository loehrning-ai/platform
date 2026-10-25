import { describe, expect, it } from "vitest";
import { parseList, parseNumber, parseOptional, sanitizeName, slugify } from "./parse";

describe("parseNumber", () => {
  it.each([
    ["-19.960", -19_960],
    ["−19.960", -19_960],
    ["+9.775", 9_775],
    ["(19.960)", -19_960],
    ["1,234.56", 1_234.56],
    ["1.234,56", 1_234.56],
    ["1,234,567", 1_234_567],
    ["1234.5", 1_234.5],
    ["12,5", 12.5],
    ["1,25", 1.25],
    ["3.5", 3.5],
    ["0", 0],
  ])("reads %s", (text, value) => {
    expect(parseNumber(text)).toBe(value);
  });

  it.each(["12k", "1 Mio", "1.2.3", "", "=1+1", "<script>", "1e5", "--3", "(−3)", "NaN", "Infinity", "9".repeat(14), "1,234", "1,2345", "1.234,567"])(
    "rejects %j",
    (text) => {
      expect(parseNumber(text)).toBeNull();
    },
  );
});

describe("parseList", () => {
  const ok = (values: number[]) => ({ ok: true, values });
  it("reads the example in every separator", () => {
    const expected = ok([-19_960, 9_775, 42_565]);
    expect(parseList("-19.960;9.775;42.565")).toEqual(expected);
    expect(parseList("-19.960\t9.775\t42.565")).toEqual(expected);
    expect(parseList("-19.960\n9.775\r\n42.565\n")).toEqual(expected);
    expect(parseList("−19.960, 9.775, 42.565")).toEqual(expected);
    expect(parseList("−19.960   9.775   42.565")).toEqual(expected);
    expect(parseList("−19.960 9.775 42.565")).toEqual(expected);
  });
  it("accepts 3 to 6 values only", () => {
    expect(parseList("1;2").ok).toBe(false);
    expect(parseList("1;2;3;4;5;6").ok).toBe(true);
    expect(parseList("1;2;3;4;5;6;7").ok).toBe(false);
    expect(parseList("").ok).toBe(false);
  });
  it("reads decimals and says why a paste fails", () => {
    expect(parseList("1,2 3,4 5,6")).toEqual({ ok: true, values: [1.2, 3.4, 5.6] });
    expect(parseList("1;2")).toEqual({ ok: false, reason: "count" });
    expect(parseList("1;2;3;4;5;6;7")).toEqual({ ok: false, reason: "count" });
    expect(parseList("1;2;12k")).toEqual({ ok: false, reason: "token" });
  });
  it("rejects the whole paste when one token is bad, and injection strings", () => {
    expect(parseList("1;2;12k").ok).toBe(false);
    expect(parseList("1;2;1 Mio").ok).toBe(false);
    expect(parseList("=1+1;2;3").ok).toBe(false);
    expect(parseList("<script>;2;3").ok).toBe(false);
    expect(parseList("1;2;1.2.3").ok).toBe(false);
  });
});

describe("parseOptional and names", () => {
  it("allows empty, rejects garbage", () => {
    expect(parseOptional("")).toBeNull();
    expect(parseOptional("354.635")).toBe(354_635);
    expect(parseOptional("abc")).toBeUndefined();
  });
  it("sanitizes names to the allow-list and 40 characters", () => {
    expect(sanitizeName("ending_mrr<script>alert(1)</script>")).toBe("ending_mrrscriptalert1script");
    expect(sanitizeName("Größe Ümsatz.2026-Q2")).toBe("Größe Ümsatz.2026-Q2");
    expect(sanitizeName("a".repeat(60))).toHaveLength(40);
  });
  it("makes a snake_case slug", () => {
    expect(slugify("Ending MRR")).toBe("ending_mrr");
    expect(slugify("Größe")).toBe("groesse");
    expect(slugify("!!!")).toBe("metric");
  });
});
