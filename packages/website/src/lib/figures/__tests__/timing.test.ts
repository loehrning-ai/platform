import { describe, expect, it } from "vitest";
import {
  activeStep, focusIds, frameReveal, reveal, revealWindow, segment, stepCount, stepProgress,
} from "../timing.ts";

const steps = [
  { id: "a", label: "A", reveal: ["x"], focus: ["x"] },
  { id: "b", label: "B", reveal: ["y", "z"], focus: ["y"] },
  { id: "c", label: "C" },
  { id: "d", label: "D", reveal: ["w"] },
];

describe("segment", () => {
  it("is linear between start and end", () => {
    expect(segment(0, 0.2, 0.6)).toBe(0);
    expect(segment(0.4, 0.2, 0.6)).toBeCloseTo(0.5);
    expect(segment(1, 0.2, 0.6)).toBe(1);
  });

  it("handles an empty window", () => {
    expect(segment(0.4, 0.5, 0.5)).toBe(0);
    expect(segment(0.5, 0.5, 0.5)).toBe(1);
  });
});

describe("reveal windows", () => {
  it("spreads unlisted elements evenly and finishes by progress 1", () => {
    const first = revealWindow({}, "a", 0, 5);
    const last = revealWindow({}, "e", 4, 5);
    expect(first.start).toBe(0);
    expect(last.end).toBeCloseTo(1);
    expect(last.start).toBeGreaterThan(first.start);
  });

  it("puts a single element at the start", () => {
    expect(revealWindow({}, "a", 0, 1).start).toBe(0);
  });

  it("places named elements inside their step", () => {
    const x = revealWindow({ steps }, "x", 0, 4);
    const y = revealWindow({ steps }, "y", 1, 4);
    const w = revealWindow({ steps }, "w", 3, 4);
    expect(x.start).toBe(0);
    expect(x.end).toBe(0.25);
    expect(y.start).toBeGreaterThanOrEqual(0.25);
    expect(y.end).toBe(0.5);
    expect(w.start).toBe(0.75);
    expect(w.end).toBe(1);
  });

  it("shows every element fully at progress 1 and none at 0", () => {
    for (const id of ["x", "y", "z", "w", "q"]) {
      expect(reveal({ steps }, 1, id, 2, 5)).toBe(1);
      expect(reveal({ steps }, 0, id, 2, 5)).toBe(0);
    }
  });

  it("fades frames in quickly", () => {
    expect(frameReveal(0)).toBe(0);
    expect(frameReveal(0.1)).toBe(1);
  });
});

describe("steps", () => {
  it("counts steps and maps them to progress", () => {
    expect(stepCount({ steps })).toBe(4);
    expect(stepCount({})).toBe(0);
    expect(stepProgress({ steps }, 0)).toBe(0.25);
    expect(stepProgress({ steps }, 3)).toBe(1);
    expect(stepProgress({}, 0)).toBe(1);
  });

  it("finds the active step", () => {
    expect(activeStep({ steps }, 0)).toBe(0);
    expect(activeStep({ steps }, 0.25)).toBe(0);
    expect(activeStep({ steps }, 0.26)).toBe(1);
    expect(activeStep({ steps }, 0.5)).toBe(1);
    expect(activeStep({ steps }, 1)).toBe(3);
    expect(activeStep({}, 0.5)).toBe(-1);
  });

  it("emphasises the focus of the active step, never at progress 1", () => {
    expect(focusIds({ steps }, 0.3)).toEqual(new Set(["y"]));
    expect(focusIds({ steps }, 0.6)).toBeNull();
    expect(focusIds({ steps }, 1)).toBeNull();
    expect(focusIds({}, 0.5)).toBeNull();
  });
});
