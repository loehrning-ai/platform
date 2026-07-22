import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CodexLessonReader } from "./codex-lesson-reader";
import { isLessonCompleted, __resetCacheForTests } from "@/lib/progress";
import type { CodexLesson } from "@/lib/codex/types";

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

const LESSON: CodexLesson = {
  id: "L01",
  number: 3,
  title: "Test Lesson Title",
  subtitle: "Test lesson subtitle.",
  durationMinutes: 5,
  trackId: "fundamentals",
  hook: "Test hook.",
  keyConcepts: ["Concept A", "Concept B"],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Section One",
      readTimeMinutes: 1,
      content: "Section one content.",
      blocks: [
        { kind: "prose", markdown: "Section one content." },
        { kind: "pull-quote", text: "A pulled quote." },
        { kind: "callout", title: "Rule.", body: "A callout body." },
        {
          kind: "card-grid",
          cards: [{ eyebrow: "01", title: "Card title", body: "Card body." }],
        },
      ],
    },
    {
      id: "s2",
      title: "Section Two",
      readTimeMinutes: 2,
      content: "Section two content.",
      blocks: [{ kind: "prose", markdown: "Section two content." }],
      keyTakeaway: "The key takeaway.",
    },
  ],
  widgets: [
    {
      kind: "quiz",
      placement: "end",
      courseSlug: "codex",
      props: {
        lessonId: "L01",
        cpId: "q1",
        title: "Quick check",
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

describe("CodexLessonReader ", () => {
  it("renders the lesson header, sections, and key takeaway", () => {
    render(<CodexLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />);
    expect(screen.getByText("Test Lesson Title")).toBeInTheDocument();
    expect(screen.getByText("Section one content.")).toBeInTheDocument();
    expect(screen.getByText("The key takeaway.")).toBeInTheDocument();
  });

  it("renders each CodexBlock kind with its own treatment", () => {
    render(<CodexLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />);
    expect(screen.getByText("A pulled quote.")).toBeInTheDocument();
    expect(screen.getByText(/A callout body\./)).toBeInTheDocument();
    expect(screen.getByText("Card title")).toBeInTheDocument();
  });

  it("renders the embedded widget through the shared registry", async () => {
    render(<CodexLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />);
    expect(await screen.findByText("A test question?")).toBeInTheDocument();
  });

  it("renders the bespoke interactive for the lesson id", () => {
    render(<CodexLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />);
    expect(screen.getByText(/Bespoke · Three-body contract/)).toBeInTheDocument();
  });

  it("gates the complete-lesson button until every section is marked read", () => {
    render(<CodexLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />);
    const completeButton = screen.getByRole("button", { name: /Complete lesson/i });
    expect(completeButton).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: /Mark as read/i })[0]);
    expect(completeButton).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: /Mark as read/i })[0]);
    expect(completeButton).not.toBeDisabled();
  });

  it("marks the lesson complete in the unified store", () => {
    render(<CodexLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />);
    for (const button of screen.getAllByRole("button", { name: /Mark as read/i })) {
      fireEvent.click(button);
    }
    fireEvent.click(screen.getByRole("button", { name: /Complete lesson/i }));
    expect(isLessonCompleted("codex", "L01")).toBe(true);
    expect(screen.getByText("Lesson complete")).toBeInTheDocument();
  });

  it("renders prev/next links when provided", () => {
    render(
      <CodexLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref="/kurse/open-source/codex/kurs/prev"
        nextHref="/kurse/open-source/codex/kurs/next"
      />,
    );
    expect(screen.getByRole("link", { name: /Next lesson/i })).toHaveAttribute(
      "href",
      "/kurse/open-source/codex/kurs/next",
    );
    expect(screen.getByRole("link", { name: /Previous lesson/i })).toHaveAttribute(
      "href",
      "/kurse/open-source/codex/kurs/prev",
    );
  });
});
