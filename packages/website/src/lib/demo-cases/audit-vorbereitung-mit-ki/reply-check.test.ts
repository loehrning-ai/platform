import { describe, expect, it } from "vitest";
import { draftClaims, sampleReply } from "./case";
import { buildModel } from "./model";
import { draftChecks, HUNT_RULES, huntMistakes, kitMistakes, kitRule, sampleReplyOf } from "./reply-check";

describe("W05 scene 6: the draft reply, read from the kit", () => {
  it("checks the draft's four sentences, and none of them holds", () => {
    for (const locale of ["de", "en"] as const) {
      const checks = draftChecks(locale);
      expect(checks.map((check) => check.n)).toEqual([1, 2, 3, 4]);
      expect(checks.map((check) => check.claim)).toEqual(draftClaims());
      expect(new Set(checks.map((check) => check.verdict))).toEqual(new Set([locale === "de" ? "STREICHEN" : "DELETE"]));
      expect(checks.every((check) => check.evidence.length > 0)).toBe(true);
    }
  });

  it("the evidence of sentence 1 is the engine's own count of trained staff", () => {
    const { r5 } = buildModel();
    const { unique, staff } = r5.tests.quote.figures;
    expect(draftChecks("en")[0]?.evidence).toBe(`training-records: ${unique} of ${staff}`);
    expect(draftChecks("de")[0]?.evidence).toBe(`training-records: ${unique} von ${staff}`);
  });

  it("the sample reply is the same in both kits and never repeats a struck claim", () => {
    expect(sampleReplyOf("de")).toBe(sampleReplyOf("en"));
    expect(sampleReplyOf("en")).toBe(sampleReply());
    for (const banned of ["all staff", "every quarter", "tested regularly", "stays in the EU", "compliant"]) expect(sampleReplyOf("en")).not.toContain(banned);
  });
});

describe("W05 scene 5: the mistake hunt, read from the kit", () => {
  it("lists six mistakes in each kit, with the same rules", () => {
    expect(kitMistakes("de").map((entry) => entry.rule)).toEqual(kitMistakes("en").map((entry) => entry.rule));
    expect(kitMistakes("en")).toHaveLength(6);
  });

  it("takes the deck's four, each with its rule text from the project instructions", () => {
    for (const locale of ["de", "en"] as const) {
      expect(huntMistakes(locale).map((entry) => entry.rule)).toEqual([...HUNT_RULES]);
      for (const rule of HUNT_RULES) expect(kitRule(locale, rule).length).toBeGreaterThan(20);
    }
    expect(kitRule("en", 12)).toMatch(/^Use section numbers only from request_tannwald\.md\./);
    expect(kitRule("de", 7)).toMatch(/^FREIGABE:/);
  });
});
