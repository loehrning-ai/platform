import { describe, expect, it } from "vitest";
import { barRise, messlatteFrame, planFrame, sweep, tipFor } from "./timeline";

const samples = Array.from({ length: 101 }, (_, i) => i / 100);

describe("the stage is a pure function of p", () => {
  it("starts empty and ends full", () => {
    expect(barRise(0, 104, 0)).toBe(0);
    expect(barRise(103, 104, 1)).toBe(1);
    expect(messlatteFrame(0, 50, 85, 92.6)).toEqual({ shift: 0, counter: 85, revealed: 0 });
    expect(messlatteFrame(1, 50, 85, 92.6)).toEqual({ shift: 1, counter: 92.6, revealed: 50 });
    expect(sweep(0, 52)).toBe(0);
    expect(sweep(1, 52)).toBe(52);
    expect(planFrame(0, 26)).toEqual({ jars: 0, line: 0 });
    expect(planFrame(1, 26)).toEqual({ jars: 26, line: 1 });
  });

  it("never takes back what it revealed", () => {
    let last = { revealed: -1, sweep: -1, jars: -1, rise: -1 };
    for (const p of samples) {
      const now = { revealed: messlatteFrame(p, 50, 75, 92.6).revealed, sweep: sweep(p, 52), jars: planFrame(p, 26).jars, rise: barRise(50, 104, p) };
      expect(now.revealed).toBeGreaterThanOrEqual(last.revealed);
      expect(now.sweep).toBeGreaterThanOrEqual(last.sweep);
      expect(now.jars).toBeGreaterThanOrEqual(last.jars);
      expect(now.rise).toBeGreaterThanOrEqual(last.rise);
      last = now;
    }
  });

  it("reads a range tip against the promise", () => {
    expect(tipFor(36, 40)).toBe("fewer");
    expect(tipFor(40, 40)).toBe("about");
    expect(tipFor(44, 40)).toBe("more");
  });
});
