import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { FC, ReactNode, HTMLAttributes } from "react";
import {
  getExerciseResult,
  saveExerciseResult,
  isExerciseCompleted,
} from "@/lib/ai-native/progress";
import {
  ExerciseShell,
  ExerciseResetButton,
  submitExercise,
} from "./_shell";

/**
 * _shell.test.tsx (regression coverage)
 *
 * ExerciseShell is the common frame for all exercise kinds. Its real logic:
 *  - `submitExercise` builds the persisted ExerciseResult (completed + attempts
 *    + ISO timestamp + default flags + conditional AI fields) and hands it to
 *    the progress store;
 *  - the shell maps each ExerciseKind to a German overline label, restores the
 *    completed badge from a prior result, and offers a skip escape hatch;
 *  - a class error boundary swaps a throwing exercise body for a fallback whose
 *    own escape hatch marks the exercise skipped-complete (never blocks the
 *    lesson).
 *
 * The progress store is mocked so we assert the ARGUMENTS the shell hands it
 * (its real output), never a mock return value. framer-motion is mocked to a
 * prop-stripping passthrough (an endorsed mock target) so the badge renders in
 * jsdom without a LazyMotion provider.
 */

vi.mock("@/lib/ai-native/progress", () => ({
  getExerciseResult: vi.fn(),
  saveExerciseResult: vi.fn(),
  isExerciseCompleted: vi.fn(),
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const STRIP = new Set<string>([
    "initial",
    "animate",
    "exit",
    "transition",
    "whileHover",
    "whileTap",
    "whileInView",
    "whileFocus",
    "viewport",
    "layout",
    "layoutId",
    "variants",
    "custom",
  ]);
  const cache = new Map<string, FC<Record<string, unknown>>>();
  const make = (tag: string): FC<Record<string, unknown>> => {
    const cached = cache.get(tag);
    if (cached) return cached;
    const Comp: FC<Record<string, unknown>> = (props) => {
      const clean: Record<string, unknown> = {};
      for (const key of Object.keys(props)) {
        if (key === "children" || STRIP.has(key)) continue;
        clean[key] = props[key];
      }
      return React.createElement(
        tag,
        clean as HTMLAttributes<HTMLElement>,
        props.children as ReactNode,
      );
    };
    cache.set(tag, Comp);
    return Comp;
  };
  const m = new Proxy(
    {},
    { get: (_target, prop) => make(String(prop)) },
  ) as Record<string, FC<Record<string, unknown>>>;
  const Passthrough: FC<{ children?: ReactNode }> = ({ children }) =>
    React.createElement(React.Fragment, null, children);
  return {
    m,
    AnimatePresence: Passthrough,
    MotionConfig: Passthrough,
    LazyMotion: Passthrough,
    domAnimation: {},
    domMax: {},
  };
});

const mockedSave = vi.mocked(saveExerciseResult);
const mockedGet = vi.mocked(getExerciseResult);
const mockedIsDone = vi.mocked(isExerciseCompleted);

beforeEach(() => {
  vi.clearAllMocks();
  mockedGet.mockReturnValue(undefined);
  mockedIsDone.mockReturnValue(false);
});

describe("submitExercise", () => {
  it("persists a completed result with default flags for the minimal option set", () => {
    submitExercise({
      moduleId: "modul_1",
      lessonId: "l1",
      exerciseId: "l1_ex1",
      kind: "exercise-prompt-diff",
      score: 1,
    });

    expect(mockedSave).toHaveBeenCalledTimes(1);
    const [moduleId, lessonId, result] = mockedSave.mock.calls[0];
    expect(moduleId).toBe("modul_1");
    expect(lessonId).toBe("l1");
    expect(result).toMatchObject({
      exerciseId: "l1_ex1",
      kind: "exercise-prompt-diff",
      completed: true,
      score: 1,
      attempts: 1,
      skipped: false,
    });
    // completedAt is a real ISO-8601 timestamp, not null.
    expect(result.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    // Optional AI fields are omitted entirely when not supplied.
    expect(result).not.toHaveProperty("aiFeedback");
    expect(result).not.toHaveProperty("summary");
    expect(result).not.toHaveProperty("gradingSource");
  });

  it("passes a null score through unchanged", () => {
    submitExercise({
      moduleId: "modul_2",
      lessonId: "l2",
      exerciseId: "l2_ex1",
      kind: "exercise-free-response",
      score: null,
    });
    expect(mockedSave.mock.calls[0][2].score).toBeNull();
  });

  it("includes skipped + the AI feedback/summary/source fields when provided", () => {
    const aiFeedback = [{ id: "a", passed: true, rationale: "gut begründet" }];
    submitExercise({
      moduleId: "modul_3",
      lessonId: "l3",
      exerciseId: "l3_ex1",
      kind: "exercise-rctfc-checklist",
      score: 0.8,
      skipped: true,
      aiFeedback,
      summary: "Solide Zusammenfassung.",
      gradingSource: "ai",
    });
    const result = mockedSave.mock.calls[0][2];
    expect(result).toMatchObject({
      skipped: true,
      summary: "Solide Zusammenfassung.",
      gradingSource: "ai",
    });
    expect(result.aiFeedback).toEqual(aiFeedback);
  });
});

describe("<ExerciseShell>", () => {
  const baseProps = {
    moduleId: "modul_1" as const,
    lessonId: "l1",
    exerciseId: "ex1",
    title: "Wähle den besten Prompt",
    scenario: "Drei Prompts, einer ist am besten.",
  };

  it("renders the title, scenario, kind label, and exercise body", () => {
    const { container } = render(
      <ExerciseShell {...baseProps} kind="exercise-prompt-diff">
        <p>Übungskörper</p>
      </ExerciseShell>,
    );
    expect(
      screen.getByRole("heading", { name: "Wähle den besten Prompt" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Drei Prompts, einer ist am besten."),
    ).toBeInTheDocument();
    expect(screen.getByText("Übungskörper")).toBeInTheDocument();
    expect(container.textContent).toContain("Prompt-Diff");
  });

  it("maps each exercise kind to its German overline label", () => {
    const cases = [
      ["exercise-workflow-builder", "Workflow-Builder"],
      ["exercise-free-response", "Freie Antwort"],
      ["exercise-pii-spotter", "PII-Spotter"],
      ["exercise-context-budget", "Context-Budget"],
    ] as const;
    for (const [kind, label] of cases) {
      const { container, unmount } = render(
        <ExerciseShell {...baseProps} kind={kind}>
          <p>x</p>
        </ExerciseShell>,
      );
      expect(container.textContent).toContain(label);
      unmount();
    }
  });

  it("skips via the escape hatch: records a skipped result and shows the badge", async () => {
    render(
      <ExerciseShell {...baseProps} kind="exercise-prompt-diff">
        <p>x</p>
      </ExerciseShell>,
    );
    fireEvent.click(screen.getByRole("button", { name: /verstanden/ }));

    expect(mockedSave).toHaveBeenCalledTimes(1);
    const result = mockedSave.mock.calls[0][2];
    expect(result.skipped).toBe(true);
    expect(result.score).toBeNull();

    // Completed badge replaces the escape hatch.
    expect(await screen.findByText("Erledigt")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /verstanden/ })).toBeNull();
  });

  it("restores the completed badge with the rounded score from a prior result", async () => {
    mockedGet.mockReturnValue({
      exerciseId: "ex1",
      kind: "exercise-prompt-diff",
      completed: true,
      score: 1,
      attempts: 1,
      completedAt: new Date().toISOString(),
      skipped: false,
    });
    render(
      <ExerciseShell {...baseProps} kind="exercise-prompt-diff">
        <p>x</p>
      </ExerciseShell>,
    );
    expect(await screen.findByText("100%")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /verstanden/ })).toBeNull();
  });

  it("shows the fallback + escape hatch when the exercise body throws", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const Boom: FC = () => {
      throw new Error("kaputt");
    };
    render(
      <ExerciseShell {...baseProps} kind="exercise-prompt-diff" title="Kaputte Übung">
        <Boom />
      </ExerciseShell>,
    );

    expect(
      screen.getByText("Übung aktuell nicht verfügbar"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Kaputte Übung" }),
    ).toBeInTheDocument();
    // The normal chrome is replaced entirely, so the overline label is gone.
    expect(screen.queryByText(/Übung · Prompt-Diff/)).toBeNull();

    // The fallback's escape hatch still marks the exercise skipped-complete.
    fireEvent.click(screen.getByRole("button", { name: /verstanden/ }));
    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(mockedSave.mock.calls[0][2].skipped).toBe(true);
    errSpy.mockRestore();
  });
});

describe("<ExerciseResetButton>", () => {
  it("labels itself Nochmal and invokes onReset when clicked", () => {
    const onReset = vi.fn();
    render(<ExerciseResetButton onReset={onReset} />);
    fireEvent.click(screen.getByRole("button", { name: /Nochmal/ }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
