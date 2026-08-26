import { describe, expect, it } from "vitest";
import { makeSeedSeries } from "./observ-demo";

/**
 * observ-demo.test.ts (regression coverage)
 *
 * The initial series is deterministic so server and client render the same
 * illustrative chart. These tests retain its structural invariants.
 */

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

  it("returns the same initial series for the same inputs", () => {
    expect(makeSeedSeries(60, 1.2, 0.4)).toEqual(makeSeedSeries(60, 1.2, 0.4));
  });
});
