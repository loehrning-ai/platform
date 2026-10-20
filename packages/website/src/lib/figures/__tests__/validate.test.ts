import { describe, expect, it } from "vitest";
import { FigureSpecError, findPrivacyFindings, parseFigureSpec } from "../validate.ts";
import { ALL_FIXTURES, BARS_H, FUNNEL, WAFFLE, WATERFALL } from "./fixtures.ts";

const clone = <T,>(value: T): Record<string, unknown> => JSON.parse(JSON.stringify(value));

describe("parseFigureSpec", () => {
  it.each(ALL_FIXTURES.map((spec) => [spec.id, spec] as const))("accepts %s after a JSON round trip", (_id, spec) => {
    expect(parseFigureSpec(clone(spec))).toEqual(clone(spec));
  });

  it("rejects a missing alt text", () => {
    const bad = clone(BARS_H);
    delete bad["alt"];
    expect(() => parseFigureSpec(bad)).toThrow(FigureSpecError);
    expect(() => parseFigureSpec(bad)).toThrow(/spec\.alt/);
  });

  it("rejects an unknown kind and a bad date", () => {
    expect(() => parseFigureSpec({ ...clone(BARS_H), kind: "pie" })).toThrow(/spec\.kind/);
    expect(() => parseFigureSpec({ ...clone(BARS_H), asOf: "18.10.2026" })).toThrow(/spec\.asOf/);
  });

  it("rejects non-objects and a negative n", () => {
    expect(() => parseFigureSpec(null)).toThrow(/spec/);
    expect(() => parseFigureSpec({ ...clone(BARS_H), n: -1 })).toThrow(/spec\.n/);
    expect(() => parseFigureSpec({ ...clone(BARS_H), n: 1.5 })).toThrow(/spec\.n/);
  });

  it("rejects duplicate ids", () => {
    const bad = clone(BARS_H);
    const data = bad["data"] as { items: { id: string }[] };
    data.items[1]!.id = data.items[0]!.id;
    expect(() => parseFigureSpec(bad)).toThrow(/duplicate id/);
  });

  it("rejects waffle dots beyond the total", () => {
    const bad = clone(WAFFLE);
    ((bad["data"] as { groups: { dots: number }[] }).groups[0]!).dots = 99;
    expect(() => parseFigureSpec(bad)).toThrow(/exceed total/);
  });

  it("rejects funnel points under 5 firms", () => {
    const bad = clone(FUNNEL);
    ((bad["data"] as { points: { n: number }[] }).points[0]!).n = 3;
    expect(() => parseFigureSpec(bad)).toThrow(/at least 5/);
  });

  it("rejects an unknown waterfall item kind", () => {
    const bad = clone(WATERFALL);
    ((bad["data"] as { items: { kind: string }[] }).items[0]!).kind = "sum";
    expect(() => parseFigureSpec(bad)).toThrow(/total or delta/);
  });

  it("reports the path of the failure", () => {
    try {
      parseFigureSpec({ ...clone(BARS_H), data: { fmt: { style: "percent" }, items: [{ id: "a", label: "A", value: "x" }] } });
      expect.unreachable();
    } catch (error) {
      expect((error as FigureSpecError).path).toBe("data.items[0].value");
    }
  });
});

describe("privacy findings", () => {
  it.each(ALL_FIXTURES.map((spec) => [spec.id, spec] as const))("finds nothing in %s", (_id, spec) => {
    expect(findPrivacyFindings(spec)).toEqual([]);
  });

  it("flags counts between 1 and 4 but not 0 or 5", () => {
    const spec = { n: 3, data: { items: [{ n: 4, hits: 2 }, { n: 0, hits: 5 }, { count: 1 }] } };
    const paths = findPrivacyFindings(spec).map((f) => f.path);
    expect(paths).toEqual(["n", "data.items[0].n", "data.items[0].hits", "data.items[2].count"]);
  });

  it("does not flag percent values or dots", () => {
    expect(findPrivacyFindings({ data: { value: 2, dots: 3, lo: 1 } })).toEqual([]);
  });

  it("flags contact data, URLs, paths, domains and the retired brand", () => {
    const reasons = (text: string) => findPrivacyFindings({ label: text }).map((f) => f.reason);
    expect(reasons("mail an kontakt@example.org")).toContain("e-mail address");
    expect(reasons("siehe https://example.com/x")).toContain("URL");
    expect(reasons("www.beispiel.de")).toContain("web address");
    expect(reasons("Telefon +49 911 1234567")).toContain("phone number");
    expect(reasons(`/${"Users"}/someone/x`)).toContain("internal path");
    expect(reasons(`${"maven"}gence_obsidian`)).toContain("internal path");
    expect(reasons(`${"Digi"}fyde Score`)).toContain("retired brand");
    expect(reasons("beispiel-firma.de")).toContain("domain name");
  });

  it("allows a domain in a source line only", () => {
    expect(findPrivacyFindings({ source: "Statistisches Bundesamt, destatis.de" })).toEqual([]);
    expect(findPrivacyFindings({ caption: "destatis.de" }).map((f) => f.reason)).toContain("domain name");
  });

  it("does not mistake normal German text for a finding", () => {
    expect(findPrivacyFindings({ label: "Rund 4,0 % sagen KI. Das gilt seit 2025." })).toEqual([]);
  });
});
