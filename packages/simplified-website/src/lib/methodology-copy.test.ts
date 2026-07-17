import { describe, expect, it } from "vitest";
import { glossary } from "./methodology-copy";
import { STAND_DATE, LAST_UPDATED } from "./content-meta";

describe("methodology-copy", () => {
  it("exposes stable date constants", () => {
    expect(STAND_DATE).toBe("Q3 2026");
    expect(LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("glossary covers learner-facing jargon terms", () => {
    const required = ["eu_ai_act"];
    for (const key of required) {
      expect(glossary[key]).toBeDefined();
      expect(glossary[key].label).toBeTruthy();
      expect(glossary[key].short.length).toBeGreaterThan(20);
    }
  });

  it("glossary does not contain commercial entries", () => {
    expect(glossary["digifyde"]).toBeUndefined();
    expect(glossary["bafa_faehig"]).toBeUndefined();
    expect(glossary["produktivsystem"]).toBeUndefined();
    expect(glossary["retainer"]).toBeUndefined();
    expect(glossary["reifegrad_score"]).toBeUndefined();
    expect(glossary["signale_137"]).toBeUndefined();
  });

  it("no em dashes in glossary short definitions", () => {
    for (const entry of Object.values(glossary)) {
      expect(entry.short).not.toMatch(/—/);
    }
  });
});
