import { describe, it, expect } from "vitest";
import { gradeWorkflow } from "./workflow-builder";

const mk = (kind: string) => ({
  id: `${kind}-1`,
  kind,
  label: kind,
  icon: "●",
  description: "",
  category: "process" as const,
});

describe("workflow-builder · gradeWorkflow", () => {
  const solution = { requiredKinds: ["trigger", "llm", "action"] };

  it("empty chain → score 0", () => {
    const r = gradeWorkflow([], solution);
    expect(r.score).toBe(0);
  });

  it("all required present in correct order → score 1", () => {
    const r = gradeWorkflow(
      [mk("trigger"), mk("llm"), mk("action")],
      solution,
    );
    expect(r.score).toBe(1);
    expect(r.orderCorrect).toBe(true);
    expect(r.presentCount).toBe(3);
  });

  it("all present but wrong order → halved score", () => {
    const r = gradeWorkflow(
      [mk("action"), mk("llm"), mk("trigger")],
      solution,
    );
    // 3/3 present, order wrong → 0.5
    expect(r.orderCorrect).toBe(false);
    expect(r.score).toBe(0.5);
  });

  it("partial must-haves in order → partial score", () => {
    const r = gradeWorkflow([mk("trigger"), mk("llm")], solution);
    expect(r.orderCorrect).toBe(true);
    expect(r.score).toBeCloseTo(2 / 3, 3);
  });

  it("extra irrelevant nodes don't penalize when must-haves ordered", () => {
    const r = gradeWorkflow(
      [mk("trigger"), mk("filter"), mk("llm"), mk("logger"), mk("action")],
      solution,
    );
    expect(r.score).toBe(1);
    expect(r.orderCorrect).toBe(true);
  });

  it("is deterministic", () => {
    const chain = [mk("trigger"), mk("action")];
    const a = gradeWorkflow(chain, solution);
    const b = gradeWorkflow(chain, solution);
    expect(a).toEqual(b);
  });
});
