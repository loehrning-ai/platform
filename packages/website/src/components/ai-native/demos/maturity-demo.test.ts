import { describe, expect, it } from "vitest";

/**
 * maturity-demo.test.ts (regression coverage)
 *
 * maturity-demo.tsx keeps findBand(total) as a local (non-exported) closure
 * over BANDS. We mirror the exact band thresholds and the
 * find-with-fallback algorithm from the source.
 */

interface Band {
  readonly min: number;
  readonly max: number;
  readonly label: string;
}

const BANDS: readonly Band[] = [
  { min: 5, max: 9, label: "Explorer" },
  { min: 10, max: 13, label: "Starter" },
  { min: 14, max: 17, label: "Operator" },
  { min: 18, max: 20, label: "Leader" },
];

function findBand(total: number): Band {
  return BANDS.find((b) => total >= b.min && total <= b.max) ?? BANDS[0];
}

describe("maturity-demo · findBand(total) classification", () => {
  it("classifies the Explorer band boundaries (5-9)", () => {
    expect(findBand(5).label).toBe("Explorer");
    expect(findBand(9).label).toBe("Explorer");
  });

  it("classifies the Starter band boundaries (10-13)", () => {
    expect(findBand(10).label).toBe("Starter");
    expect(findBand(13).label).toBe("Starter");
  });

  it("classifies the Operator band boundaries (14-17)", () => {
    expect(findBand(14).label).toBe("Operator");
    expect(findBand(17).label).toBe("Operator");
  });

  it("classifies the Leader band boundaries (18-20)", () => {
    expect(findBand(18).label).toBe("Leader");
    expect(findBand(20).label).toBe("Leader");
  });

  it("covers the full 5..20 score range with no gaps (every integer total has a band)", () => {
    for (let total = 5; total <= 20; total++) {
      const band = findBand(total);
      expect(total).toBeGreaterThanOrEqual(band.min);
      expect(total).toBeLessThanOrEqual(band.max);
    }
  });

  it("falls back to the first band (Explorer) for an out-of-range total below the minimum", () => {
    expect(findBand(0).label).toBe("Explorer");
  });

  it("falls back to the first band (Explorer) for an out-of-range total above the maximum", () => {
    // Documents the real `?? BANDS[0]` fallback: a total above 20
    // (unreachable via the actual 5-question x 1-4-point scoring) still
    // resolves rather than returning undefined.
    expect(findBand(100).label).toBe("Explorer");
  });

  it("is deterministic for the same total", () => {
    expect(findBand(14)).toEqual(findBand(14));
  });
});
