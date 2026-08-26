import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { FC, ReactNode, HTMLAttributes } from "react";
import {
  isExerciseCompleted,
  saveExerciseResult,
} from "@/lib/ai-native/progress";
import { __resetLearningOwnerForTests } from "@/lib/progress/browser-learning-storage";
import { RoleScenarioExercise, type RoleScenarioSpec } from "./role-scenario";

/**
 * role-scenario.test.tsx (regression coverage)
 *
 * The Role-Scenario picker has no exported grader; its scoring logic lives in
 * the component (pick a role -> answer each single-choice scenario -> score =
 * correct / total). We exercise it end-to-end via RTL and assert both the
 * rendered "N/M richtig · Score X%" summary and the ExerciseResult score handed
 * to the (mocked) progress store. framer-motion is mocked to a prop-stripping
 * passthrough so the AnimatePresence reveal renders synchronously in jsdom.
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
const mockedIsDone = vi.mocked(isExerciseCompleted);

const spec: RoleScenarioSpec = {
  exerciseId: "rs1",
  lessonId: "l1",
  moduleId: "modul_1",
  title: "Rollen-Szenario",
  scenario: "Ordne die Aufgabe deiner Funktion zu.",
  roles: [
    {
      id: "gf",
      label: "Geschäftsführung",
      description: "Strategie und Budget",
      scenarios: [
        {
          id: "s1",
          question: "Frage eins?",
          options: [
            {
              id: "s1a",
              label: "Antwort A",
              correct: true,
              explanation: "A ist richtig.",
            },
            {
              id: "s1b",
              label: "Antwort B",
              correct: false,
              explanation: "B ist falsch.",
            },
          ],
        },
        {
          id: "s2",
          question: "Frage zwei?",
          options: [
            {
              id: "s2a",
              label: "Antwort A",
              correct: false,
              explanation: "A ist falsch.",
            },
            {
              id: "s2b",
              label: "Antwort B",
              correct: true,
              explanation: "B ist richtig.",
            },
          ],
        },
      ],
    },
    {
      id: "it",
      label: "IT-Leitung",
      description: "Systeme und Sicherheit",
      scenarios: [
        {
          id: "s3",
          question: "Frage drei?",
          options: [
            {
              id: "s3a",
              label: "Antwort A",
              correct: true,
              explanation: "A ist richtig.",
            },
            {
              id: "s3b",
              label: "Antwort B",
              correct: false,
              explanation: "B ist falsch.",
            },
          ],
        },
      ],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  __resetLearningOwnerForTests("anonymous");
  mockedIsDone.mockReturnValue(false);
  mockedSave.mockImplementation(() => {
    mockedIsDone.mockReturnValue(true);
    return true;
  });
});

describe("<RoleScenarioExercise>", () => {
  it("shows the role picker first and reveals a role's scenarios on selection", () => {
    render(<RoleScenarioExercise {...spec} />);
    expect(screen.getByText("Wähle deine Rolle")).toBeInTheDocument();
    // Scenarios stay hidden until a role is chosen.
    expect(screen.queryByText("Frage eins?")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Geschäftsführung/ }));
    expect(screen.getByText("Frage eins?")).toBeInTheDocument();
    expect(screen.getByText("Frage zwei?")).toBeInTheDocument();
  });

  it("keeps the submit button disabled until every scenario is answered", () => {
    const { container } = render(<RoleScenarioExercise {...spec} />);
    fireEvent.click(screen.getByRole("button", { name: /Geschäftsführung/ }));

    const submit = screen.getByRole("button", { name: "Auswerten" });
    expect(submit).toBeDisabled();

    fireEvent.click(
      container.querySelector('input[value="s1a"]') as HTMLInputElement,
    );
    expect(submit).toBeDisabled(); // only 1 of 2 answered

    fireEvent.click(
      container.querySelector('input[value="s2b"]') as HTMLInputElement,
    );
    expect(submit).toBeEnabled();
  });

  it("scores an all-correct answer set as 100% and records the result", async () => {
    const { container } = render(<RoleScenarioExercise {...spec} />);
    fireEvent.click(screen.getByRole("button", { name: /Geschäftsführung/ }));
    fireEvent.click(
      container.querySelector('input[value="s1a"]') as HTMLInputElement,
    );
    fireEvent.click(
      container.querySelector('input[value="s2b"]') as HTMLInputElement,
    );
    fireEvent.click(screen.getByRole("button", { name: "Auswerten" }));

    expect(
      await screen.findByText(/2\/2 richtig.*Score 100%/),
    ).toBeInTheDocument();
    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(mockedSave.mock.calls[0][2]).toMatchObject({
      kind: "exercise-role-scenario",
      score: 1,
    });
  });

  it("scores a mixed answer set proportionally (1 of 2 correct = 50%)", async () => {
    const { container } = render(<RoleScenarioExercise {...spec} />);
    fireEvent.click(screen.getByRole("button", { name: /Geschäftsführung/ }));
    fireEvent.click(
      container.querySelector('input[value="s1a"]') as HTMLInputElement,
    ); // correct
    fireEvent.click(
      container.querySelector('input[value="s2a"]') as HTMLInputElement,
    ); // wrong
    fireEvent.click(screen.getByRole("button", { name: "Auswerten" }));

    expect(
      await screen.findByText(/1\/2 richtig.*Score 50%/),
    ).toBeInTheDocument();
    expect(mockedSave.mock.calls[0][2].score).toBe(0.5);
  });
});
