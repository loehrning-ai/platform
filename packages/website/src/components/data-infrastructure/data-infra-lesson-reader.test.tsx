import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DataInfraLessonReader } from "./data-infra-lesson-reader";
import { isLessonCompleted, __resetCacheForTests } from "@/lib/progress";
import type { DataInfraLesson } from "@/lib/data-infrastructure/types";

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

// "mental-model" is a real DataInfraLessonId (required so the bespoke-widget
// slot renders a real registered component — see bespoke-registry.tsx)
// with overridden title/section content for this test.
const LESSON: DataInfraLesson = {
  id: "mental-model",
  number: 1,
  title: "Test Lesson Title",
  subtitle: "Test lesson subtitle.",
  durationMinutes: 5,
  trackId: "foundations",
  hook: "Test hook.",
  keyConcepts: ["Concept A", "Concept B"],
  quiz: [],
  sections: [
    { id: "s1", title: "Section One", readTimeMinutes: 1, content: "Section one content." },
    {
      id: "s2",
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
      props: {
        lessonId: "di-mental-model",
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
  if (typeof window.localStorage === "undefined" || typeof window.localStorage.setItem !== "function") {
    installLocalStoragePolyfill();
  }
});

beforeEach(() => {
  window.localStorage.clear();
  __resetCacheForTests();
});

afterEach(() => cleanup());

describe("DataInfraLessonReader (plan 010 stage 10)", () => {
  it("renders the lesson header, sections, and key takeaway", () => {
    render(<DataInfraLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />);
    expect(screen.getByText("Test Lesson Title")).toBeInTheDocument();
    expect(screen.getByText("Section one content.")).toBeInTheDocument();
    expect(screen.getByText("The key takeaway.")).toBeInTheDocument();
  });

  it("renders the embedded widget through the shared registry", async () => {
    render(<DataInfraLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />);
    expect(await screen.findByText("A test question?")).toBeInTheDocument();
  });

  it("renders this lesson's bespoke simulator (StackFlow for mental-model)", () => {
    render(<DataInfraLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />);
    expect(screen.getByText(/Live simulator/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /trace 1 event/ })).toBeInTheDocument();
  });

  it("gates the complete-lesson button until every section is marked read", () => {
    render(<DataInfraLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />);
    const completeButton = screen.getByRole("button", { name: /Complete lesson/i });
    expect(completeButton).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: /Mark as read/i })[0]);
    expect(completeButton).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: /Mark as read/i })[0]);
    expect(completeButton).not.toBeDisabled();
  });

  it("marks the lesson complete in the unified store", () => {
    render(<DataInfraLessonReader lesson={LESSON} totalLessons={12} prevHref={null} nextHref={null} />);
    for (const button of screen.getAllByRole("button", { name: /Mark as read/i })) {
      fireEvent.click(button);
    }
    fireEvent.click(screen.getByRole("button", { name: /Complete lesson/i }));
    expect(isLessonCompleted("data-infrastructure", "mental-model")).toBe(true);
    expect(screen.getByText("Lesson complete")).toBeInTheDocument();
  });

  it("renders prev/next links when provided", () => {
    render(
      <DataInfraLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref="/kurse/open-source/data-infrastructure/kurs/prev"
        nextHref="/kurse/open-source/data-infrastructure/kurs/next"
      />,
    );
    expect(screen.getByRole("link", { name: /Next lesson/i })).toHaveAttribute(
      "href",
      "/kurse/open-source/data-infrastructure/kurs/next",
    );
    expect(screen.getByRole("link", { name: /Previous lesson/i })).toHaveAttribute(
      "href",
      "/kurse/open-source/data-infrastructure/kurs/prev",
    );
  });
});
