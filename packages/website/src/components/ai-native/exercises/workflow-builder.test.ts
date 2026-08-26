import { createElement } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect } from "vitest";
import { DemoLocaleProvider } from "@/components/demos/demo-locale";
import { __resetCacheForTests } from "@/lib/progress";
import {
  WorkflowBuilderExercise,
  gradeWorkflow,
  type WorkflowBuilderSpec,
} from "./workflow-builder";

const mk = (kind: string) => ({
  id: `${kind}-1`,
  kind,
  label: kind,
  icon: "●",
  description: "",
  category: "process" as const,
});

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
});

afterEach(cleanup);

describe("workflow-builder · gradeWorkflow", () => {
  const solution = { requiredKinds: ["trigger", "llm", "action"] };

  it("empty chain → score 0", () => {
    const r = gradeWorkflow([], solution);
    expect(r.score).toBe(0);
  });

  it("all required present in correct order → score 1", () => {
    const r = gradeWorkflow([mk("trigger"), mk("llm"), mk("action")], solution);
    expect(r.score).toBe(1);
    expect(r.orderCorrect).toBe(true);
    expect(r.presentCount).toBe(3);
  });

  it("all present but wrong order → halved score", () => {
    const r = gradeWorkflow([mk("action"), mk("llm"), mk("trigger")], solution);
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

describe("WorkflowBuilderExercise controls", () => {
  const spec: WorkflowBuilderSpec = {
    exerciseId: "workflow-a11y",
    lessonId: "modul_1_lesson_1",
    moduleId: "modul_1",
    title: "Build the chain",
    scenario: "Order two distinct nodes.",
    palette: [
      {
        id: "webhook",
        kind: "trigger",
        label: "Webhook trigger",
        icon: "W",
        description: "Starts the workflow",
        category: "trigger",
      },
      {
        id: "summarizer",
        kind: "llm",
        label: "Summary model",
        icon: "S",
        description: "Summarizes the input",
        category: "process",
      },
    ],
    solution: { requiredKinds: ["trigger", "llm"] },
  };

  it("names every mapped row control with its node label", () => {
    render(
      createElement(DemoLocaleProvider, {
        locale: "en",
        children: createElement(WorkflowBuilderExercise, spec),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Webhook trigger/ }));
    fireEvent.click(screen.getByRole("button", { name: /Summary model/ }));

    expect(
      screen.getByRole("button", { name: "Move up: Webhook trigger" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move down: Webhook trigger" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Remove: Webhook trigger" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Move up: Summary model" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Move down: Summary model" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Remove: Summary model" }),
    ).toBeEnabled();
  });
});
