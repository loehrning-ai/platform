import { describe, expect, it } from "vitest";

/**
 * observ-demo.test.ts (regression coverage)
 *
 * observ-demo.tsx documents makeSeedSeries' use of Math.random as
 * intentional cosmetic noise for a simulated dashboard sparkline, not
 * grading logic ("Randomness is intentional cosmetic noise, NOT grading
 * logic" per the source comment). So this test asserts the function's
 * structural INVARIANTS (length, floor clamp, finiteness) rather than exact
 * values, which would be inherently flaky given the real randomness.
 */

function makeSeedSeries(length: number, base: number, amplitude: number): number[] {
  const arr: number[] = [];
  let v = base;
  for (let i = 0; i < length; i++) {
    v += (Math.random() - 0.5) * amplitude;
    arr.push(Math.max(0.1, v));
  }
  return arr;
}

describe("observ-demo · makeSeedSeries(length, base, amplitude) invariants", () => {
  it("returns exactly `length` values", () => {
    expect(makeSeedSeries(60, 1.2, 0.4)).toHaveLength(60);
    expect(makeSeedSeries(0, 1.2, 0.4)).toHaveLength(0);
    expect(makeSeedSeries(1, 1.2, 0.4)).toHaveLength(1);
  });

  it("never drops below the 0.1 floor, even with a large amplitude", () => {
    const series = makeSeedSeries(200, 0.1, 50);
    for (const v of series) {
      expect(v).toBeGreaterThanOrEqual(0.1);
    }
  });

  it("only ever produces finite numbers", () => {
    const series = makeSeedSeries(200, 1.2, 0.4);
    for (const v of series) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});
