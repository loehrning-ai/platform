/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

/**
 * lesson-content.test.tsx (regression coverage)
 *
 * Drives the REAL <LessonContent /> reader pane. Assertions target its OWN
 * logic, not its children:
 *   - the header (lesson number/total, title, subtitle, key-concept chips);
 *   - one section per lesson.sections (rendered by the REAL SectionReader, so
 *     the section h3 titles + their mark-read buttons appear);
 *   - the Quiz tab appears only when the lesson has quiz questions, and
 *     switching to it swaps the panel;
 *   - the "Lektion abschließen" completion gate: disabled until EVERY section
 *     id is in readSectionIds, enabled + wired to onMarkLessonComplete once all
 *     are read, and replaced by the "abgeschlossen" state when isCompleted;
 *   - the "Nächste Lektion" affordance is wired to onNextLesson when hasNextLesson.
 *
 * framer-motion is stubbed to plain elements (AnimatePresence renders eagerly).
 * The three non-slice-A children are stubbed so the test stays hermetic and
 * fast: LessonProgressRing (subscribes to the progress store), the widget
 * registry (lazy widget graph), and LessonQuiz (its own tested module). The
 * SectionReader child is left REAL because it is part of this slice.
 */

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const MOTION_ONLY_PROPS = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
    "whileFocus",
    "whileInView",
    "custom",
    "viewport",
    "layout",
    "layoutId",
    "mode",
  ]);
  const cache = new Map<string, React.ElementType>();
  const make = (tag: string): React.ElementType => {
    if (!cache.has(tag)) {
      const Comp = React.forwardRef(function MotionMock(props: any, ref: any) {
        const rest: Record<string, unknown> = {};
        for (const key in props) {
          if (key !== "children" && !MOTION_ONLY_PROPS.has(key)) {
            rest[key] = props[key];
          }
        }
        return React.createElement(tag, { ...rest, ref }, props.children);
      });
      cache.set(tag, Comp);
    }
    return cache.get(tag)!;
  };
  const m = new Proxy(
    {},
    {
      get: (_t, prop) =>
        prop === "create"
          ? (tag: unknown) => make(typeof tag === "string" ? tag : "div")
          : typeof prop === "string"
            ? make(prop)
            : undefined,
    },
  );
  return {
    __esModule: true,
    m,
    motion: m,
    AnimatePresence: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    MotionConfig: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    LazyMotion: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    domAnimation: {},
    useReducedMotion: () => true,
  };
});

vi.mock("@/components/progress/lesson-progress-ring", () => ({
  LessonProgressRing: () => null,
}));

vi.mock("@/components/widgets/registry", () => ({
  RenderWidget: () => null,
  resolveWidgetsForSlot: () => [],
}));

vi.mock("./lesson-quiz", async () => {
  const React = await import("react");
  return {
    LessonQuiz: () =>
      React.createElement("div", { "data-testid": "lesson-quiz" }, "quiz-stub"),
  };
});

import { LessonContent } from "./lesson-content";
import type {
  Lesson,
  LessonQuizQuestion,
  LessonSection,
} from "@/lib/course/types";

function sec(id: string, title: string): LessonSection {
  return { id, title, readTimeMinutes: 2, content: "Ein Absatz." };
}

function question(id: string): LessonQuizQuestion {
  return {
    id,
    questionText: "Was gilt?",
    answerOptions: [
      { id: "a", text: "Antwort A", isCorrect: true },
      { id: "b", text: "Antwort B", isCorrect: false },
    ],
    explanation: "Weil A.",
  };
}

function mkLesson(over: Partial<Lesson> = {}): Lesson {
  return {
    id: "les-1",
    number: 2,
    title: "Datenpannen",
    subtitle: "Was tun im Ernstfall?",
    durationMinutes: 15,
    sections: [sec("a", "Abschnitt A"), sec("b", "Abschnitt B")],
    quiz: [question("q1")],
    keyConcepts: ["DSGVO", "Meldepflicht"],
    blockId: "block_1",
    ...over,
  };
}

type Props = Parameters<typeof LessonContent>[0];

function baseProps(): Props {
  return {
    courseSlug: "ki-fuehrerschein",
    lesson: mkLesson(),
    totalLessons: 5,
    progressReady: true,
    readSectionIds: new Set<string>(),
    isCompleted: false,
    quizBestScore: null,
    hasNextLesson: false,
    onMarkSectionRead: vi.fn(),
    onMarkLessonComplete: vi.fn(),
    onQuizComplete: vi.fn(),
    onNextLesson: vi.fn(),
  };
}

function renderContent(over: Partial<Props> = {}) {
  const props = { ...baseProps(), ...over } as Props;
  return { props, ...render(<LessonContent {...props} />) };
}

afterEach(cleanup);

describe("<LessonContent>", () => {
  it("renders the lesson header, subtitle and key-concept chips", () => {
    renderContent();

    expect(screen.getByText("Lektion 2 von 5")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Datenpannen" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Was tun im Ernstfall?")).toBeInTheDocument();
    expect(screen.getByText("DSGVO")).toBeInTheDocument();
    expect(screen.getByText("Meldepflicht")).toBeInTheDocument();
  });

  it("renders one (real) SectionReader per lesson section", () => {
    renderContent();

    expect(
      screen.getByRole("heading", { level: 3, name: "Abschnitt A" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Abschnitt B" }),
    ).toBeInTheDocument();
    // The real SectionReader renders a mark-read toggle per section.
    expect(
      screen.getAllByRole("button", { name: /Als gelesen markieren/ }),
    ).toHaveLength(2);
  });

  it("shows the Quiz tab only when the lesson has quiz questions", () => {
    const { unmount } = renderContent();
    expect(screen.getByRole("tab", { name: /Quiz \(1\)/ })).toBeInTheDocument();
    unmount();

    renderContent({ lesson: mkLesson({ quiz: [] }) });
    expect(screen.getByRole("tab", { name: /Lernen/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Quiz/ })).toBeNull();
  });

  it("swaps to the quiz panel when the Quiz tab is clicked", () => {
    renderContent();
    expect(screen.queryByTestId("lesson-quiz")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: /Quiz/ }));
    expect(screen.getByTestId("lesson-quiz")).toBeInTheDocument();
  });

  it("uses roving focus and arrow-key activation across the tabs", () => {
    renderContent();
    const learn = screen.getByRole("tab", { name: /Lernen/ });
    const quiz = screen.getByRole("tab", { name: /Quiz/ });

    expect(learn).toHaveAttribute("tabindex", "0");
    expect(quiz).toHaveAttribute("tabindex", "-1");
    learn.focus();
    fireEvent.keyDown(learn, { key: "ArrowRight" });

    expect(quiz).toHaveFocus();
    expect(quiz).toHaveAttribute("aria-selected", "true");
    expect(quiz).toHaveAttribute("tabindex", "0");
    expect(learn).toHaveAttribute("tabindex", "-1");
    expect(screen.getByTestId("lesson-quiz")).toBeInTheDocument();
  });

  it("disables the completion button until every section is read", () => {
    renderContent({ readSectionIds: new Set(["a"]) });
    expect(
      screen.getByRole("button", { name: /Lektion abschließen/ }),
    ).toBeDisabled();
  });

  it("keeps progress write controls disabled until progress is ready", () => {
    const unread = renderContent({ progressReady: false });
    const markAsRead = screen.getAllByRole("button", {
      name: /Als gelesen markieren/,
    });
    expect(markAsRead.every((button) => button.hasAttribute("disabled"))).toBe(
      true,
    );
    unread.unmount();

    renderContent({
      progressReady: false,
      readSectionIds: new Set(["a", "b"]),
    });
    expect(
      screen.getByRole("button", { name: /Lektion abschließen/ }),
    ).toBeDisabled();
  });

  it("enables completion once all sections are read and fires onMarkLessonComplete", () => {
    const onMarkLessonComplete = vi.fn();
    renderContent({
      readSectionIds: new Set(["a", "b"]),
      onMarkLessonComplete,
    });

    const btn = screen.getByRole("button", { name: /Lektion abschließen/ });
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    expect(onMarkLessonComplete).toHaveBeenCalledTimes(1);
  });

  it("shows the completed state (and no completion button) when isCompleted", () => {
    renderContent({ isCompleted: true, readSectionIds: new Set(["a", "b"]) });

    expect(screen.getByText("Lektion abgeschlossen")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Lektion abschließen/ }),
    ).toBeNull();
  });

  it("wires each section's mark-read button to onMarkSectionRead(sectionId)", () => {
    const onMarkSectionRead = vi.fn();
    renderContent({ onMarkSectionRead });

    const marks = screen.getAllByRole("button", {
      name: /Als gelesen markieren/,
    });
    fireEvent.click(marks[0]);
    expect(onMarkSectionRead).toHaveBeenCalledWith("a");
  });

  it("renders a wired 'Nächste Lektion' affordance only when hasNextLesson", () => {
    const onNextLesson = vi.fn();
    const { unmount } = renderContent({ hasNextLesson: true, onNextLesson });
    const nextBtn = screen.getByRole("button", { name: /Nächste Lektion/ });
    fireEvent.click(nextBtn);
    expect(onNextLesson).toHaveBeenCalledTimes(1);
    unmount();

    renderContent({ hasNextLesson: false });
    expect(
      screen.queryByRole("button", { name: /Nächste Lektion/ }),
    ).toBeNull();
  });
});
