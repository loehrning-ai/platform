import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { ClaudeLessonReader } from "./claude-lesson-reader";
import { isLessonCompleted, __resetCacheForTests } from "@/lib/progress";
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
    const markAsRead = buttons.filter((button) =>
      button.textContent?.includes("Mark as read"),
    );
    const completeLesson = buttons.find((button) =>
      button.textContent?.includes("Complete lesson"),
    );

    expect(markAsRead).toHaveLength(LESSON.sections.length);
    expect(markAsRead.every((button) => button.disabled)).toBe(true);
    expect(completeLesson).toBeDefined();
    expect(completeLesson?.disabled).toBe(true);
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
  });

  it("gates the complete-lesson button until every section is marked read", () => {
    render(
      <ClaudeLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
        locale="en"
      />,
    );
    const completeButton = screen.getByRole("button", {
      name: /Complete lesson/i,
    });
    expect(completeButton).toBeDisabled();

    const markReadButtons = screen.getAllByRole("button", {
      name: /Mark as read/i,
    });
    fireEvent.click(markReadButtons[0]);
    expect(completeButton).toBeDisabled();

    fireEvent.click(
      screen.getAllByRole("button", { name: /Mark as read/i })[0],
    );
    expect(completeButton).not.toBeDisabled();
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
      name: /Mark as read/i,
    })) {
      fireEvent.click(button);
    }
    fireEvent.click(screen.getByRole("button", { name: /Complete lesson/i }));
    expect(isLessonCompleted("claude", "mental-model")).toBe(true);
    expect(screen.getByText("Lesson complete")).toBeInTheDocument();
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
      screen.getAllByRole("button", { name: /Als gelesen markieren/i }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /Lektion abschließen/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("link", { name: /Nächste Lektion/i }),
    ).toHaveAttribute("href", "/kurse/open-source/claude/kurs/anatomy");
    expect(
      screen.queryByText(/Mark as read|Complete lesson|Key takeaway/),
    ).not.toBeInTheDocument();
  });
});
