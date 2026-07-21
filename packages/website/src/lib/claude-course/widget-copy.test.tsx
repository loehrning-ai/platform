import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { QuizWidget } from "@/components/widgets/tier-a/quiz";
import { DragReorderWidget } from "@/components/widgets/tier-a/drag-reorder";
import { FailureTaggerWidget } from "@/components/widgets/tier-a/failure-tagger";
import { RedactionDrillWidget } from "@/components/widgets/tier-a/redaction-drill";
import { getAllClaudeLessons, __resetClaudeLessonCacheForTests } from "./data";

/**
 * Plan 008 stage 3: proves every claude-course instance of the 4 reused
 * Tier-A widgets (quiz, drag-reorder, failure-tagger, redaction-drill) opts
 * into the English `copy` override and renders zero German-only chrome
 * strings. This is a DOM check, not an eyeball check, per the plan's
 * explicit "verify this with a regression test" requirement.
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

// German-only chrome strings that must never appear once a claude-course
// widget instance opts into the English `copy` override.
const GERMAN_ONLY_MARKERS = [
  "Schneller Check",
  "Sortiere die Risikostufen",
  "Benenne den Fehlertyp",
  "Redigiere, bevor du einfügst",
  "Richtig",
  "Nicht ganz",
  "Sortieren",
  "Mischen",
  "nach oben",
  "nach unten",
  "Auftrag",
  "KI-Antwort",
  "Fehlertyp für",
  "Zurücksetzen",
  "Auswerten",
  "Bestanden",
  "Daneben",
  "Eval-Drill",
  "Datenschutz-Drill",
  "Szenario",
  "REDIGIERT",
  "Riskant",
  "riskant",
  "redigiert",
  "bereinigt",
  "erfasst",
  "Einfügen prüfen",
  "Sauber",
  "Leck",
  "sensiblen Stellen",
  "abschicken",
  "wählen",
  "Reihenfolge prüfen",
];

const COMPONENT_BY_KIND = {
  quiz: QuizWidget,
  "drag-reorder": DragReorderWidget,
  "failure-tagger": FailureTaggerWidget,
  "redaction-drill": RedactionDrillWidget,
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
  __resetClaudeLessonCacheForTests();
});

afterEach(() => {
  cleanup();
});

describe("claude-course reused Tier-A widgets render zero German-only chrome (plan 008 stage 3)", () => {
  it("every quiz/drag-reorder/failure-tagger/redaction-drill instance across all 12 lessons opts into English copy", async () => {
    const lessons = await getAllClaudeLessons();
    let checkedCount = 0;

    for (const lesson of lessons) {
      for (const widget of lesson.widgets ?? []) {
        if (!CHECKED_KINDS.includes(widget.kind)) continue;
        checkedCount += 1;

        const props = widget.props as Record<string, unknown>;
        expect(props.copy, `${lesson.id}/${widget.kind}`).toBeDefined();
        // `title` is a SEPARATE per-instance prop, not part of `copy` (see
        // widget-copy.ts's CLAUDE_QUIZ_TITLE comment): each of these 4
        // components defaults it to a hardcoded German literal independently
        // of the copy object, so a widget instance can pass an English
        // `copy` and still render a German title. Every claude instance must
        // set it explicitly.
        expect(
          typeof props.title === "string" && props.title.length > 0,
          `${lesson.id}/${widget.kind} is missing an explicit English \`title\` prop`,
        ).toBe(true);

        const Component =
          COMPONENT_BY_KIND[widget.kind as keyof typeof COMPONENT_BY_KIND];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { container, unmount } = render(<Component {...(props as any)} />);

        for (const marker of GERMAN_ONLY_MARKERS) {
          expect(
            container.innerHTML.includes(marker),
            `${lesson.id}/${widget.kind} leaked German chrome string "${marker}"`,
          ).toBe(false);
        }
        unmount();
      }
    }

    // Sanity: confirms the loop above actually exercised widgets, not a
    // silently-empty pass (19 quiz + 1 drag-reorder + 1 failure-tagger + 1
    // redaction-drill = 22, once every lesson wires its full manifest).
    expect(checkedCount).toBeGreaterThan(0);
  });
});
