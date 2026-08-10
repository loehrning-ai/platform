import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { QuizQuestion } from "@/lib/course/types";

const quizMocks = vi.hoisted(() => ({
  loadQuestions: vi.fn(),
  ownerGeneration: 1,
  ownerKind: "anonymous" as "anonymous" | "unknown",
  ownerListener: null as
    | ((owner: {
        readonly kind: "anonymous" | "unknown";
        readonly generation: number;
      }) => void)
    | null,
  progressListener: null as ((progress: unknown) => void) | null,
  reportBoundaryError: vi.fn(),
  saveResult: vi.fn(),
}));

vi.mock("@/lib/course/questions", () => ({
  loadWorkshopQuestions: quizMocks.loadQuestions,
}));

vi.mock("@/lib/course/progress", () => ({
  saveWorkshopQuizResult: quizMocks.saveResult,
}));

vi.mock("@/lib/courses/completion", () => ({
  isCourseFullyCompleted: vi.fn(() => true),
}));

vi.mock("@/lib/observability/client-boundary-error", () => ({
  reportClientBoundaryError: quizMocks.reportBoundaryError,
}));

vi.mock("@/lib/progress/browser-learning-storage", () => ({
  getLearningOwnerContext: () => ({
    kind: quizMocks.ownerKind,
    generation: quizMocks.ownerGeneration,
  }),
  subscribeLearningOwner: (
    listener: (owner: {
      readonly kind: "anonymous" | "unknown";
      readonly generation: number;
    }) => void,
  ) => {
    quizMocks.ownerListener = listener;
    return () => {
      quizMocks.ownerListener = null;
    };
  },
}));

vi.mock("@/lib/progress/store", () => ({
  subscribe: (listener: (progress: unknown) => void) => {
    quizMocks.progressListener = listener;
    listener({});
    return () => {
      quizMocks.progressListener = null;
    };
  },
}));

vi.mock("framer-motion", async () => {
  const { createElement, forwardRef, Fragment } = await import("react");
  const DROP = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "custom",
  ]);
  const MotionDiv = forwardRef<HTMLElement, Record<string, unknown>>(
    (props, ref) => {
      const cleanProps: Record<string, unknown> = {};
      for (const key in props) {
        if (!DROP.has(key)) cleanProps[key] = props[key];
      }
      return createElement("div", { ...cleanProps, ref });
    },
  );
  const AnimatePresence = ({ children }: { children?: unknown }) =>
    createElement(Fragment, null, children as never);
  const Provider = ({ children }: { children?: unknown }) =>
    createElement(Fragment, null, children as never);
  return {
    m: { div: MotionDiv },
    AnimatePresence,
    MotionConfig: Provider,
    LazyMotion: Provider,
    domAnimation: {},
  };
});

import { WorkshopQuizPage } from "./workshop-quiz-page";

const QUESTIONS: readonly QuizQuestion[] = [
  {
    id: "q1",
    questionType: "single_choice",
    difficulty: "easy",
    questionText: "Which answer is correct?",
    answerOptions: [
      { id: "a", text: "Incorrect option", isCorrect: false },
      { id: "b", text: "Correct option", isCorrect: true },
    ],
    explanation: "Because B is correct.",
    version: 1,
    active: true,
  },
];

const SECOND_QUESTION: QuizQuestion = {
  id: "q2",
  questionType: "single_choice",
  difficulty: "easy",
  questionText: "What comes next?",
  answerOptions: [
    { id: "a", text: "The next correct option", isCorrect: true },
    { id: "b", text: "The next incorrect option", isCorrect: false },
  ],
  explanation: "A comes next.",
  version: 1,
  active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  quizMocks.ownerGeneration = 1;
  quizMocks.ownerKind = "anonymous";
  quizMocks.ownerListener = null;
  quizMocks.progressListener = null;
  quizMocks.loadQuestions.mockResolvedValue(QUESTIONS);
});

afterEach(cleanup);

describe("<WorkshopQuizPage>", () => {
  it("does not flash a false lock while the learning owner is unresolved", async () => {
    quizMocks.ownerKind = "unknown";
    render(<WorkshopQuizPage courseSlug="claude" locale="en" />);

    expect(screen.getByRole("status")).toHaveTextContent("Quiz is loading…");
    expect(
      screen.queryByRole("heading", {
        name: "Complete every lesson first",
      }),
    ).not.toBeInTheDocument();
    expect(quizMocks.loadQuestions).not.toHaveBeenCalled();

    act(() => {
      quizMocks.ownerKind = "anonymous";
      quizMocks.ownerGeneration = 2;
      quizMocks.ownerListener?.({
        kind: "anonymous",
        generation: quizMocks.ownerGeneration,
      });
      quizMocks.progressListener?.({});
    });

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Which answer is correct?",
      }),
    ).toBeInTheDocument();
  });

  it("invalidates and resets an active quiz across learning-owner generations", async () => {
    render(<WorkshopQuizPage courseSlug="claude" locale="en" />);

    await screen.findByRole("heading", {
      level: 2,
      name: "Which answer is correct?",
    });
    fireEvent.click(screen.getByRole("radio", { name: /Correct option/ }));
    expect(screen.getByRole("button", { name: "Result" })).toHaveFocus();

    await act(
      () =>
        new Promise((resolve) => {
          window.setTimeout(resolve, 1_100);
        }),
    );
    expect(screen.getByRole("timer")).toHaveTextContent("24:59");

    act(() => {
      quizMocks.ownerKind = "unknown";
      quizMocks.ownerGeneration = 2;
      quizMocks.ownerListener?.({
        kind: "unknown",
        generation: quizMocks.ownerGeneration,
      });
      quizMocks.progressListener?.({});
    });

    expect(screen.getByRole("status")).toHaveTextContent("Quiz is loading…");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(quizMocks.saveResult).not.toHaveBeenCalled();

    act(() => {
      quizMocks.ownerKind = "anonymous";
      quizMocks.ownerGeneration = 3;
      quizMocks.ownerListener?.({
        kind: "anonymous",
        generation: quizMocks.ownerGeneration,
      });
      quizMocks.progressListener?.({});
    });

    await screen.findByRole("heading", {
      level: 2,
      name: "Which answer is correct?",
    });
    screen
      .getAllByRole("radio")
      .forEach((radio) =>
        expect(radio).toHaveAttribute("aria-checked", "false"),
      );
    expect(screen.getByRole("timer")).toHaveTextContent("25:00");
    expect(screen.queryByText("Correct")).not.toBeInTheDocument();
    expect(quizMocks.saveResult).not.toHaveBeenCalled();
    expect(quizMocks.loadQuestions).toHaveBeenCalledTimes(2);
  });

  it("keeps the fixed quiz header below the global nav and localizes English chrome", async () => {
    render(<WorkshopQuizPage courseSlug="claude" locale="en" />);

    await screen.findByRole("heading", {
      level: 2,
      name: "Which answer is correct?",
    });

    const header = screen.getByTestId("workshop-quiz-header");
    expect(header).toHaveStyle({ top: "65px" });
    expect(header).toHaveClass("z-40");
    expect(header.firstElementChild).toHaveClass(
      "grid",
      "grid-cols-[minmax(0,1fr)_auto]",
      "sm:flex",
    );
    expect(screen.getByRole("link", { name: "Cancel" })).toBeInTheDocument();
    expect(within(header).getByText("Workshop quiz")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Question 1 of 1" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveAccessibleName(
      /^Time remaining: 25 minutes \d+ seconds$/,
    );
    expect(screen.queryByText(/Frage 1 von 1/)).not.toBeInTheDocument();
  });

  it("replaces a failed dynamic import with a generic retryable error state", async () => {
    const privateLoaderError = new Error("private provider detail");
    quizMocks.loadQuestions
      .mockReset()
      .mockRejectedValueOnce(privateLoaderError)
      .mockResolvedValueOnce(QUESTIONS);

    render(<WorkshopQuizPage courseSlug="claude" locale="en" />);

    expect(
      await screen.findByRole("heading", {
        name: "Quiz couldn't be loaded.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The quiz questions could not be loaded.",
    );
    expect(
      screen.queryByText(/private provider detail/),
    ).not.toBeInTheDocument();
    expect(quizMocks.reportBoundaryError).toHaveBeenCalledWith(
      "workshop-quiz",
      privateLoaderError,
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "Which answer is correct?",
      }),
    ).toBeInTheDocument();
    expect(quizMocks.loadQuestions).toHaveBeenCalledTimes(2);
  });

  it("announces answer and result feedback and moves focus through the quiz", async () => {
    render(<WorkshopQuizPage courseSlug="claude" locale="en" />);

    await screen.findByRole("heading", {
      level: 2,
      name: "Which answer is correct?",
    });

    let radios = screen.getAllByRole("radio");
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(radios[0]).toHaveAttribute("tabindex", "0");
    expect(radios[1]).toHaveAttribute("tabindex", "-1");

    fireEvent.keyDown(radios[0], { key: "ArrowRight" });
    radios = screen.getAllByRole("radio");
    expect(radios[1]).toHaveFocus();
    expect(radios[1]).toHaveAttribute("tabindex", "0");

    fireEvent.click(screen.getByRole("radio", { name: /Correct option/ }));

    const resultButton = screen.getByRole("button", { name: "Result" });
    await waitFor(() => expect(resultButton).toHaveFocus());
    expect(screen.getByRole("status")).toHaveTextContent(
      "Correct. Because B is correct.",
    );

    fireEvent.click(resultButton);

    const score = await screen.findByText("100%");
    await waitFor(() => expect(score).toHaveFocus());
    expect(screen.getByRole("status")).toHaveTextContent(
      "Quiz complete: 1 of 1 correct, 100 percent.",
    );
    expect(screen.getByText("1/1 correct")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Download Certificate of Completion",
      }),
    ).toBeInTheDocument();
    expect(quizMocks.saveResult).toHaveBeenCalledWith("claude", 1, true);
  });

  it("moves focus to the next question after the animated question swap", async () => {
    quizMocks.loadQuestions.mockResolvedValue([...QUESTIONS, SECOND_QUESTION]);

    render(<WorkshopQuizPage courseSlug="claude" locale="en" />);

    const firstHeading = await screen.findByRole("heading", { level: 2 });
    fireEvent.click(screen.getAllByRole("radio")[0]);
    fireEvent.click(screen.getByRole("button", { name: /^Next$/ }));

    await waitFor(() => {
      const nextHeading = screen.getByRole("heading", { level: 2 });
      expect(nextHeading).not.toBe(firstHeading);
      expect(nextHeading).toHaveFocus();
    });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("uses German chrome for German course configurations", async () => {
    render(<WorkshopQuizPage courseSlug="ki-fuehrerschein" />);

    await screen.findByRole("heading", {
      level: 2,
      name: "Which answer is correct?",
    });

    expect(screen.getByRole("link", { name: "Abbrechen" })).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Frage 1 von 1" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveAccessibleName(
      /^Verbleibende Zeit: \d+ Minuten \d+ Sekunden$/,
    );
    expect(
      screen
        .getByRole("radio", { name: /Correct option/ })
        .querySelector("span:nth-child(2)"),
    ).toHaveClass("min-w-0", "break-words");

    fireEvent.click(screen.getByRole("radio", { name: /Correct option/ }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Richtig. Because B is correct.",
    );
    expect(
      screen.getByRole("button", { name: "Ergebnis" }),
    ).toBeInTheDocument();
  });
});
