import { describe, it, expect } from "vitest";
import {
  mulberry32,
  randn,
  clamp,
  lerp,
  round,
  normCdf,
  normInv,
  INK_MAP,
  inkOf,
} from "./sim-kit";

describe("data-science sim-kit ", () => {
  describe("mulberry32", () => {
    it("is deterministic: the same seed produces the same sequence", () => {
      const a = mulberry32(42);
      const b = mulberry32(42);
      const seqA = Array.from({ length: 10 }, () => a());
      const seqB = Array.from({ length: 10 }, () => b());
      expect(seqA).toEqual(seqB);
    });

    it("different seeds produce different sequences", () => {
      const a = mulberry32(42);
      const b = mulberry32(7);
      expect(a()).not.toBe(b());
    });

    it("matches the source algorithm's known first values for seed 42", () => {
      const rng = mulberry32(42);
      const first = rng();
      const second = rng();
      expect(first).toBeGreaterThanOrEqual(0);
      expect(first).toBeLessThan(1);
      expect(second).toBeGreaterThanOrEqual(0);
      expect(second).toBeLessThan(1);
      // Regression pin: locks the exact port against source's bitwise algorithm.
      expect(first).toBeCloseTo(0.6011037519201636, 12);
      expect(second).toBeCloseTo(0.44829055899754167, 12);
    });

    it("matches the source algorithm's known first value for seed 7 (ThresholdSim's seed)", () => {
      const rng = mulberry32(7);
      expect(rng()).toBeCloseTo(0.011704753153026104, 12);
    });
  });

  describe("randn", () => {
    it("is deterministic given a deterministic rng", () => {
      const seqA = Array.from({ length: 5 }, () => randn(mulberry32(1)));
      const seqB = Array.from({ length: 5 }, () => randn(mulberry32(1)));
      expect(seqA).toEqual(seqB);
    });
  });

  describe("clamp/lerp/round", () => {
    it("clamp bounds a value", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it("lerp interpolates linearly", () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it("round rounds to d decimal places, default 2", () => {
      expect(round(1.23456)).toBe(1.23);
      expect(round(1.23456, 3)).toBe(1.235);
    });
  });

  describe("normCdf/normInv", () => {
    it("normCdf(0) is 0.5", () => {
      expect(normCdf(0)).toBeCloseTo(0.5, 4);
    });

    it("normCdf is symmetric around 0", () => {
      expect(normCdf(1.5) + normCdf(-1.5)).toBeCloseTo(1, 4);
    });

    it("normInv(0.5) is close to 0", () => {
      expect(normInv(0.5)).toBeCloseTo(0, 1);
    });

    it("normInv and normCdf roundtrip approximately", () => {
      const p = 0.975;
      const z = normInv(p);
      expect(normCdf(z)).toBeCloseTo(p, 2);
    });
  });

  describe("INK_MAP / inkOf", () => {
    it("has 41 entries ported verbatim from source", () => {
      expect(Object.keys(INK_MAP)).toHaveLength(41);
    });

    it("remaps known bright accent colors to their AA-readable ink twins", () => {
      expect(INK_MAP["#5B3EE8"]).toBe("#4A2FCC");
      expect(INK_MAP["#E8318F"]).toBe("#C8136F");
      expect(INK_MAP["#1FAF7E"]).toBe("#067751");
    });

    it("remaps muted grays authored for a dark theme", () => {
      expect(INK_MAP["#F4F2EC"]).toBe("#3A3540");
      expect(INK_MAP["#A49D9A"]).toBe("#6E6763");
    });

    it("inkOf looks up a mapped color case-insensitively", () => {
      expect(inkOf("#5b3ee8")).toBe("#4A2FCC");
      expect(inkOf("#5B3EE8")).toBe("#4A2FCC");
    });

    it("inkOf falls back to the original value when unmapped", () => {
      expect(inkOf("#123456")).toBe("#123456");
    });

    it("inkOf passes through falsy input unchanged", () => {
      expect(inkOf(undefined)).toBeUndefined();
      expect(inkOf(null)).toBeNull();
    });
  });
});
