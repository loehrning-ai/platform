/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

/**
 * continue-banner.test.tsx (regression coverage)
 *
 * Drives the REAL <AiNativeContinueBanner /> against the REAL unified progress
 * store (localStorage-backed, works in jsdom) and the REAL modules.json index.
 * We only mock framer-motion (m.* -> plain elements) and next/link so the
 * assertions depend solely on the banner's own logic:
 *
 *   - the private computeContinueState(): pick the FIRST module that has some
 *     completed lessons but is not finished (module-id prefix match against the
 *     completed-lesson ids + the module's lessonCount);
 *   - the percentage = round(completed / total * 100);
 *   - the hydration/dismiss guards (renders nothing until mounted, hides on the
 *     sessionStorage dismiss flag, hides + persists the flag on the close click).
 *
 * The banner counts a module's progress by the `${moduleId}_lesson` id prefix
 * and reads the lessonCount from modules.json, so the exact lesson-id suffixes
 * we seed are arbitrary; only the module prefix + count matter.
 */

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    __esModule: true,
    default: ({ href, children, ...rest }: any) =>
      React.createElement(
        "a",
        { href: typeof href === "string" ? href : "#", ...rest },
        children,
      ),
  };
});

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
      get: (_t, prop) => {
        if (prop === "create") {
          return (tag: unknown) =>
            make(typeof tag === "string" ? tag : "div");
        }
        return typeof prop === "string" ? make(prop) : undefined;
      },
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

import { AiNativeContinueBanner } from "./continue-banner";
import {
  markLessonCompleted,
  __resetCacheForTests,
} from "@/lib/ai-native/progress";

const DISMISS_KEY = "ai-native-continue-dismissed";
const BANNER_LABEL = "Zurück zum letzten Kursschritt";

/**
 * Some vitest/jsdom combos expose a no-op Web Storage; the store facade + the
 * banner's dismiss flag both need a real one. Mirror the in-memory polyfill the
 * green progress tests install (src/lib/ai-native/progress.test.ts).
 */
function installStoragePolyfill(name: "localStorage" | "sessionStorage"): void {
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
  Object.defineProperty(globalThis, name, {
    value: polyfill,
    writable: true,
    configurable: true,
  });
}

function resetProgressStore(): void {
  window.localStorage.clear();
  sessionStorage.clear();
  __resetCacheForTests();
}

beforeAll(() => {
  for (const name of ["localStorage", "sessionStorage"] as const) {
    const s = (globalThis as unknown as Record<string, Storage | undefined>)[
      name
    ];
    if (typeof s === "undefined" || typeof s.setItem !== "function") {
      installStoragePolyfill(name);
    }
  }
});

beforeEach(() => {
  resetProgressStore();
});

afterEach(() => {
  cleanup();
  resetProgressStore();
});

describe("<AiNativeContinueBanner> visibility guards", () => {
  it("renders nothing when no lesson has been completed", () => {
    const { container } = render(<AiNativeContinueBanner />);
    // computeContinueState returns null on an empty completed-set.
    expect(screen.queryByLabelText(BANNER_LABEL)).toBeNull();
    expect(container.textContent).not.toContain("Fortsetzen");
  });

  it("stays hidden when the session dismiss flag is already set", () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    markLessonCompleted("modul_1_lesson_1");
    render(<AiNativeContinueBanner />);
    expect(screen.queryByLabelText(BANNER_LABEL)).toBeNull();
  });
});

describe("<AiNativeContinueBanner> resume state (real store + modules.json)", () => {
  it("surfaces the partially-completed module with an exact fraction + percent", async () => {
    // modul_1 has 5 lessons in modules.json; complete 2 of them.
    markLessonCompleted("modul_1_lesson_1");
    markLessonCompleted("modul_1_lesson_2");

    render(<AiNativeContinueBanner />);

    const banner = await screen.findByLabelText(BANNER_LABEL);
    expect(banner).toHaveTextContent("Modul 1:");
    expect(banner).toHaveTextContent(/2 \/ 5 Lektionen/);
    // 2 / 5 = 40% exactly.
    expect(banner).toHaveTextContent("40%");

    const cta = screen.getByRole("link", { name: /Weiterlernen/ });
    expect(cta).toHaveAttribute("href", "/ai-native/kurs/modul_1");
  });

  it("skips a fully-completed module and rounds the next module's percent", async () => {
    // Finish all 5 of modul_1 (should be skipped: completed === total)...
    for (let i = 1; i <= 5; i += 1) markLessonCompleted(`modul_1_lesson_${i}`);
    // ...and complete 2 of modul_2 (7 lessons) -> 2/7 = 28.57 -> rounds to 29.
    markLessonCompleted("modul_2_lesson_1");
    markLessonCompleted("modul_2_lesson_2");

    render(<AiNativeContinueBanner />);

    const banner = await screen.findByLabelText(BANNER_LABEL);
    expect(banner).toHaveTextContent("Modul 2:");
    expect(banner).toHaveTextContent(/2 \/ 7 Lektionen/);
    expect(banner).toHaveTextContent("29%");
    expect(banner).not.toHaveTextContent("Modul 1:");

    expect(screen.getByRole("link", { name: /Weiterlernen/ })).toHaveAttribute(
      "href",
      "/ai-native/kurs/modul_2",
    );
  });
});

describe("<AiNativeContinueBanner> dismiss action", () => {
  it("hides the banner and persists the dismiss flag on the close click", async () => {
    markLessonCompleted("modul_1_lesson_1");
    render(<AiNativeContinueBanner />);

    await screen.findByLabelText(BANNER_LABEL);
    fireEvent.click(screen.getByRole("button", { name: "Banner schließen" }));

    expect(screen.queryByLabelText(BANNER_LABEL)).toBeNull();
    expect(sessionStorage.getItem(DISMISS_KEY)).toBe("1");
  });
});
