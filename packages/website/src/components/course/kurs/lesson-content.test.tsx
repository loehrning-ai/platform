/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => window.location.pathname,
}));

/**
 * lesson-content.test.tsx (regression coverage)
 *
 * Drives the REAL <LessonContent /> reader pane. Assertions target its OWN
 * logic, not its children:
 *   - the header (lesson number/total, title, subtitle, key-concept chips);
 *   - one section per lesson.sections (rendered by the REAL SectionReader, so
 *     the section h3 titles + navigation checkpoints appear);
 *   - the Quiz tab appears only when the lesson has quiz questions, and
 *     switching to it swaps the panel;
 *   - the completion write stays behind section review, a submitted knowledge
 *     check, and a concrete transfer decision;
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
    LessonQuiz: ({
      onComplete,
    }: {
      onComplete: (score: number, total: number) => void;
    }) =>
      React.createElement(
        "button",
        {
          type: "button",
          "data-testid": "lesson-quiz",
          onClick: () => onComplete(1, 1),
        },
        "quiz-stub",
      ),
  };
});

import { LessonContent } from "./lesson-content";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { LocaleProvider } from "@/components/i18n/locale-context";
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
    progressHydrated: true,
    ownerReady: true,
    checkpointKey: "ki-fuehrerschein:les-1:0",
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

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

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
    // The real SectionReader renders a navigation checkpoint per section.
    expect(
      screen.getAllByRole("button", {
        name: /Abschnitt als geprüft bestätigen/,
      }),
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
    expect(window.location.search).toBe("?tab=quiz");
  });

  it("restores a shared quiz tab and follows browser history", async () => {
    window.history.replaceState(null, "", "/lesson?source=course&tab=quiz");
    renderContent();

    expect(
      await screen.findByRole("tab", { name: /Quiz/, selected: true }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("lesson-quiz")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Lernen/ }));
    expect(window.location.search).toBe("?source=course");

    window.history.replaceState(null, "", "/lesson?source=course&tab=quiz");
    fireEvent.popState(window);
    expect(
      screen.getByRole("tab", { name: /Quiz/, selected: true }),
    ).toBeInTheDocument();
  });

  it("keeps the selected quiz tab in an immediately used locale link", async () => {
    window.history.replaceState(null, "", "/ki-fuehrerschein/kurs/block_1");
    const props = baseProps();
    render(
      <LocaleProvider locale="de">
        <LanguageSwitch />
        <LessonContent {...props} />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Quiz/ }));

    expect(
      await screen.findByRole("link", { name: /Englische Oberfläche/ }),
    ).toHaveAttribute("href", "/en/ki-fuehrerschein/kurs/block_1?tab=quiz");
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

  it("keeps the transfer checkpoint locked until every section is reviewed", () => {
    renderContent({ readSectionIds: new Set(["a"]) });
    expect(screen.getByLabelText("Entscheidung oder Änderung")).toBeDisabled();
    expect(
      screen.getByText("Bestätige zuerst jeden Abschnitt als geprüft."),
    ).toBeVisible();
  });

  it("keeps progress write controls disabled until progress is ready", () => {
    const unread = renderContent({ progressReady: false });
    const reviewCheckpoints = screen.getAllByRole("button", {
      name: /Abschnitt als geprüft bestätigen/,
    });
    expect(
      reviewCheckpoints.every((button) => button.hasAttribute("disabled")),
    ).toBe(true);
    unread.unmount();

    renderContent({
      progressReady: false,
      progressHydrated: false,
      readSectionIds: new Set(["a", "b"]),
      quizBestScore: { score: 1, total: 1 },
    });
    expect(
      screen.getByRole("button", { name: /Lernstand wird geladen/ }),
    ).toBeDisabled();
  });

  it("does not persist completion from section checkpoints before the knowledge check", () => {
    const onMarkLessonComplete = vi.fn();
    renderContent({
      readSectionIds: new Set(["a", "b"]),
      onMarkLessonComplete,
    });

    expect(screen.getByLabelText("Entscheidung oder Änderung")).toBeDisabled();
    expect(
      screen.getByText("Schließe zuerst den Verständnis-Check ab."),
    ).toBeVisible();
    expect(onMarkLessonComplete).not.toHaveBeenCalled();
  });

  it("persists completion only after knowledge-check evidence and a concrete transfer decision", () => {
    const onMarkLessonComplete = vi.fn();
    renderContent({
      readSectionIds: new Set(["a", "b"]),
      quizBestScore: { score: 1, total: 1 },
      onMarkLessonComplete,
    });

    const decision = screen.getByLabelText("Entscheidung oder Änderung");
    expect(decision).toBeEnabled();
    fireEvent.change(decision, {
      target: { value: "Ich ändere den Ablauf und prüfe das Ergebnis." },
    });
    const save = screen.getByRole("button", { name: "Checkpoint speichern" });
    expect(save).toBeEnabled();
    expect(save).toHaveClass("min-h-11");
    fireEvent.click(save);
    expect(onMarkLessonComplete).toHaveBeenCalledTimes(1);
  });

  it("shows the bounded checkpoint state when completion is already persisted", () => {
    renderContent({
      isCompleted: true,
      readSectionIds: new Set(["a", "b"]),
      quizBestScore: { score: 1, total: 1 },
    });

    expect(
      screen.getByText("Navigations-Checkpoint gespeichert"),
    ).toBeInTheDocument();
    expect(screen.getByText(/keine Kompetenzprüfung/i)).toBeVisible();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("wires each section's mark-read button to onMarkSectionRead(sectionId)", () => {
    const onMarkSectionRead = vi.fn();
    renderContent({ onMarkSectionRead });

    const marks = screen.getAllByRole("button", {
      name: /Abschnitt als geprüft bestätigen/,
    });
    fireEvent.click(marks[0]);
    expect(onMarkSectionRead).toHaveBeenCalledWith("a");
  });

  it("forwards submitted knowledge-check evidence without marking completion directly", () => {
    const onQuizComplete = vi.fn();
    const onMarkLessonComplete = vi.fn();
    renderContent({ onQuizComplete, onMarkLessonComplete });

    fireEvent.click(screen.getByRole("tab", { name: /Quiz/ }));
    fireEvent.click(screen.getByTestId("lesson-quiz"));

    expect(onQuizComplete).toHaveBeenCalledWith(1, 1);
    expect(onMarkLessonComplete).not.toHaveBeenCalled();
  });

  it("renders a wired 'Nächste Lektion' affordance only when hasNextLesson", () => {
    const onNextLesson = vi.fn();
    const { unmount } = renderContent({ hasNextLesson: true, onNextLesson });
    const nextBtn = screen.getByRole("button", { name: /Nächste Lektion/ });
    expect(nextBtn).toHaveClass("min-h-11");
    fireEvent.click(nextBtn);
    expect(onNextLesson).toHaveBeenCalledTimes(1);
    unmount();

    renderContent({ hasNextLesson: false });
    expect(
      screen.queryByRole("button", { name: /Nächste Lektion/ }),
    ).toBeNull();
  });
});
