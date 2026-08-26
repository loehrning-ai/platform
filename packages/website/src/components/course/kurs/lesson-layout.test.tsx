/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  act,
  render,
  screen,
  cleanup,
  fireEvent,
  within,
} from "@testing-library/react";

/**
 * lesson-layout.test.tsx (regression coverage)
 *
 * Drives the REAL <LessonLayout /> orchestrator. It owns the active-lesson
 * state, the mobile drawer, and the "next lesson" SCROLL behaviour. Assertions
 * target that orchestration:
 *   - the first lesson is active on mount;
 *   - selecting a lesson in the (REAL) sidebar switches the active lesson;
 *   - the next-lesson handler advances the active lesson AND scrolls the window
 *     to the top with smooth behaviour (window.scrollTo({ top: 0, ... }));
 *   - on the last lesson there is no next affordance (hasNextLesson gate);
 *   - it renders nothing when handed an empty lesson list;
 *   - the mobile nav toggle opens the drawer and Escape closes it.
 *
 * framer-motion is stubbed to plain elements. LessonContent is stubbed to a
 * tiny harness that surfaces the active lesson title + the onNextLesson /
 * onMarkLessonComplete callbacks (its internals are covered in its own spec).
 * The LessonSidebar child + the localStorage-backed progress lib are REAL.
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

vi.mock("./lesson-content", async () => {
  const React = await import("react");
  return {
    LessonContent: (props: any) =>
      React.createElement(
        "div",
        { "data-testid": "lesson-content" },
        React.createElement(
          "p",
          { "data-testid": "active-title" },
          props.lesson.title,
        ),
        React.createElement(
          "p",
          { "data-testid": "quiz-best-score" },
          props.quizBestScore === null
            ? "none"
            : `${props.quizBestScore.score}/${props.quizBestScore.total}`,
        ),
        React.createElement(
          "p",
          { "data-testid": "evidence-backed-completion" },
          props.isCompleted ? "complete" : "open",
        ),
        React.createElement(
          "p",
          { "data-testid": "progress-readiness" },
          `${props.progressHydrated}:${props.ownerReady}:${props.progressReady}`,
        ),
        props.hasNextLesson
          ? React.createElement(
              "button",
              { type: "button", onClick: props.onNextLesson },
              "go-next",
            )
          : null,
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              const sectionId = props.lesson.sections[0]?.id;
              if (sectionId) props.onMarkSectionRead(sectionId);
            },
          },
          "review-section",
        ),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => props.onQuizComplete(1, 1),
          },
          "finish-quiz",
        ),
        React.createElement(
          "button",
          { type: "button", onClick: props.onMarkLessonComplete },
          "mark-complete",
        ),
      ),
  };
});

import { LessonLayout } from "./lesson-layout";
import { lessonCompletionEvidenceCheckpointId } from "@/lib/courses/completion";
import {
  isLessonCompleted,
  markLessonCompleted,
  markSectionRead,
  resetProgress,
  saveLessonQuizScore,
} from "@/lib/course/progress";
import { isCheckpointDone } from "@/lib/progress";
import { URL_STATE_CHANGE_EVENT } from "@/lib/navigation/url-state";
import {
  __resetCacheForTests,
  activateAnonymousProgress,
  activateUnknownProgress,
} from "@/lib/progress/store";
import type {
  Lesson,
  LessonQuizQuestion,
  LessonSection,
} from "@/lib/course/types";

function mkLesson(over: Pick<Lesson, "id" | "number" | "title">): Lesson {
  return {
    subtitle: "",
    durationMinutes: 10,
    sections: [],
    quiz: [],
    keyConcepts: [],
    blockId: "block_1",
    ...over,
  } as Lesson;
}

const LESSONS: readonly Lesson[] = [
  mkLesson({ id: "l1", number: 1, title: "Erste Lektion" }),
  mkLesson({ id: "l2", number: 2, title: "Zweite Lektion" }),
];

let scrollSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* no-op storage in some jsdom combos */
  }
  __resetCacheForTests();
  activateAnonymousProgress();
  resetProgress("ki-fuehrerschein");
  window.history.replaceState({}, "", "/ki-fuehrerschein/kurs/block_1");
  scrollSpy = vi.fn();
  // jsdom does not implement scrollTo; install a spy so we can assert the call.
  Object.defineProperty(window, "scrollTo", {
    value: scrollSpy,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

function renderLayout(lessons: readonly Lesson[] = LESSONS) {
  return render(
    <LessonLayout
      courseSlug="ki-fuehrerschein"
      lessons={lessons}
      blockTitle="Block 1"
    />,
  );
}

describe("<LessonLayout>", () => {
  it("activates the first lesson on mount and shows the mobile nav toggle", () => {
    renderLayout();

    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Erste Lektion",
    );
    expect(
      screen.getByRole("button", { name: "Navigation öffnen" }),
    ).toBeInTheDocument();
  });

  it("switches the active lesson when a sidebar lesson is selected", () => {
    const urlStateListener = vi.fn();
    window.addEventListener(URL_STATE_CHANGE_EVENT, urlStateListener);
    renderLayout();

    fireEvent.click(
      screen.getByRole("button", { name: "Lektion 2: Zweite Lektion" }),
    );
    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Zweite Lektion",
    );
    expect(window.location.hash).toBe("#lesson=l2");
    expect(urlStateListener).toHaveBeenCalledOnce();
    window.removeEventListener(URL_STATE_CHANGE_EVENT, urlStateListener);
  });

  it("collapses the native reference when an in-place lesson switch occurs", () => {
    const { container } = renderLayout();
    const firstReference = container.querySelector<HTMLDetailsElement>(
      "details[data-lesson-reference]",
    );
    expect(firstReference).not.toBeNull();
    firstReference!.open = true;

    fireEvent.click(
      screen.getByRole("button", { name: "Lektion 2: Zweite Lektion" }),
    );

    const nextReference = container.querySelector<HTMLDetailsElement>(
      "details[data-lesson-reference]",
    );
    expect(nextReference).not.toBe(firstReference);
    expect(nextReference).not.toHaveAttribute("open");
  });

  it("replaces a stale resume fragment so reload restores the latest selection", () => {
    window.history.replaceState(
      {},
      "",
      "/ki-fuehrerschein/kurs/block_1?source=resume#lesson=l2",
    );
    const firstRender = renderLayout();
    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Zweite Lektion",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Lektion 1: Erste Lektion" }),
    );
    expect(window.location.pathname).toBe("/ki-fuehrerschein/kurs/block_1");
    expect(window.location.search).toBe("?source=resume");
    expect(window.location.hash).toBe("#lesson=l1");

    firstRender.unmount();
    renderLayout();
    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Erste Lektion",
    );
  });

  it("restores a validated lesson fragment and follows later hash changes", () => {
    window.history.replaceState(
      {},
      "",
      "/ki-fuehrerschein/kurs/block_1#lesson=l2",
    );
    renderLayout();

    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Zweite Lektion",
    );

    window.history.replaceState(
      {},
      "",
      "/ki-fuehrerschein/kurs/block_1#lesson=l1",
    );
    fireEvent(window, new HashChangeEvent("hashchange"));
    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Erste Lektion",
    );
  });

  it("ignores malformed and unknown lesson fragments", () => {
    window.history.replaceState(
      {},
      "",
      "/ki-fuehrerschein/kurs/block_1#lesson=%E0%A4%A",
    );
    renderLayout();
    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Erste Lektion",
    );

    window.history.replaceState(
      {},
      "",
      "/ki-fuehrerschein/kurs/block_1#lesson=not-in-this-block",
    );
    fireEvent(window, new HashChangeEvent("hashchange"));
    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Erste Lektion",
    );
  });

  it("treats special-property lesson IDs as ordinary quiz-score keys", () => {
    renderLayout([
      mkLesson({ id: "__proto__", number: 1, title: "Sichere Lektion" }),
    ]);

    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Sichere Lektion",
    );
    expect(screen.getByTestId("quiz-best-score")).toHaveTextContent("none");
  });

  it("advances to the next lesson and scrolls to the top smoothly", () => {
    renderLayout();
    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Erste Lektion",
    );

    fireEvent.click(screen.getByRole("button", { name: "go-next" }));

    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Zweite Lektion",
    );
    expect(window.location.hash).toBe("#lesson=l2");
    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    // On the last lesson there is no further next affordance.
    expect(screen.queryByRole("button", { name: "go-next" })).toBeNull();
  });

  it("advances with an instant scroll when reduced motion is requested", () => {
    setReducedMotion(true);
    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "go-next" }));

    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Zweite Lektion",
    );
    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });

  it("rejects completion writes until persisted section and quiz evidence exist", () => {
    const section: LessonSection = {
      id: "block_1_lesson_1_section_1",
      title: "Prüfabschnitt",
      readTimeMinutes: 2,
      content: "Prüfe den Fall.",
    };
    const secondSection: LessonSection = {
      id: "block_1_lesson_1_section_2",
      title: "Transferabschnitt",
      readTimeMinutes: 2,
      content: "Übertrage die Entscheidung.",
    };
    const question: LessonQuizQuestion = {
      id: "block_1_lesson_1_question_1",
      questionText: "Was gilt?",
      answerOptions: [
        { id: "a", text: "A", isCorrect: true },
        { id: "b", text: "B", isCorrect: false },
      ],
      explanation: "A gilt.",
    };
    const protectedLesson: Lesson = {
      ...mkLesson({
        id: "block_1_lesson_1",
        number: 1,
        title: "Geschützte Lektion",
      }),
      sections: [section, secondSection],
      quiz: [question],
    };

    renderLayout([protectedLesson]);
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    expect(isLessonCompleted("ki-fuehrerschein", protectedLesson.id)).toBe(
      false,
    );

    fireEvent.click(screen.getByRole("button", { name: "review-section" }));
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    expect(isLessonCompleted("ki-fuehrerschein", protectedLesson.id)).toBe(
      false,
    );

    markSectionRead("ki-fuehrerschein", protectedLesson.id, secondSection.id);
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    expect(isLessonCompleted("ki-fuehrerschein", protectedLesson.id)).toBe(
      false,
    );

    fireEvent.click(screen.getByRole("button", { name: "finish-quiz" }));
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    expect(isLessonCompleted("ki-fuehrerschein", protectedLesson.id)).toBe(
      true,
    );
    expect(
      isCheckpointDone(
        protectedLesson.id,
        lessonCompletionEvidenceCheckpointId("ki-fuehrerschein"),
      ),
    ).toBe(true);
    expect(screen.getByTestId("evidence-backed-completion")).toHaveTextContent(
      "complete",
    );
  });

  it("invalidates foundation-course writes when ownership becomes unresolved", () => {
    const section: LessonSection = {
      id: "block_1_lesson_1_section_1",
      title: "Prüfabschnitt",
      readTimeMinutes: 2,
      content: "Prüfe den Fall.",
    };
    const protectedLesson: Lesson = {
      ...mkLesson({
        id: "block_1_lesson_1",
        number: 1,
        title: "Geschützte Lektion",
      }),
      sections: [section],
    };
    renderLayout([protectedLesson]);
    expect(screen.getByTestId("progress-readiness")).toHaveTextContent(
      "true:true:true",
    );

    act(() => {
      activateUnknownProgress();
    });
    expect(screen.getByTestId("progress-readiness")).toHaveTextContent(
      "true:false:false",
    );

    fireEvent.click(screen.getByRole("button", { name: "review-section" }));
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    expect(isLessonCompleted("ki-fuehrerschein", protectedLesson.id)).toBe(
      false,
    );
    expect(screen.getByTestId("evidence-backed-completion")).toHaveTextContent(
      "open",
    );
  });

  it("retains but does not present a legacy completion without the evidence checkpoint", () => {
    const section: LessonSection = {
      id: "block_1_lesson_1_section_1",
      title: "Prüfabschnitt",
      readTimeMinutes: 2,
      content: "Prüfe den Fall.",
    };
    const secondSection: LessonSection = {
      id: "block_1_lesson_1_section_2",
      title: "Transferabschnitt",
      readTimeMinutes: 2,
      content: "Übertrage die Entscheidung.",
    };
    const question: LessonQuizQuestion = {
      id: "block_1_lesson_1_q1",
      questionText: "Was gilt?",
      answerOptions: [
        { id: "a", text: "A", isCorrect: true },
        { id: "b", text: "B", isCorrect: false },
      ],
      explanation: "A gilt.",
    };
    const legacyLesson: Lesson = {
      ...mkLesson({
        id: "block_1_lesson_1",
        number: 1,
        title: "Frühere Lektion",
      }),
      sections: [section, secondSection],
      quiz: [question],
    };

    markSectionRead("ki-fuehrerschein", legacyLesson.id, section.id);
    markSectionRead("ki-fuehrerschein", legacyLesson.id, secondSection.id);
    saveLessonQuizScore("ki-fuehrerschein", legacyLesson.id, 1, 1);
    markLessonCompleted("ki-fuehrerschein", legacyLesson.id);
    expect(isLessonCompleted("ki-fuehrerschein", legacyLesson.id)).toBe(true);

    renderLayout([legacyLesson]);

    expect(screen.getByTestId("evidence-backed-completion")).toHaveTextContent(
      "open",
    );
    expect(
      isCheckpointDone(
        legacyLesson.id,
        lessonCompletionEvidenceCheckpointId("ki-fuehrerschein"),
      ),
    ).toBe(false);
  });

  it("renders nothing when there are no lessons", () => {
    const { container } = renderLayout([]);
    expect(container).toBeEmptyDOMElement();
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it("opens the mobile drawer on toggle and closes it on Escape", () => {
    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "Navigation öffnen" }));
    // Toggle now reflects the open state.
    expect(
      screen.getByRole("button", { name: "Navigation schließen" }),
    ).toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "Lektionsnavigation" });
    expect(dialog).toHaveClass("overscroll-contain");
    const lessonButtons = within(dialog).getAllByRole("button");
    expect(lessonButtons[0]).toHaveFocus();
    lessonButtons.at(-1)?.focus();
    fireEvent.keyDown(lessonButtons.at(-1)!, { key: "Tab" });
    expect(lessonButtons[0]).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.getByRole("button", { name: "Navigation öffnen" }),
    ).toBeInTheDocument();
  });
});
