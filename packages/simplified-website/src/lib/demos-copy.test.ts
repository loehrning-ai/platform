/**
 * demos-copy.test.ts (regression coverage)
 *
 * Exercises the demo-narrative copy layer in `@/lib/demos-copy`: the
 * `getDemoCopy` lookup and the content invariants of the `demoCopy` record.
 *
 * The high-value assertions are cross-checks against the structural
 * `@/lib/demos` metadata (the single source of truth for which demos exist):
 *  - every demo listed in demos.ts must have narrative copy, otherwise the
 *    /demos/[slug] detail page renders an empty body;
 *  - no orphan copy entries point at a slug that is not a real demo;
 *  - every `proof` string is a declared "Sandbox-Szenario" (the module contract
 *    documented in the file header: proof is always an illustrative sandbox
 *    example, never client proof).
 */

import { describe, expect, it } from "vitest";
import { demoCopy, getDemoCopy } from "@/lib/demos-copy";
import { demos, getDemoBySlug } from "@/lib/demos";

describe("getDemoCopy", () => {
  it("returns the copy object for a known slug", () => {
    const copy = getDemoCopy("excel");
    expect(copy).toBeDefined();
    // Returns the exact record entry (same reference), not a copy.
    expect(copy).toBe(demoCopy.excel);
    expect(copy?.ogSubtitle).toBe("Excel-Lab: Formel, Pivot, Prognose im Beispiel.");
    expect(copy?.why).toContain("Excel");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getDemoCopy("gibt-es-nicht")).toBeUndefined();
  });

  it("returns undefined for an empty slug", () => {
    expect(getDemoCopy("")).toBeUndefined();
  });
});

describe("demoCopy record integrity", () => {
  it("has non-empty why, proof and ogSubtitle for every entry", () => {
    for (const [slug, copy] of Object.entries(demoCopy)) {
      expect(copy.why.trim().length, `${slug}.why`).toBeGreaterThan(0);
      expect(copy.proof.trim().length, `${slug}.proof`).toBeGreaterThan(0);
      expect(copy.ogSubtitle.trim().length, `${slug}.ogSubtitle`).toBeGreaterThan(0);
    }
  });

  it("frames every proof as a Sandbox-Szenario (honest-demo contract)", () => {
    for (const [slug, copy] of Object.entries(demoCopy)) {
      expect(copy.proof, `${slug}.proof`).toMatch(/^Sandbox-Szenario:/);
    }
  });
});

describe("demoCopy <-> demos coverage", () => {
  it("provides copy for every demo declared in demos.ts", () => {
    for (const demo of demos) {
      expect(
        getDemoCopy(demo.slug),
        `missing demo copy for slug "${demo.slug}"`,
      ).toBeDefined();
    }
  });

  it("has no orphan copy entry pointing at a non-existent demo", () => {
    for (const slug of Object.keys(demoCopy)) {
      expect(
        getDemoBySlug(slug),
        `demoCopy has orphan entry "${slug}" with no matching demo`,
      ).toBeDefined();
    }
  });

  it("copy key set exactly matches the demo slug set", () => {
    const copySlugs = Object.keys(demoCopy).sort();
    const demoSlugs = demos.map((d) => d.slug).sort();
    expect(copySlugs).toEqual(demoSlugs);
  });
});
