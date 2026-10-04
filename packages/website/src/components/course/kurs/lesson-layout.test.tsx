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
 * Covers the legacy section reader path, driven through a course that has
 * not moved to the lesson engine yet (ki-und-gesellschaft; the EU AI Act course moved). The lesson-engine
 * dispatch is covered at the end of this file and in
 * components/lesson-engine/lesson-flow.test.tsx.
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

const usageEvents = vi.hoisted(() => ({
  trackCourseStarted: vi.fn(),
  trackLessonCompleted: vi.fn(),
  trackLessonReached: vi.fn(),
}));

vi.mock("@/lib/analytics/events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analytics/events")>()),
  ...usageEvents,
}));

vi.mock("@/lib/progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress")>();
  return {
    ...actual,
    recordLessonCompletionEvidenceDurably: vi.fn(
      actual.recordLessonCompletionEvidenceDurably,
    ),
  };
});

import { LessonLayout, __resetLessonUsageEventsForTests } from "./lesson-layout";
import {
  CANONICAL_LESSON_IDS,
  CANONICAL_SECTION_IDS,
  lessonCompletionEvidenceCheckpointId,
} from "@/lib/courses/completion";
import {
  isLessonCompleted,
  markLessonCompleted,
  markSectionRead,
  resetProgress,
  saveLessonQuizScore,
} from "@/lib/course/progress";
import {
  isCheckpointDone,
  recordLessonCompletionEvidenceDurably,
} from "@/lib/progress";
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
  resetProgress("ki-und-gesellschaft");
  window.history.replaceState({}, "", "/ki-und-gesellschaft/kurs/block_1");
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
      courseSlug="ki-und-gesellschaft"
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

  it("resets the native reference to its open default when an in-place lesson switch occurs", () => {
    const { container } = renderLayout();
    const firstReference = container.querySelector<HTMLDetailsElement>(
      "details[data-lesson-reference]",
    );
    expect(firstReference).not.toBeNull();
    expect(firstReference).toHaveAttribute("open");
    firstReference!.open = false;

    fireEvent.click(
      screen.getByRole("button", { name: "Lektion 2: Zweite Lektion" }),
    );

    const nextReference = container.querySelector<HTMLDetailsElement>(
      "details[data-lesson-reference]",
    );
    expect(nextReference).not.toBe(firstReference);
    expect(nextReference).toHaveAttribute("open");
  });

  it("replaces a stale resume fragment so reload restores the latest selection", () => {
    window.history.replaceState(
      {},
      "",
      "/ki-und-gesellschaft/kurs/block_1?source=resume#lesson=l2",
    );
    const firstRender = renderLayout();
    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Zweite Lektion",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Lektion 1: Erste Lektion" }),
    );
    expect(window.location.pathname).toBe("/ki-und-gesellschaft/kurs/block_1");
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
      "/ki-und-gesellschaft/kurs/block_1#lesson=l2",
    );
    renderLayout();

    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Zweite Lektion",
    );

    window.history.replaceState(
      {},
      "",
      "/ki-und-gesellschaft/kurs/block_1#lesson=l1",
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
      "/ki-und-gesellschaft/kurs/block_1#lesson=%E0%A4%A",
    );
    renderLayout();
    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Erste Lektion",
    );

    window.history.replaceState(
      {},
      "",
      "/ki-und-gesellschaft/kurs/block_1#lesson=not-in-this-block",
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

  it("the reader action advances a completed lesson through the bounded hash without completing the next lesson", () => {
    const first = mkLesson({ id: "arbeit-1-1", number: 1, title: "Erste Lektion" });
    const second = mkLesson({ id: "arbeit-1-2", number: 2, title: "Zweite Lektion" });
    const { container } = renderLayout([first, second]);
    const action = () => container.querySelector<HTMLElement>("[data-reader-focus-action]")!;
    const persistFixturePrerequisites = (lessonId: string) => act(() => {
      for (const sectionId of CANONICAL_SECTION_IDS["ki-und-gesellschaft"][lessonId]) {
        markSectionRead("ki-und-gesellschaft", lessonId, sectionId);
      }
      saveLessonQuizScore("ki-und-gesellschaft", lessonId, 1, 1);
    });

    expect(action()).toHaveTextContent("Aufgabe öffnen");
    persistFixturePrerequisites(first.id);
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    expect(action()).toHaveTextContent("Weiter");
    fireEvent.click(action());

    expect(window.location.hash).toBe("#lesson=arbeit-1-2");
    expect(screen.getByTestId("active-title")).toHaveTextContent("Zweite Lektion");
    expect(action()).toHaveTextContent("Aufgabe öffnen");
    expect(isLessonCompleted("ki-und-gesellschaft", second.id)).toBe(false);
    expect(container.querySelector("[data-reader-focus-position]")).toHaveTextContent("2 / 2");

    persistFixturePrerequisites(second.id);
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    expect(action()).toHaveTextContent("Zum Kurs");
    expect(action()).toHaveAttribute("href", "/ki-und-gesellschaft/kurs");
  });

  it("rejects completion writes until persisted section and quiz evidence exist", () => {
    const section: LessonSection = {
      id: "arbeit-1-1-s1",
      title: "Prüfabschnitt",
      readTimeMinutes: 2,
      content: "Prüfe den Fall.",
    };
    const secondSection: LessonSection = {
      id: "arbeit-1-1-s2",
      title: "Transferabschnitt",
      readTimeMinutes: 2,
      content: "Übertrage die Entscheidung.",
    };
    const question: LessonQuizQuestion = {
      id: "arbeit-1-1-question_1",
      questionText: "Was gilt?",
      answerOptions: [
        { id: "a", text: "A", isCorrect: true },
        { id: "b", text: "B", isCorrect: false },
      ],
      explanation: "A gilt.",
    };
    const protectedLesson: Lesson = {
      ...mkLesson({
        id: "arbeit-1-1",
        number: 1,
        title: "Geschützte Lektion",
      }),
      sections: [section, secondSection],
      quiz: [question],
    };

    renderLayout([protectedLesson]);
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    expect(isLessonCompleted("ki-und-gesellschaft", protectedLesson.id)).toBe(
      false,
    );
    expect(document.querySelector("[data-reader-focus-action]")).toHaveTextContent("Aufgabe öffnen");

    fireEvent.click(screen.getByRole("button", { name: "review-section" }));
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    expect(isLessonCompleted("ki-und-gesellschaft", protectedLesson.id)).toBe(
      false,
    );

    markSectionRead("ki-und-gesellschaft", protectedLesson.id, secondSection.id);
    // The EU AI Act lesson authors three canonical sections.
    markSectionRead(
      "ki-und-gesellschaft",
      protectedLesson.id,
      "arbeit-1-1-s3",
    );
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    expect(isLessonCompleted("ki-und-gesellschaft", protectedLesson.id)).toBe(
      false,
    );

    fireEvent.click(screen.getByRole("button", { name: "finish-quiz" }));
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    expect(isLessonCompleted("ki-und-gesellschaft", protectedLesson.id)).toBe(
      true,
    );
    expect(
      isCheckpointDone(
        protectedLesson.id,
        lessonCompletionEvidenceCheckpointId("ki-und-gesellschaft"),
      ),
    ).toBe(true);
    expect(screen.getByTestId("evidence-backed-completion")).toHaveTextContent(
      "complete",
    );
    expect(document.querySelector("[data-reader-focus-action]")).toHaveTextContent("Zum Kurs");
  });

  it("invalidates foundation-course writes when ownership becomes unresolved", () => {
    const section: LessonSection = {
      id: "arbeit-1-1-s1",
      title: "Prüfabschnitt",
      readTimeMinutes: 2,
      content: "Prüfe den Fall.",
    };
    const protectedLesson: Lesson = {
      ...mkLesson({
        id: "arbeit-1-1",
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
    expect(isLessonCompleted("ki-und-gesellschaft", protectedLesson.id)).toBe(
      false,
    );
    expect(screen.getByTestId("evidence-backed-completion")).toHaveTextContent(
      "open",
    );
  });

  it("retains but does not present a legacy completion without the evidence checkpoint", () => {
    const section: LessonSection = {
      id: "arbeit-1-1-s1",
      title: "Prüfabschnitt",
      readTimeMinutes: 2,
      content: "Prüfe den Fall.",
    };
    const secondSection: LessonSection = {
      id: "arbeit-1-1-s2",
      title: "Transferabschnitt",
      readTimeMinutes: 2,
      content: "Übertrage die Entscheidung.",
    };
    const question: LessonQuizQuestion = {
      id: "arbeit-1-1-q1",
      questionText: "Was gilt?",
      answerOptions: [
        { id: "a", text: "A", isCorrect: true },
        { id: "b", text: "B", isCorrect: false },
      ],
      explanation: "A gilt.",
    };
    const legacyLesson: Lesson = {
      ...mkLesson({
        id: "arbeit-1-1",
        number: 1,
        title: "Frühere Lektion",
      }),
      sections: [section, secondSection],
      quiz: [question],
    };

    markSectionRead("ki-und-gesellschaft", legacyLesson.id, section.id);
    markSectionRead("ki-und-gesellschaft", legacyLesson.id, secondSection.id);
    saveLessonQuizScore("ki-und-gesellschaft", legacyLesson.id, 1, 1);
    markLessonCompleted("ki-und-gesellschaft", legacyLesson.id);
    expect(isLessonCompleted("ki-und-gesellschaft", legacyLesson.id)).toBe(true);

    renderLayout([legacyLesson]);

    expect(screen.getByTestId("evidence-backed-completion")).toHaveTextContent(
      "open",
    );
    expect(
      isCheckpointDone(
        legacyLesson.id,
        lessonCompletionEvidenceCheckpointId("ki-und-gesellschaft"),
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

describe("<LessonLayout> usage events", () => {
  const COMPLETABLE_LESSONS: readonly Lesson[] = [
    mkLesson({ id: "arbeit-1-1", number: 1, title: "Erste Lektion" }),
    mkLesson({ id: "arbeit-1-2", number: 2, title: "Zweite Lektion" }),
  ];
  const READABLE_LESSONS: readonly Lesson[] = [
    {
      ...mkLesson({ id: "arbeit-1-1", number: 1, title: "Erste Lektion" }),
      sections: [
        {
          id: "arbeit-1-1-s1",
          title: "Prüfabschnitt",
          readTimeMinutes: 2,
          content: "Prüfe den Fall.",
        },
      ],
    },
  ];

  beforeEach(() => {
    __resetLessonUsageEventsForTests();
    usageEvents.trackCourseStarted.mockClear();
    usageEvents.trackLessonCompleted.mockClear();
    usageEvents.trackLessonReached.mockClear();
    vi.mocked(recordLessonCompletionEvidenceDurably).mockClear();
  });

  it("reports a reached block-course lesson once per position, only after progress resolves", () => {
    activateUnknownProgress();
    renderLayout(COMPLETABLE_LESSONS);
    expect(usageEvents.trackLessonReached).not.toHaveBeenCalled();

    act(() => {
      activateAnonymousProgress();
    });
    expect(usageEvents.trackLessonReached.mock.calls).toEqual([
      ["ki-und-gesellschaft", "l01"],
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: "Lektion 2: Zweite Lektion" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Lektion 1: Erste Lektion" }),
    );
    expect(usageEvents.trackLessonReached.mock.calls).toEqual([
      ["ki-und-gesellschaft", "l01"],
      ["ki-und-gesellschaft", "l02"],
    ]);
  });

  it("reports the fragment-restored lesson rather than the default first lesson", () => {
    window.history.replaceState(
      {},
      "",
      "/ki-und-gesellschaft/kurs/block_1#lesson=arbeit-1-2",
    );
    renderLayout(COMPLETABLE_LESSONS);

    expect(screen.getByTestId("active-title")).toHaveTextContent(
      "Zweite Lektion",
    );
    expect(usageEvents.trackLessonReached.mock.calls).toEqual([
      ["ki-und-gesellschaft", "l02"],
    ]);
  });

  it("does not report a reached lesson for a statically routed course", () => {
    const routedLessonId = CANONICAL_LESSON_IDS["data-infrastructure"][0];
    render(
      <LessonLayout
        courseSlug="data-infrastructure"
        lessons={[
          mkLesson({ id: routedLessonId, number: 1, title: "Data Infrastructure" }),
        ]}
        blockTitle="Data Infrastructure"
      />,
    );

    expect(screen.getByTestId("progress-readiness")).toHaveTextContent(
      "true:true:true",
    );
    expect(usageEvents.trackLessonReached).not.toHaveBeenCalled();
  });

  it("reports each persisted completion once and the course start once per document", () => {
    vi.mocked(recordLessonCompletionEvidenceDurably)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    renderLayout(COMPLETABLE_LESSONS);

    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Lektion 2: Zweite Lektion" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));

    expect(usageEvents.trackLessonCompleted.mock.calls).toEqual([
      ["ki-und-gesellschaft", "l01"],
      ["ki-und-gesellschaft", "l02"],
    ]);
    expect(usageEvents.trackCourseStarted.mock.calls).toEqual([
      ["ki-und-gesellschaft"],
    ]);
  });

  it("reports nothing when the completion was not persisted", () => {
    vi.mocked(recordLessonCompletionEvidenceDurably).mockReturnValueOnce(false);
    renderLayout(COMPLETABLE_LESSONS);

    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));

    expect(recordLessonCompletionEvidenceDurably).toHaveBeenCalledTimes(1);
    expect(usageEvents.trackLessonCompleted).not.toHaveBeenCalled();
    expect(usageEvents.trackCourseStarted).not.toHaveBeenCalled();
  });

  it("reports the course start from the first persisted section review only once", () => {
    renderLayout(READABLE_LESSONS);

    fireEvent.click(screen.getByRole("button", { name: "review-section" }));
    fireEvent.click(screen.getByRole("button", { name: "review-section" }));

    expect(usageEvents.trackCourseStarted.mock.calls).toEqual([
      ["ki-und-gesellschaft"],
    ]);
    expect(usageEvents.trackLessonCompleted).not.toHaveBeenCalled();
  });

  it("does not report the start again on a later page load after a persisted section review", () => {
    const first = renderLayout(READABLE_LESSONS);
    fireEvent.click(screen.getByRole("button", { name: "review-section" }));
    first.unmount();

    // A reload starts a new document with an empty per-document dedupe.
    __resetLessonUsageEventsForTests();
    const laterLessons: readonly Lesson[] = [
      {
        ...READABLE_LESSONS[0]!,
        sections: [
          {
            id: "arbeit-1-1-s2",
            title: "Zweiter Prüfabschnitt",
            readTimeMinutes: 2,
            content: "Prüfe den nächsten Fall.",
          },
        ],
      },
    ];
    renderLayout(laterLessons);
    fireEvent.click(screen.getByRole("button", { name: "review-section" }));

    expect(usageEvents.trackCourseStarted.mock.calls).toEqual([
      ["ki-und-gesellschaft"],
    ]);
  });

  it("does not report a start on completion when a section read was persisted earlier", () => {
    act(() => {
      markSectionRead(
        "ki-und-gesellschaft",
        "arbeit-1-1",
        "arbeit-1-1-s1",
      );
    });
    vi.mocked(recordLessonCompletionEvidenceDurably).mockReturnValueOnce(true);
    renderLayout(COMPLETABLE_LESSONS);

    fireEvent.click(screen.getByRole("button", { name: "mark-complete" }));

    expect(usageEvents.trackLessonCompleted.mock.calls).toEqual([
      ["ki-und-gesellschaft", "l01"],
    ]);
    expect(usageEvents.trackCourseStarted).not.toHaveBeenCalled();
  });

  it("does not report a section review while ownership is unresolved", () => {
    renderLayout(READABLE_LESSONS);
    act(() => {
      activateUnknownProgress();
    });

    fireEvent.click(screen.getByRole("button", { name: "review-section" }));

    expect(usageEvents.trackCourseStarted).not.toHaveBeenCalled();
  });
});

describe("<LessonLayout> lesson-engine dispatch", () => {
  it("renders lesson-engine lessons through LessonFlow instead of the section reader", async () => {
    const { getBlockLessons } = await import("@/lib/course/data");
    const lessons = getBlockLessons("ki-fuehrerschein", "block_1");
    const onFollowing = "/ki-fuehrerschein/kurs/block_2#lesson=briefen-2-1";
    render(
      <LessonLayout
        courseSlug="ki-fuehrerschein"
        lessons={lessons}
        blockTitle="Was darf rein?"
        moduleLabel="Modul 1 · Was darf rein?"
        courseLessonCount={8}
        followingHref={onFollowing}
        followingLabel="Weiter mit Modul 2: Gut briefen"
      />,
    );

    expect(screen.queryByTestId("lesson-content")).toBeNull();
    const flow = document.querySelector("[data-lesson-engine]");
    expect(flow).toHaveAttribute("data-lesson-id", "daten-1-1");
    expect(screen.getByRole("heading", { level: 1, name: lessons[0].title })).toBeInTheDocument();
    expect(screen.getByText(/Modul 1 · Was darf rein\?/)).toBeInTheDocument();
    expect(flow?.textContent).toMatch(/Lektion 1 von 8/);

    fireEvent.click(screen.getByRole("button", { name: `Weiter: ${lessons[1].title}` }));
    expect(window.location.hash).toBe("#lesson=daten-1-2");
    expect(document.querySelector("[data-lesson-engine]")).toHaveAttribute("data-lesson-id", "daten-1-2");
    expect(screen.getByRole("link", { name: /Weiter mit Modul 2: Gut briefen/ })).toHaveAttribute(
      "href",
      onFollowing,
    );
  });
});
