import { describe, expect, it } from "vitest";
import {
  ACCOUNT_ROUTES,
  EXAMPLE_ROUTES,
  LEARNING_ROUTES,
  OPEN_SOURCE_ROUTES,
  PRACTICE_ROUTES,
  WORKSHOP_ROUTES,
  matchesSection,
} from "./site-sections";

describe("site sections", () => {
  it("matches a section path, the pages below it, and its English mirror", () => {
    expect(matchesSection(LEARNING_ROUTES, "/ki-fuehrerschein")).toBe(true);
    expect(matchesSection(LEARNING_ROUTES, "/ki-fuehrerschein/kurs/1")).toBe(
      true,
    );
    expect(matchesSection(LEARNING_ROUTES, "/en/buecher/ki-landschaft")).toBe(
      true,
    );
    expect(matchesSection(PRACTICE_ROUTES, "/workshops/esg-berichte-mit-ki")).toBe(
      true,
    );
    expect(matchesSection(PRACTICE_ROUTES, "/en/demos/excel")).toBe(true);
    expect(
      matchesSection(PRACTICE_ROUTES, "/open-source/lizenzrichtlinie"),
    ).toBe(true);
  });

  it("never matches on a shared string prefix alone", () => {
    expect(matchesSection(EXAMPLE_ROUTES, "/demosammlung")).toBe(false);
    expect(matchesSection(LEARNING_ROUTES, "/kursebesteller")).toBe(false);
    expect(matchesSection(ACCOUNT_ROUTES, "/login-hilfe")).toBe(false);
  });

  it("matches the root only exactly", () => {
    expect(matchesSection(["/"], "/")).toBe(true);
    expect(matchesSection(["/"], "/en")).toBe(true);
    expect(matchesSection(["/"], "/kurse")).toBe(false);
  });

  it("matches nothing without a valid pathname", () => {
    expect(matchesSection(LEARNING_ROUTES, null)).toBe(false);
    expect(matchesSection(LEARNING_ROUTES, undefined)).toBe(false);
  });

  it("keeps the sections disjoint, so one page never belongs to two", () => {
    const sections = [
      LEARNING_ROUTES,
      WORKSHOP_ROUTES,
      EXAMPLE_ROUTES,
      OPEN_SOURCE_ROUTES,
      ACCOUNT_ROUTES,
    ];
    const all = sections.flat();
    expect(new Set(all).size).toBe(all.length);
    for (const route of all) {
      const owners = sections.filter((section) =>
        matchesSection(section, route),
      );
      expect(owners, route).toHaveLength(1);
    }
    expect(PRACTICE_ROUTES).toEqual([
      ...WORKSHOP_ROUTES,
      ...EXAMPLE_ROUTES,
      ...OPEN_SOURCE_ROUTES,
    ]);
  });
});
