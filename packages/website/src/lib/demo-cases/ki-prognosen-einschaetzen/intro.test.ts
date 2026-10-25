import { describe, expect, it } from "vitest";
import { GHOST_FROM, INTRO_MS, introFrame } from "./intro";
import { scenarios, shortCount } from "./quantile";

const BAND = { p10: 980, p50: 1180, p90: 1320 };
const frame = (P: number, user: number | null = null) =>
  introFrame(P, user, 1180, 1050);
const count = (P: number) => {
  const f = frame(P);
  return shortCount(scenarios(BAND), f.cap, f.visible);
};

describe("introFrame", () => {
  it("is a pure function that runs 4.4 s", () => {
    expect(INTRO_MS).toBe(4400);
    expect(frame(0.3)).toEqual(frame(0.3));
  });

  it("scans the hundred weeks from the left and is done by the time the ghost starts", () => {
    expect(frame(0).visible).toBe(0);
    expect(frame(0.03).visible).toBe(0);
    expect(frame(0.215).visible).toBe(50);
    expect(frame(0.4).visible).toBe(100);
    expect(frame(GHOST_FROM).visible).toBe(100);
  });

  it("counts the short weeks in step with the scan, ending on 76 of 100", () => {
    let previous = 0;
    for (let P = 0; P <= 0.4; P += 0.01) {
      const next = count(P);
      expect(next).toBeGreaterThanOrEqual(previous);
      previous = next;
    }
    expect(count(0.1)).toBeLessThan(76);
    expect(count(0.45)).toBe(76);
  });

  it("holds the line at 1.050 during the scan", () => {
    for (const P of [0, 0.1, 0.3, 0.45]) expect(frame(P).cap).toBe(1050);
  });

  it("holds the ghost on the 1.180 mark at 50 of 100", () => {
    const f = frame(0.76);
    expect(f.ghostCap).toBe(1180);
    expect(f.ghostVisible).toBe(true);
    expect(count(0.76)).toBe(50);
  });

  it("returns to 1.050 and ends in the hero state", () => {
    const end = frame(1);
    expect(end.cap).toBe(1050);
    expect(end.visible).toBe(100);
    expect(end.ghostVisible).toBe(false);
  });

  it("lets the visitor's cap win without a jump", () => {
    const ghost = frame(0.6).ghostCap;
    expect(frame(0.6, ghost).cap).toBe(ghost);
    expect(frame(0.6, 1234).cap).toBe(1234);
    expect(frame(0.6, 1234).ghostVisible).toBe(false);
  });

  it("moves monotonically up while the ghost lifts the line", () => {
    let previous = frame(0.52).ghostCap;
    for (let P = 0.53; P <= 0.7; P += 0.01) {
      const next = frame(P).ghostCap;
      expect(next).toBeGreaterThanOrEqual(previous);
      previous = next;
    }
  });
});
