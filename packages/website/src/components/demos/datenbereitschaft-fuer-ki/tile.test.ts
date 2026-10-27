import { describe, expect, it } from "vitest";
import { CLAUDE_ANSWER, ENDING_MRR, OPENING_DEC_2025 } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { LIFT, OPENING, PER_1000 } from "./tile-motion";

describe("W03 hub tile", () => {
  it("lifts the bar by exactly the opening level the kit states", () => {
    expect(OPENING).toBe(OPENING_DEC_2025);
    expect(LIFT).toBeCloseTo((OPENING_DEC_2025 / 1000) * PER_1000, 1);
  });

  it("stacks Claude's April figure on the opening into the approved level", () => {
    expect(OPENING_DEC_2025 + (CLAUDE_ANSWER[0] as number)).toBe(ENDING_MRR["2026-04"]);
  });
});
