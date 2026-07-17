import { describe, it, expect } from "vitest";
import { bestIndex, type PromptCandidate } from "./prompt-diff";

/**
 * prompt-diff.test.ts (regression coverage)
 *
 * Guards the pure grading helper `bestIndex` behind the Prompt-Diff-Triage
 * exercise: it returns the index of the highest-rated candidate. Mirrors the
 * sibling pure-grader tests (pii-spotter / workflow-builder). We drive it with
 * real PromptCandidate objects and assert the returned index, including the
 * tie-break and empty-list edges the source defends against.
 */

const cand = (rating: PromptCandidate["rating"], label = "X"): PromptCandidate => ({
  label,
  prompt: `Prompt ${label}`,
  critique: `Kritik ${label}`,
  rating,
});

describe("prompt-diff · bestIndex", () => {
  it("returns the index of the highest-rated candidate when it is first", () => {
    expect(bestIndex([cand(5), cand(3), cand(1)])).toBe(0);
  });

  it("finds the best candidate in the middle", () => {
    expect(bestIndex([cand(2), cand(5), cand(3)])).toBe(1);
  });

  it("finds the best candidate when it is last", () => {
    expect(bestIndex([cand(1), cand(3), cand(5)])).toBe(2);
  });

  it("returns the FIRST candidate on a rating tie (strict greater-than)", () => {
    expect(bestIndex([cand(5), cand(5), cand(2)])).toBe(0);
    expect(bestIndex([cand(4, "a"), cand(4, "b"), cand(4, "c")])).toBe(0);
  });

  it("handles a single candidate", () => {
    expect(bestIndex([cand(3)])).toBe(0);
  });

  it("defensively returns 0 for an empty candidate list", () => {
    expect(bestIndex([])).toBe(0);
  });

  it("is deterministic for identical inputs", () => {
    const list = [cand(2), cand(4), cand(1)];
    expect(bestIndex(list)).toBe(bestIndex(list));
  });
});
