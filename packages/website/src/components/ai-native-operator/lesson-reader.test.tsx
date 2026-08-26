import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  cleanup,
} from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { AiNativeOperatorLessonReader } from "./lesson-reader";
import {
  __resetCacheForTests,
  completeCheckpoint,
  isLessonCompleted,
} from "@/lib/progress";
import {
  activateAnonymousProgress,
  activateUnknownProgress,
} from "@/lib/progress/store";
import type { AiNativeOperatorLesson } from "@/lib/ai-native-operator/types";
import type { NextTarget } from "./lesson-page";

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

const READING_LESSON: AiNativeOperatorLesson = {
  id: "mindset/1",
  moduleId: "mindset",
  lessonNumber: 1,
  number: 1,
  kind: "reading",
  title: "Test reading lesson",
  subtitle: "A subtitle.",
  objective: "Learn the thing.",
  durationMinutes: 10,
  keyConcepts: [],
  quiz: [],
  sections: [
    {
      id: "s1",
      title: "Section one",
      readTimeMinutes: 3,
      content: "Section one prose.",
    },
  ],
  callout: { kind: "note", h: "A note", text: "Note text." },
  exerciseKind: "reflect-box",
  widgets: [
    {
      kind: "reflect-box",
      placement: "end",
      courseSlug: "ai-native-operator",
      props: {
        lessonId: "mindset/1",
        cpId: "exercise",
        scenario: "Reflect on it.",
      },
    },
  ],
};

const QUIZ_LESSON: AiNativeOperatorLesson = {
  id: "mindset/5",
  moduleId: "mindset",
  lessonNumber: 5,
  number: 5,
  kind: "quiz",
  title: "Module 1 — knowledge check",
  subtitle: "",
  objective: "Confirm understanding.",
  durationMinutes: 8,
  keyConcepts: [],
  sections: [],
  widgets: [],
  quiz: [
    {
      id: "ano-mindset-q1",
      questionText: "A test question?",
      answerOptions: [
        { id: "a", text: "Wrong", isCorrect: false },
        { id: "b", text: "Right", isCorrect: true },
      ],
      explanation: "Because right is right.",
    },
    {
      id: "ano-mindset-q2",
      questionText: "A second test question?",
      answerOptions: [
        { id: "a", text: "Second wrong", isCorrect: false },
        { id: "b", text: "Second right", isCorrect: true },
      ],
      explanation: "Because the second answer is right.",
    },
    {
      id: "ano-mindset-q3",
      questionText: "A third test question?",
      answerOptions: [
        { id: "a", text: "Third wrong", isCorrect: false },
        { id: "b", text: "Third right", isCorrect: true },
      ],
      explanation: "Because the third answer is right.",
    },
  ],
};

const NEXT_LESSON: NextTarget = {
  href: "/kurse/open-source/ai-native-operator/mindset/2",
  label: "Next lesson",
  kind: "lesson",
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

describe("AiNativeOperatorLessonReader ", () => {
  it("keeps the server-rendered completion control disabled until progress is ready", () => {
    const markup = renderToStaticMarkup(
      <AiNativeOperatorLessonReader
        lesson={{ ...READING_LESSON, widgets: [] }}
        prevHref={null}
        prevTitle={null}
        next={NEXT_LESSON}
      />,
    );
    const host = document.createElement("div");
    host.innerHTML = markup;
    const completion = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Loading progress"),
    );

    expect(completion).toBeDefined();
    expect(completion?.disabled).toBe(true);
    expect(completion).toHaveAttribute("aria-busy", "true");
  });

  it("renders the header, objective, sections, and callout for a reading lesson", () => {
    render(
      <AiNativeOperatorLessonReader
        lesson={READING_LESSON}
        prevHref={null}
        prevTitle={null}
        next={NEXT_LESSON}
      />,
    );
    expect(screen.getByText("Test reading lesson")).toBeInTheDocument();
    expect(screen.getByText("Learn the thing.")).toBeInTheDocument();
    expect(screen.getByText("Section one prose.")).toBeInTheDocument();
    expect(screen.getByText("A note")).toBeInTheDocument();
    expect(screen.getByText("Note text.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Course" })).toHaveClass(
      "min-h-11",
      "min-w-11",
      "focus-visible:ring-2",
    );
  });

  it("renders the exercise widget through the shared registry", async () => {
    render(
      <AiNativeOperatorLessonReader
        lesson={READING_LESSON}
        prevHref={null}
        prevTitle={null}
        next={NEXT_LESSON}
      />,
    );
    expect(
      await screen.findByText("Reflect on it.", {}, { timeout: 5_000 }),
    ).toBeInTheDocument();
  });

  it("renders a quiz-kind lesson's questions as stacked quiz widgets", async () => {
    render(
      <AiNativeOperatorLessonReader
        lesson={QUIZ_LESSON}
        prevHref={null}
        prevTitle={null}
        next={NEXT_LESSON}
      />,
    );
    expect(
      await screen.findByText("A test question?", {}, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Wrong")).toBeInTheDocument();
    expect(screen.getByText("Right")).toBeInTheDocument();
  });

  it("renders the previous-lesson link when provided", () => {
    render(
      <AiNativeOperatorLessonReader
        lesson={READING_LESSON}
        prevHref="/kurse/open-source/ai-native-operator/mindset/prev"
        prevTitle="Previous lesson title"
        next={NEXT_LESSON}
      />,
    );
    expect(screen.getByText("Previous lesson title")).toBeInTheDocument();
  });

  it("renders the final-assessment terminal link", () => {
    render(
      <AiNativeOperatorLessonReader
        lesson={READING_LESSON}
        prevHref={null}
        prevTitle={null}
        next={{
          href: "/kurse/open-source/ai-native-operator#final-assessment",
          label: "Continue to final assessment",
          kind: "final-assessment",
        }}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Continue to final assessment" }),
    ).toHaveAttribute(
      "href",
      "/kurse/open-source/ai-native-operator#final-assessment",
    );
  });

  it("requires the transfer exercise and a concrete decision for a reading lesson", () => {
    expect(isLessonCompleted("ai-native-operator", "mindset/1")).toBe(false);
    render(
      <AiNativeOperatorLessonReader
        lesson={READING_LESSON}
        prevHref={null}
        prevTitle={null}
        next={NEXT_LESSON}
      />,
    );
    expect(isLessonCompleted("ai-native-operator", "mindset/1")).toBe(false);
    const saveCheckpoint = screen.getByRole("button", {
      name: "Save checkpoint",
    });
    const decision = screen.getByLabelText("Decision or revision");
    expect(decision).toBeDisabled();
    expect(
      screen.getByText("Complete the transfer exercise first."),
    ).toBeVisible();
    expect(saveCheckpoint).toBeDisabled();
    act(() => {
      completeCheckpoint("mindset/1", "exercise");
    });
    expect(decision).not.toBeDisabled();
    fireEvent.change(decision, {
      target: { value: "I will narrow the approval boundary" },
    });
    fireEvent.click(saveCheckpoint);
    expect(isLessonCompleted("ai-native-operator", "mindset/1")).toBe(true);
    expect(screen.getByText("Navigation checkpoint saved")).toBeInTheDocument();
  });

  it("does not claim or persist completion while the learning owner is unresolved", () => {
    activateUnknownProgress();
    render(
      <AiNativeOperatorLessonReader
        lesson={READING_LESSON}
        prevHref={null}
        prevTitle={null}
        next={NEXT_LESSON}
      />,
    );

    expect(screen.getByLabelText("Decision or revision")).toBeDisabled();
    expect(
      screen.getByText("Choose account or local progress above first."),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Save checkpoint" }));
    expect(isLessonCompleted("ai-native-operator", "mindset/1")).toBe(false);
    expect(
      screen.queryByText("Navigation checkpoint saved"),
    ).not.toBeInTheDocument();
  });

  it("drops an unsaved transfer decision when the learning owner changes", () => {
    render(
      <AiNativeOperatorLessonReader
        lesson={READING_LESSON}
        prevHref={null}
        prevTitle={null}
        next={NEXT_LESSON}
      />,
    );
    act(() => {
      completeCheckpoint("mindset/1", "exercise");
    });
    const decision = screen.getByLabelText("Decision or revision");
    fireEvent.change(decision, {
      target: { value: "I will narrow the approval boundary" },
    });
    expect(decision).toHaveValue("I will narrow the approval boundary");

    act(() => {
      activateUnknownProgress();
    });
    expect(screen.getByLabelText("Decision or revision")).toBeDisabled();
    expect(screen.getByLabelText("Decision or revision")).toHaveValue("");

    act(() => {
      activateAnonymousProgress();
    });
    expect(screen.getByLabelText("Decision or revision")).not.toBeDisabled();
    expect(screen.getByLabelText("Decision or revision")).toHaveValue("");
    expect(isLessonCompleted("ai-native-operator", "mindset/1")).toBe(false);
  });

  it("requires every quiz checkpoint before a quiz lesson can be completed", () => {
    expect(isLessonCompleted("ai-native-operator", "mindset/5")).toBe(false);
    render(
      <AiNativeOperatorLessonReader
        lesson={QUIZ_LESSON}
        prevHref={null}
        prevTitle={null}
        next={NEXT_LESSON}
      />,
    );
    const decision = screen.getByLabelText("Decision or revision");
    expect(decision).toBeDisabled();
    expect(
      screen.getByText("Answer every question correctly first."),
    ).toBeVisible();
    act(() => {
      completeCheckpoint("mindset/5", "ano-mindset-q1");
    });
    expect(decision).toBeDisabled();
    act(() => {
      completeCheckpoint("mindset/5", "ano-mindset-q2");
      completeCheckpoint("mindset/5", "ano-mindset-q3");
    });
    expect(decision).not.toBeDisabled();
    fireEvent.change(decision, {
      target: { value: "I will revise the unsafe decision rule" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save checkpoint" }));
    expect(isLessonCompleted("ai-native-operator", "mindset/5")).toBe(true);
  });

  it("renders the next-module transition label", () => {
    render(
      <AiNativeOperatorLessonReader
        lesson={READING_LESSON}
        prevHref={null}
        prevTitle={null}
        next={{
          href: "/kurse/open-source/ai-native-operator/engineering",
          label: "Next module: Engineering Practices",
          kind: "module",
        }}
      />,
    );
    expect(
      screen.getByText("Next module: Engineering Practices"),
    ).toBeInTheDocument();
  });
});
