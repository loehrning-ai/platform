import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  act,
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { ClaudeLessonReader } from "./claude-lesson-reader";
import {
  isEvidenceBackedLessonCompleted,
  isLessonCompleted,
  __resetCacheForTests,
} from "@/lib/progress";
import {
  activateAnonymousProgress,
  activateUnknownProgress,
} from "@/lib/progress/store";
import type { ClaudeLesson } from "@/lib/claude-course/types";

function installLocalStoragePolyfill(): void {
  const store = new Map<string, string>();
  const polyfill: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: polyfill,
    writable: true,
    configurable: true,
  });
}

const LESSON: ClaudeLesson = {
  id: "mental-model",
  number: 3,
  title: "Test Lesson Title",
  subtitle: "Test lesson subtitle.",
  durationMinutes: 5,
  trackId: "foundations",
  hook: "Test hook.",
  keyConcepts: ["Concept A", "Concept B"],
  quiz: [],
  sections: [
    {
      id: "what-it-is",
      title: "Section One",
      readTimeMinutes: 1,
      content: "Section one content.",
    },
    {
      id: "three-things",
      title: "Section Two",
      readTimeMinutes: 2,
      content: "Section two content.",
      keyTakeaway: "The key takeaway.",
    },
    {
      id: "constitutional-ai",
      title: "Section Three",
      readTimeMinutes: 1,
      content: "Section three content.",
    },
    {
      id: "feel-it",
      title: "Section Four",
      readTimeMinutes: 1,
      content: "Section four content.",
    },
    {
      id: "failure-modes",
      title: "Section Five",
      readTimeMinutes: 1,
      content: "Section five content.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "claude",
      props: {
        lessonId: "mental-model",
        cpId: "q1",
        question: "A test question?",
        options: ["A", "B"],
        correct: 0,
        explanation: "Because A.",
      },
    },
  ],
};

beforeAll(() => {
  if (
    typeof window.localStorage === "undefined" ||
    typeof window.localStorage.setItem !== "function"
  ) {
    installLocalStoragePolyfill();
  }
});

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
});

afterEach(() => cleanup());

describe("ClaudeLessonReader ", () => {
  it("keeps server-rendered progress controls disabled until progress is ready", () => {
    const markup = renderToStaticMarkup(
      <ClaudeLessonReader
        lesson={{ ...LESSON, widgets: [] }}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
        locale="en"
      />,
    );
    const host = document.createElement("div");
    host.innerHTML = markup;
    const buttons = Array.from(host.querySelectorAll("button"));
    const sectionChecks = buttons.filter((button) =>
      button.textContent?.includes("Confirm section reviewed"),
    );
    const completionCheckpoint = buttons.find((button) =>
      button.textContent?.includes("Loading progress"),
    );

    expect(sectionChecks).toHaveLength(LESSON.sections.length);
    expect(sectionChecks.every((button) => button.disabled)).toBe(true);
    expect(completionCheckpoint).toBeDefined();
    expect(completionCheckpoint?.disabled).toBe(true);
  });

  it("renders the lesson header, sections, and key takeaway", () => {
    render(
      <ClaudeLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
        locale="en"
      />,
    );
    expect(screen.getByText("Test Lesson Title")).toBeInTheDocument();
    expect(screen.getByText("Section one content.")).toBeInTheDocument();
    expect(screen.getByText("The key takeaway.")).toBeInTheDocument();
  });

  it("renders the embedded widget through the shared registry", async () => {
    render(
      <ClaudeLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
        locale="en"
      />,
    );
    // RenderWidget lazy-loads the component, so the question text arrives
    // after the initial render.
    expect(
      await screen.findByText("A test question?", {}, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Quick check")).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: "Answer options" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Kurze Prüfung")).not.toBeInTheDocument();
  });

  it("drops transient widget answers when the learning owner changes", async () => {
    render(
      <ClaudeLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
        locale="en"
      />,
    );
    await screen.findByText("A test question?", {}, { timeout: 5_000 });
    fireEvent.click(screen.getByRole("radio", { name: /^B/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Not quite.");

    act(() => {
      activateUnknownProgress();
      activateAnonymousProgress();
    });

    await screen.findByText("A test question?", {}, { timeout: 5_000 });
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).toHaveAttribute("aria-checked", "false");
        expect(radio).not.toBeDisabled();
      }
    });
  });

  it("requires every section checkpoint and a transfer decision", () => {
    render(
      <ClaudeLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
        locale="en"
      />,
    );
    const saveCheckpoint = screen.getByRole("button", {
      name: /Save checkpoint/i,
    });
    const decision = screen.getByLabelText("Decision or revision");
    expect(decision).toBeDisabled();
    expect(saveCheckpoint).toBeDisabled();

    const sectionChecks = screen.getAllByRole("button", {
      name: /Confirm section reviewed/i,
    });
    fireEvent.click(sectionChecks[0]);
    expect(decision).toBeDisabled();

    while (
      screen.getAllByRole("button", { name: /Confirm section reviewed/i })
        .length > 1
    ) {
      fireEvent.click(
        screen.getAllByRole("button", {
          name: /Confirm section reviewed/i,
        })[0],
      );
    }
    expect(decision).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: /Confirm section reviewed/i }),
    );
    expect(decision).not.toBeDisabled();
    expect(saveCheckpoint).toBeDisabled();
    fireEvent.change(decision, {
      target: { value: "I will test the narrower prompt contract" },
    });
    expect(saveCheckpoint).not.toBeDisabled();
  });

  it("keeps every progress mutation disabled while ownership is unresolved", () => {
    activateUnknownProgress();
    render(
      <ClaudeLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
        locale="en"
      />,
    );

    expect(
      screen
        .getAllByRole("button", { name: /Confirm section reviewed/i })
        .every((button) => button.hasAttribute("disabled")),
    ).toBe(true);
    expect(screen.getByLabelText("Decision or revision")).toBeDisabled();
    expect(
      screen.getByText("Choose account or local progress above first."),
    ).toBeVisible();
    expect(isLessonCompleted("claude", LESSON.id)).toBe(false);
    expect(
      screen.queryByText("Navigation checkpoint saved"),
    ).not.toBeInTheDocument();
  });

  it("marks the lesson complete in the unified store", () => {
    render(
      <ClaudeLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
        locale="en"
      />,
    );
    for (const button of screen.getAllByRole("button", {
      name: /Confirm section reviewed/i,
    })) {
      fireEvent.click(button);
    }
    fireEvent.change(screen.getByLabelText("Decision or revision"), {
      target: { value: "I will test the narrower prompt contract" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save checkpoint/i }));
    expect(isLessonCompleted("claude", "mental-model")).toBe(true);
    expect(screen.getByText("Navigation checkpoint saved")).toBeInTheDocument();
  });

  it("does not claim completion when the final durable write is rejected", () => {
    render(
      <ClaudeLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
        locale="en"
      />,
    );
    for (const button of screen.getAllByRole("button", {
      name: /Confirm section reviewed/i,
    })) {
      fireEvent.click(button);
    }
    fireEvent.change(screen.getByLabelText("Decision or revision"), {
      target: { value: "I will test the narrower prompt contract" },
    });
    const setItem = vi
      .spyOn(window.localStorage, "setItem")
      .mockImplementation(() => {
        throw new DOMException("quota", "QuotaExceededError");
      });

    fireEvent.click(screen.getByRole("button", { name: /Save checkpoint/i }));
    expect(isLessonCompleted("claude", "mental-model")).toBe(false);
    expect(isEvidenceBackedLessonCompleted("claude", "mental-model")).toBe(
      false,
    );
    expect(
      screen.queryByText("Navigation checkpoint saved"),
    ).not.toBeInTheDocument();

    setItem.mockRestore();
    __resetCacheForTests();
    expect(isEvidenceBackedLessonCompleted("claude", "mental-model")).toBe(
      false,
    );
  });

  it("renders prev/next links when provided", () => {
    render(
      <ClaudeLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref="/kurse/open-source/claude/kurs/prev"
        nextHref="/kurse/open-source/claude/kurs/next"
        locale="en"
      />,
    );
    expect(screen.getByRole("link", { name: /Next lesson/i })).toHaveAttribute(
      "href",
      "/kurse/open-source/claude/kurs/next",
    );
    expect(
      screen.getByRole("link", { name: /Previous lesson/i }),
    ).toHaveAttribute("href", "/kurse/open-source/claude/kurs/prev");
    const routeLinks = Array.from(
      screen
        .getByRole("navigation", { name: "Lesson route" })
        .querySelectorAll("a"),
    );
    expect(routeLinks[0]).toHaveTextContent(/Previous lesson/i);
    expect(routeLinks[1]).toHaveTextContent(/Next lesson/i);
    expect(routeLinks[1]).toHaveClass("ml-auto");
  });

  it("renders German reader chrome without changing progress identities", () => {
    const germanLesson: ClaudeLesson = {
      ...LESSON,
      title: "Testlektion",
      subtitle: "Untertitel der Testlektion.",
      sections: LESSON.sections.map((section, index) => ({
        ...section,
        title: `Abschnitt ${index + 1}`,
        content: `Inhalt ${index + 1}.`,
        keyTakeaway: index === 1 ? "Die Kernaussage." : undefined,
      })),
      widgets: [],
    };

    render(
      <ClaudeLessonReader
        lesson={germanLesson}
        totalLessons={12}
        prevHref="/kurse/open-source/claude/kurs/context"
        nextHref="/kurse/open-source/claude/kurs/anatomy"
        locale="de"
      />,
    );

    expect(screen.getByText("Lektion 3 von 12")).toBeInTheDocument();
    expect(screen.getByText("Kernaussage")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: /Abschnitt als geprüft bestätigen/i,
      }),
    ).toHaveLength(germanLesson.sections.length);
    expect(
      screen.getByRole("button", { name: /Checkpoint speichern/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /Nächste Lektion/i }),
    ).toHaveAttribute("href", "/kurse/open-source/claude/kurs/anatomy");
    expect(
      screen.queryByText(
        /Confirm section reviewed|Save checkpoint|Key takeaway/,
      ),
    ).not.toBeInTheDocument();
  });
});
