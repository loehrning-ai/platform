import { describe, it, expect } from "vitest";
import { computeF1 } from "./pii-spotter";

describe("pii-spotter · computeF1", () => {
  it("perfect match → 1.0", () => {
    const truth = new Set([1, 3, 5]);
    const sel = new Set([1, 3, 5]);
    const r = computeF1(sel, truth);
    expect(r.f1).toBe(1);
    expect(r.precision).toBe(1);
    expect(r.recall).toBe(1);
  });

  it("no overlap → 0", () => {
    const truth = new Set([1, 3, 5]);
    const sel = new Set([2, 4, 6]);
    const r = computeF1(sel, truth);
    expect(r.f1).toBe(0);
  });

  it("half recall + full precision", () => {
    const truth = new Set([1, 2, 3, 4]);
    const sel = new Set([1, 2]);
    const r = computeF1(sel, truth);
    expect(r.precision).toBe(1);
    expect(r.recall).toBe(0.5);
    expect(r.f1).toBeCloseTo(0.6666, 3);
  });

  it("full recall + half precision", () => {
    const truth = new Set([1, 2]);
    const sel = new Set([1, 2, 3, 4]);
    const r = computeF1(sel, truth);
    expect(r.precision).toBe(0.5);
    expect(r.recall).toBe(1);
    expect(r.f1).toBeCloseTo(0.6666, 3);
  });

  it("both empty → 1 (trivially correct)", () => {
    const r = computeF1(new Set(), new Set());
    expect(r.f1).toBe(1);
  });

  it("only selection empty → 0", () => {
    const r = computeF1(new Set(), new Set([1, 2]));
    expect(r.f1).toBe(0);
  });

  it("is deterministic — same inputs 2× = same result", () => {
    const truth = new Set([1, 3]);
    const sel = new Set([1, 3, 7]);
    const a = computeF1(sel, truth);
    const b = computeF1(sel, truth);
    expect(a).toEqual(b);
  });
});
