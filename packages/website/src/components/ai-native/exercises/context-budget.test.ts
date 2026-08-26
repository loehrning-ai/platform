import { describe, it, expect } from "vitest";
import { gradeBudget } from "./context-budget";

const blocks = [
  { id: "a", label: "Rolle", tokens: 500, mustHave: true, description: "" },
  { id: "b", label: "Kontext", tokens: 1200, mustHave: true, description: "" },
  {
    id: "c",
    label: "Beispiele",
    tokens: 4000,
    mustHave: false,
    description: "",
  },
  { id: "d", label: "History", tokens: 6000, mustHave: false, description: "" },
];

describe("context-budget · gradeBudget", () => {
  it("empty selection → 0/2 must-haves, score 0", () => {
    const r = gradeBudget(new Set(), blocks, 10000);
    expect(r.tokensUsed).toBe(0);
    expect(r.overBudget).toBe(false);
    expect(r.score).toBe(0);
    expect(r.mustHavesIncluded).toBe(0);
  });

  it("all must-haves under budget → score 1", () => {
    const r = gradeBudget(new Set(["a", "b"]), blocks, 10000);
    expect(r.score).toBe(1);
    expect(r.tokensUsed).toBe(1700);
    expect(r.overBudget).toBe(false);
  });

  it("over budget → score 0 regardless of must-haves", () => {
    const r = gradeBudget(new Set(["a", "b", "c", "d"]), blocks, 10000);
    expect(r.tokensUsed).toBe(11700);
    expect(r.overBudget).toBe(true);
    expect(r.score).toBe(0);
  });

  it("partial must-haves → partial score", () => {
    const r = gradeBudget(new Set(["a"]), blocks, 10000);
    expect(r.score).toBe(0.5); // 1/2 must-haves
  });

  it("is deterministic for same input", () => {
    const sel = new Set(["a", "c"]);
    const a = gradeBudget(sel, blocks, 10000);
    const b = gradeBudget(sel, blocks, 10000);
    expect(a).toEqual(b);
  });
});
