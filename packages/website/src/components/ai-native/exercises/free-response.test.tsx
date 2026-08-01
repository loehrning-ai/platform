import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { FC, ReactNode, HTMLAttributes } from "react";
import { saveExerciseResult } from "@/lib/ai-native/progress";
import { __resetLearningOwnerForTests } from "@/lib/progress/browser-learning-storage";
import { FreeResponseExercise, type FreeResponseSpec } from "./free-response";

/**
 * free-response.test.tsx (regression coverage)
 *
 * The free-response exercise is graded entirely by the AI endpoint (no rule
 * fallback grader): on success it renders the score + per-criterion rubric and
 * records an "ai" result; on any grader failure it marks the exercise complete
 * with a null score and a "fallback" source. We exercise both branches via RTL,
 * stubbing global fetch (the pattern from _ai-grade.test.ts) and mocking the
 * progress store so we can assert the recorded ExerciseResult. Draft text is
 * persisted to sessionStorage (PII constraint) and restored on mount.
 *
 * framer-motion is mocked to a prop-stripping passthrough so the feedback
 * reveals render synchronously in jsdom.
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

const spec: FreeResponseSpec = {
  exerciseId: "fr1",
  lessonId: "l1",
  moduleId: "modul_1",
  title: "Freie Antwort",
  scenario: "Beschreibe deinen Workflow.",
  rubric: [
    { id: "r1", label: "Klarheit", description: "Ist die Antwort klar?" },
    { id: "r2", label: "Vollständigkeit", description: "Sind alle Schritte da?" },
  ],
};

const storageKey = `ai-native-exercise-draft-${spec.lessonId}-${spec.exerciseId}`;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  __resetLearningOwnerForTests("anonymous");
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("<FreeResponseExercise>", () => {
  it("restores a saved draft from sessionStorage on mount", async () => {
    sessionStorage.setItem(storageKey, "Mein gespeicherter Entwurf zum Workflow.");
    render(<FreeResponseExercise {...spec} />);
    expect(
      await screen.findByDisplayValue("Mein gespeicherter Entwurf zum Workflow."),
    ).toBeInTheDocument();
  });

  it("keeps the submit button disabled until the answer reaches 20 characters", () => {
    render(<FreeResponseExercise {...spec} />);
    const textarea = screen.getByLabelText("Deine Antwort");
    const submit = screen.getByRole("button", { name: "Antwort einreichen" });

    expect(submit).toBeDisabled();

    fireEvent.change(textarea, { target: { value: "zu kurz" } }); // 7 chars
    expect(submit).toBeDisabled();

    fireEvent.change(textarea, {
      target: { value: "Das ist eine ausreichend lange Antwort." },
    });
    expect(submit).toBeEnabled();
  });

  it("renders the AI score + rubric feedback and records an ai-graded result on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          score: 0.8,
          rubric: [
            { id: "r1", passed: true, rationale: "Sehr klar formuliert." },
            { id: "r2", passed: false, rationale: "Ein Schritt fehlt noch." },
          ],
          summary: "Insgesamt eine gute Antwort.",
          cached: false,
        }),
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    render(<FreeResponseExercise {...spec} />);
    fireEvent.change(screen.getByLabelText("Deine Antwort"), {
      target: { value: "Eine ausreichend lange und sinnvolle Antwort zum Workflow." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Antwort einreichen" }));

    expect(await screen.findByText(/Score 80%/)).toBeInTheDocument();
    expect(screen.getByText("Insgesamt eine gute Antwort.")).toBeInTheDocument();
    // The rubric panel shows the authored label (from spec) + the AI rationale.
    expect(screen.getByText("Klarheit")).toBeInTheDocument();
    expect(screen.getByText("Sehr klar formuliert.")).toBeInTheDocument();
    expect(screen.getByText("Vollständigkeit")).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai-native/grade-exercise",
      expect.objectContaining({ method: "POST" }),
    );
    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(mockedSave.mock.calls[0][2]).toMatchObject({
      kind: "exercise-free-response",
      score: 0.8,
      gradingSource: "ai",
      summary: "Insgesamt eine gute Antwort.",
    });
  });

  it("marks the exercise unavailable (null score, fallback source) when the grader fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 } as unknown as Response),
    );

    render(<FreeResponseExercise {...spec} />);
    fireEvent.change(screen.getByLabelText("Deine Antwort"), {
      target: { value: "Eine ausreichend lange Antwort für den Fehlerfall." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Antwort einreichen" }));

    expect(
      await screen.findByText("AI-Bewertung nicht verfügbar"),
    ).toBeInTheDocument();
    expect(mockedSave).toHaveBeenCalledTimes(1);
    expect(mockedSave.mock.calls[0][2]).toMatchObject({
      kind: "exercise-free-response",
      score: null,
      gradingSource: "fallback",
    });
  });
});
