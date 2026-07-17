/**
 * vorlagen-shared.test.ts (regression coverage)
 *
 * Guards the two category lookup tables that drive the Governance-Vorlagen
 * surface. The load-bearing invariant is cross-consistency: `CATEGORY_LABELS`
 * and `CATEGORY_DESCRIPTIONS` must cover exactly the same set of
 * `VorlageCategory` values. Adding a category to one table but not the other is
 * a real, silent bug (a category tile would render a label with no description,
 * or vice versa), so this drift check earns its keep.
 */

import { describe, expect, it } from "vitest";
import {
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
} from "@/lib/vorlagen-shared";

const EXPECTED_CATEGORIES = ["pflicht", "hygiene", "werkzeug"] as const;

describe("vorlagen category tables", () => {
  it("labels cover exactly the three known categories", () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual(
      [...EXPECTED_CATEGORIES].sort(),
    );
  });

  it("labels and descriptions share the same key set (no drift)", () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual(
      Object.keys(CATEGORY_DESCRIPTIONS).sort(),
    );
  });

  it("maps every category to a non-empty label and description", () => {
    for (const category of EXPECTED_CATEGORIES) {
      expect(CATEGORY_LABELS[category].trim().length).toBeGreaterThan(0);
      expect(CATEGORY_DESCRIPTIONS[category].trim().length).toBeGreaterThan(0);
    }
  });

  it("uses the canonical German labels", () => {
    expect(CATEGORY_LABELS.pflicht).toBe("Compliance-Pflicht");
    expect(CATEGORY_LABELS.hygiene).toBe("Governance-Hygiene");
    expect(CATEGORY_LABELS.werkzeug).toBe("Operative Werkzeuge");
  });

  it("keeps real umlauts in the descriptions (no ASCII substitution)", () => {
    // Both hygiene and werkzeug descriptions contain "fuer" spelled with a real
    // u-umlaut; a regression to "fuer" would violate the project umlaut rule.
    expect(CATEGORY_DESCRIPTIONS.hygiene).toContain("für");
    expect(CATEGORY_DESCRIPTIONS.werkzeug).toContain("für");
    expect(CATEGORY_DESCRIPTIONS.hygiene).not.toMatch(/\bfuer\b/);
  });
});
