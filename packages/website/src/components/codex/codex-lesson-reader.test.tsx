import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
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
    {
      id: "s3",
      title: "Section Three",
      readTimeMinutes: 1,
      content: "Section three content.",
      blocks: [{ kind: "prose", markdown: "Section three content." }],
    },
    {
      id: "s4",
      title: "Section Four",
      readTimeMinutes: 1,
      content: "Section four content.",
      blocks: [{ kind: "prose", markdown: "Section four content." }],
    },
    {
      id: "s5",
      title: "Section Five",
      readTimeMinutes: 1,
      content: "Section five content.",
      blocks: [{ kind: "prose", markdown: "Section five content." }],
    },
    {
      id: "s6",
      title: "Section Six",
      readTimeMinutes: 1,
      content: "Section six content.",
      blocks: [{ kind: "prose", markdown: "Section six content." }],
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
  it("keeps server-rendered progress controls disabled until progress is ready", () => {
    const markup = renderToStaticMarkup(
      <CodexLessonReader
        lesson={{ ...LESSON, widgets: [] }}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
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
      <CodexLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
      />,
    );
    expect(screen.getByText("Test Lesson Title")).toBeInTheDocument();
    expect(screen.getByText("Section one content.")).toBeInTheDocument();
    expect(screen.getByText("The key takeaway.")).toBeInTheDocument();
  });

  it("renders each CodexBlock kind with its own treatment", () => {
    render(
      <CodexLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
      />,
    );
    expect(screen.getByText("A pulled quote.")).toBeInTheDocument();
    expect(screen.getByText(/A callout body\./)).toBeInTheDocument();
    expect(screen.getByText("Card title")).toBeInTheDocument();
  });

  it("renders the embedded widget through the shared registry", async () => {
    render(
      <CodexLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
      />,
    );
    expect(
      await screen.findByText("A test question?", {}, { timeout: 5_000 }),
    ).toBeInTheDocument();
  });

  it("renders the bespoke interactive for the lesson id", () => {
    render(
      <CodexLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
      />,
    );
    expect(
      screen.getByText(/Exercise · Task contract inputs/),
    ).toBeInTheDocument();
  });

  it("requires every section checkpoint and a transfer decision", () => {
    render(
      <CodexLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
      />,
    );
    const saveCheckpoint = screen.getByRole("button", {
      name: /Save checkpoint/i,
    });
    const decision = screen.getByLabelText("Decision or revision");
    expect(decision).toBeDisabled();
    expect(saveCheckpoint).toBeDisabled();

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
      target: { value: "I will test the narrower task boundary" },
    });
    expect(saveCheckpoint).not.toBeDisabled();
  });

  it("marks the lesson complete in the unified store", () => {
    render(
      <CodexLessonReader
        lesson={LESSON}
        totalLessons={12}
        prevHref={null}
        nextHref={null}
      />,
    );
    for (const button of screen.getAllByRole("button", {
      name: /Confirm section reviewed/i,
    })) {
      fireEvent.click(button);
    }
    fireEvent.change(screen.getByLabelText("Decision or revision"), {
      target: { value: "I will test the narrower task boundary" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save checkpoint/i }));
    expect(isLessonCompleted("codex", "L01")).toBe(true);
    expect(screen.getByText("Navigation checkpoint saved")).toBeInTheDocument();
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
    expect(
      screen.getByRole("link", { name: /Previous lesson/i }),
    ).toHaveAttribute("href", "/kurse/open-source/codex/kurs/prev");
    const routeLinks = Array.from(
      screen
        .getByRole("navigation", { name: "Lesson route" })
        .querySelectorAll("a"),
    );
    expect(routeLinks[0]).toHaveTextContent(/Previous lesson/i);
    expect(routeLinks[1]).toHaveTextContent(/Next lesson/i);
    expect(routeLinks[1]).toHaveClass("ml-auto");
  });
});
