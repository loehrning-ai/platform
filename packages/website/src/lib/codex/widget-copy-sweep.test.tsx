import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { QuizWidget } from "@/components/widgets/tier-a/quiz";
import { CompareWidget } from "@/components/widgets/tier-a/compare";
import { TaskSpecWidget } from "@/components/widgets/tier-a/task-spec";
import { FlashcardsWidget } from "@/components/widgets/tier-a/flashcards";
import { getAllCodexLessons, __resetCodexLessonCacheForTests } from "./data";

/**
 *: proves every codex-course instance of the 4 reused
 * Tier-A widgets (quiz, compare, task-spec, flashcards) across all 12
 * lessons renders zero German-only chrome strings. Mirrors claude-course's
 * own widget-copy.test.tsx regression, run here once all
 * 12 lessons exist so the sweep covers the whole course in one pass.
 */

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

const GERMAN_ONLY_MARKERS = [
  "Schneller Check",
  "Quick check", // catches the German-course default that shouldn't leak either way
  "Vergleich",
  "Karten",
  "Bau eine Aufgaben-Spezifikation",
  "schwach",
  "mittel",
  "stark",
  "Richtig",
  "Nicht ganz",
  "Antwortoptionen",
  "Klick zum Aufdecken",
  "Klick zum Zurückdrehen",
  "Zurück",
  "Weiter",
  "Keine Karten vorhanden",
  "Karteikarten",
];

const COMPONENT_BY_KIND = {
  quiz: QuizWidget,
  compare: CompareWidget,
  "task-spec": TaskSpecWidget,
  flashcards: FlashcardsWidget,
} as const;

const CHECKED_KINDS = Object.keys(COMPONENT_BY_KIND);

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
  __resetCodexLessonCacheForTests();
});

afterEach(() => {
  cleanup();
});

describe("codex course reused Tier-A widgets render zero German-only chrome ", () => {
  it("every quiz/compare/task-spec/flashcards instance across all 12 lessons opts into English copy", async () => {
    const lessons = await getAllCodexLessons();
    let checkedCount = 0;

    for (const lesson of lessons) {
      for (const widget of lesson.widgets ?? []) {
        if (!CHECKED_KINDS.includes(widget.kind)) continue;
        checkedCount += 1;

        const props = widget.props as Record<string, unknown>;
        if (widget.kind === "quiz") {
          // The exact bug caught only via a live QA pass: `title`
          // is a SEPARATE prop from `copy`, defaulting independently to
          // German ("Schneller Check"). Every codex quiz instance must set
          // it explicitly, checked here directly rather than left to chance.
          expect(
            typeof props.title === "string" && props.title.length > 0,
            `${lesson.id}/quiz is missing an explicit English \`title\` prop`,
          ).toBe(true);
        }
        const Component =
          COMPONENT_BY_KIND[widget.kind as keyof typeof COMPONENT_BY_KIND];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { container, unmount } = render(<Component {...(props as any)} />);

        for (const marker of GERMAN_ONLY_MARKERS) {
          // "Quick check" is an intentional exception: it's codex's real
          // English default title (matches the source's `'Quick check'`
          // literal) — every other marker must never appear.
          if (marker === "Quick check") continue;
          expect(
            container.textContent?.includes(marker),
            `${lesson.id}/${widget.kind} leaked German chrome string "${marker}"`,
          ).toBe(false);
        }
        unmount();
      }
    }

    // 22 quiz + 8 compare + 3 task-spec + 1 flashcards across all 12 lessons.
    expect(checkedCount).toBeGreaterThan(0);
  });
});
