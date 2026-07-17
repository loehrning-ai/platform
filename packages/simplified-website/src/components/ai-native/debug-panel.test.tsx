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
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";

/**
 * debug-panel.test.tsx (regression coverage)
 *
 * Drives the REAL <AiNativeDebugPanel />, the dev-only cmd+shift+D overlay. The
 * only mock is `getRecentEvents` (so the ring-buffer slice/reverse/count logic
 * is exercised on deterministic input); everything else is the component's real
 * behavior against real browser state (globalThis.__aiNativeWidgets, the
 * documentElement dataset, localStorage).
 *
 * What is exercised for real:
 *   - the hard NODE_ENV === "development" gate (null render + dead shortcut in
 *     production);
 *   - the metaKey+shiftKey+"d" toggle (and that other keys are ignored);
 *   - the reveal-index read (null vs the parsed dataset number, incl. "0");
 *   - the active-widgets list (count + `kind @ placement (lessonId?)` mapping);
 *   - the recent-events panel (count + last-10-reversed names);
 *   - the localStorage progress dump ("(empty)" vs the raw payload).
 */

vi.mock("@/lib/ai-native/analytics", () => ({
  getRecentEvents: vi.fn(() => []),
}));

import { AiNativeDebugPanel } from "./debug-panel";
import { getRecentEvents } from "@/lib/ai-native/analytics";
import { UNIFIED_STORAGE_KEY } from "@/lib/progress/types";

const mockedGetRecentEvents = vi.mocked(getRecentEvents);

function pressToggleShortcut(): void {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "D",
        metaKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      }),
    );
  });
}

function fabricateEvents(count: number): any[] {
  return Array.from({ length: count }, (_, i) => ({
    at: i,
    event: { name: `ev-${i}`, props: {} },
  }));
}

/**
 * Some vitest/jsdom combos expose a no-op localStorage; the progress-dump panel
 * needs a real one. Mirror the polyfill the green progress tests install.
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

beforeAll(() => {
  if (
    typeof window.localStorage === "undefined" ||
    typeof window.localStorage.setItem !== "function"
  ) {
    installLocalStoragePolyfill();
  }
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  mockedGetRecentEvents.mockReset();
  mockedGetRecentEvents.mockReturnValue([]);
  delete (globalThis as any).__aiNativeWidgets;
  delete (document.documentElement as any).dataset.revealIndex;
  window.localStorage.clear();
});

describe("<AiNativeDebugPanel> non-development gate", () => {
  // Vitest's ambient NODE_ENV is "test" (never "development"), which is exactly
  // the non-dev case the panel must stay hidden for, so no stubbing is needed.
  it("renders nothing and the shortcut is dead outside development", () => {
    const { container } = render(<AiNativeDebugPanel />);
    expect(container.firstChild).toBeNull();

    // No keydown listener is attached in production, so the toggle stays a no-op.
    pressToggleShortcut();
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("<AiNativeDebugPanel> open / close (development)", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  it("stays closed until the cmd+shift+D shortcut opens it", () => {
    render(<AiNativeDebugPanel />);
    expect(screen.queryByRole("dialog")).toBeNull();

    pressToggleShortcut();

    const dialog = screen.getByRole("dialog", { name: "AI-Native debug panel" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("AI-NATIVE DEBUG");
  });

  it("ignores keydowns that are not the exact chord", () => {
    render(<AiNativeDebugPanel />);

    act(() => {
      // wrong key
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "x", metaKey: true, shiftKey: true }),
      );
      // right key, missing modifiers
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "D" }));
    });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes again via the close button", () => {
    render(<AiNativeDebugPanel />);
    pressToggleShortcut();
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Schließen" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("<AiNativeDebugPanel> panel content (development)", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  function labelValue(label: string): Element | null {
    return screen.getByText(label).nextElementSibling;
  }

  it("renders the empty-state placeholders when there is no data", () => {
    render(<AiNativeDebugPanel />);
    pressToggleShortcut();

    expect(labelValue("Reveal Index")).toHaveTextContent("(not set)");
    expect(screen.getByText("Active Widgets (0)")).toBeInTheDocument();
    expect(screen.getByText("(none)")).toBeInTheDocument();
    expect(screen.getByText("Recent Events (0)")).toBeInTheDocument();
    expect(screen.getByText("(no events)")).toBeInTheDocument();
    // The progress <pre> falls back to "(empty)" when localStorage has no entry.
    expect(labelValue("Progress (localStorage)")).toHaveTextContent("(empty)");
  });

  it("parses the reveal index from the documentElement dataset (incl. 0)", () => {
    document.documentElement.dataset.revealIndex = "3";
    render(<AiNativeDebugPanel />);
    pressToggleShortcut();
    expect(labelValue("Reveal Index")).toHaveTextContent("3");

    // "0" is a truthy string, so it renders 0 rather than "(not set)".
    document.documentElement.dataset.revealIndex = "0";
    // toggle closed + open again so the open-effect's refresh() re-reads it.
    pressToggleShortcut();
    pressToggleShortcut();
    expect(labelValue("Reveal Index")).toHaveTextContent("0");
  });

  it("lists active widgets with the kind @ placement (lessonId) mapping", () => {
    (globalThis as any).__aiNativeWidgets = [
      { kind: "demo-roi", placement: "end", lessonId: "modul_2_lesson_3" },
      { kind: "quiz", placement: "inline" },
    ];

    render(<AiNativeDebugPanel />);
    pressToggleShortcut();

    expect(screen.getByText("Active Widgets (2)")).toBeInTheDocument();
    // lessonId present -> suffix in parens.
    expect(
      screen.getByText("demo-roi @ end (modul_2_lesson_3)"),
    ).toBeInTheDocument();
    // lessonId absent -> no suffix.
    expect(screen.getByText("quiz @ inline")).toBeInTheDocument();
  });

  it("shows the last 10 recent events in reverse order with a total count", () => {
    // 12 events -> slice(-10) keeps ev-2..ev-11, reversed newest-first.
    mockedGetRecentEvents.mockReturnValue(fabricateEvents(12) as any);

    render(<AiNativeDebugPanel />);
    pressToggleShortcut();

    expect(screen.getByText("Recent Events (12)")).toBeInTheDocument();

    const shown = screen
      .getAllByText(/^ev-\d+$/)
      .map((el) => el.textContent);
    expect(shown).toHaveLength(10);
    expect(shown[0]).toBe("ev-11"); // newest first
    expect(shown[shown.length - 1]).toBe("ev-2"); // oldest kept
    // The two oldest events (ev-0, ev-1) are dropped by slice(-10).
    expect(screen.queryByText("ev-0")).toBeNull();
    expect(screen.queryByText("ev-1")).toBeNull();
  });

  it("dumps the raw localStorage progress payload", () => {
    window.localStorage.setItem(UNIFIED_STORAGE_KEY, '{"schemaVersion":3}');

    render(<AiNativeDebugPanel />);
    pressToggleShortcut();

    expect(labelValue("Progress (localStorage)")).toHaveTextContent(
      '{"schemaVersion":3}',
    );
  });
});
