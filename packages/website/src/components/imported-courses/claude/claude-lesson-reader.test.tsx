import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
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
  it("renders the lesson header, sections, and key takeaway", () => {
    render(
      <ClaudeLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />,
    );
    expect(screen.getByText("Test Lesson Title")).toBeInTheDocument();
    expect(screen.getByText("Section one content.")).toBeInTheDocument();
    expect(screen.getByText("The key takeaway.")).toBeInTheDocument();
  });

  it("renders the embedded widget through the shared registry", async () => {
    render(
      <ClaudeLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />,
    );
    // RenderWidget lazy-loads the component, so the question text arrives
    // after the initial render.
    expect(
      await screen.findByText("A test question?", {}, { timeout: 5_000 }),
    ).toBeInTheDocument();
  });

  it("gates the complete-lesson button until every section is marked read", () => {
    render(
      <ClaudeLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />,
    );
    const completeButton = screen.getByRole("button", { name: /Complete lesson/i });
    expect(completeButton).toBeDisabled();

    const markReadButtons = screen.getAllByRole("button", { name: /Mark as read/i });
    fireEvent.click(markReadButtons[0]);
    expect(completeButton).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: /Mark as read/i })[0]);
    expect(completeButton).not.toBeDisabled();
  });

  it("marks the lesson complete in the unified store", () => {
    render(
      <ClaudeLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />,
    );
    for (const button of screen.getAllByRole("button", { name: /Mark as read/i })) {
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
      />,
    );
    expect(screen.getByRole("link", { name: /Next lesson/i })).toHaveAttribute(
      "href",
      "/kurse/open-source/claude/kurs/next",
    );
    expect(screen.getByRole("link", { name: /Previous lesson/i })).toHaveAttribute(
      "href",
      "/kurse/open-source/claude/kurs/prev",
    );
  });
});
