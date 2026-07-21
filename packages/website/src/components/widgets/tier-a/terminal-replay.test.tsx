import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { __resetCacheForTests, getXp, isCheckpointDone } from "@/lib/progress";
import { XP } from "@/lib/progress/types";
import { TerminalReplayWidget, type TerminalReplayFrame } from "./terminal-replay";

/**
 * framer-motion's `useReducedMotion` lazily initializes a MODULE-LEVEL
 * singleton the first time it is called anywhere in the process (see
 * `motion-dom`'s `initPrefersReducedMotion`), so mocking `window.matchMedia`
 * per-test (the pattern used by the other tier-a widget tests, which never
 * assert behavior that actually depends on the flip) is unreliable once more
 * than one test in a file needs a real "true" vs "false" difference. This
 * test genuinely branches behavior on reduced motion (sync vs. timer-driven
 * completion), so it mocks the hook directly via a controllable box instead.
 */
const reducedMotionState = vi.hoisted(() => ({ value: false }));

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => reducedMotionState.value,
  };
});

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

function setReducedMotion(reduced: boolean): void {
  reducedMotionState.value = reduced;
}

const FRAMES: readonly TerminalReplayFrame[] = [
  {
    segments: [{ text: "$ git clone repo", tone: "prompt" }],
    delayMs: 20,
  },
  {
    segments: [{ text: "→ sandbox ready", tone: "comment" }],
    delayMs: 20,
  },
];

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
  setReducedMotion(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TerminalReplayWidget", () => {
  it("renders idle state with the placeholder text", () => {
    render(
      <TerminalReplayWidget lessonId="l1" cpId="term1" title="Session replay" frames={FRAMES} />,
    );
    expect(
      screen.getByText(/press "Run replay" to watch this session play out/),
    ).toBeInTheDocument();
  });

  it("renders with reduced motion and completes the whole replay instantly on Run, awarding the checkpoint", () => {
    setReducedMotion(true);
    render(
      <TerminalReplayWidget lessonId="l1" cpId="term1" title="Session replay" frames={FRAMES} />,
    );
    fireEvent.click(screen.getByText("▶ Run replay"));
    // No fake timers used at all: reduced motion must never schedule one.
    expect(screen.getByText("$ git clone repo")).toBeInTheDocument();
    expect(screen.getByText("→ sandbox ready")).toBeInTheDocument();
    expect(isCheckpointDone("l1", "term1")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("types through every frame and awards the checkpoint once the full replay completes", async () => {
    vi.useFakeTimers();
    render(
      <TerminalReplayWidget lessonId="l1" cpId="term1" title="Session replay" frames={FRAMES} />,
    );
    fireEvent.click(screen.getByText("▶ Run replay"));
    expect(isCheckpointDone("l1", "term1")).toBe(false);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText("$ git clone repo")).toBeInTheDocument();
    expect(screen.getByText("→ sandbox ready")).toBeInTheDocument();
    expect(isCheckpointDone("l1", "term1")).toBe(true);
    expect(getXp()).toBe(XP.CHECKPOINT);
  });

  it("Reset invalidates an in-flight replay and returns to idle", async () => {
    vi.useFakeTimers();
    render(
      <TerminalReplayWidget lessonId="l1" cpId="term1" title="Session replay" frames={FRAMES} />,
    );
    fireEvent.click(screen.getByText("▶ Run replay"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5);
    });
    fireEvent.click(screen.getByText("↺ Reset"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(isCheckpointDone("l1", "term1")).toBe(false);
    expect(
      screen.getByText(/press "Run replay" to watch this session play out/),
    ).toBeInTheDocument();
  });

  it("unmounting mid-replay clears the pending timer instead of leaking it", async () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(global, "clearTimeout");
    const { unmount } = render(
      <TerminalReplayWidget lessonId="l1" cpId="term1" title="Session replay" frames={FRAMES} />,
    );
    fireEvent.click(screen.getByText("▶ Run replay"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5);
    });

    unmount();
    expect(clearSpy).toHaveBeenCalled();

    // Flushing every remaining fake timer after unmount must not throw and
    // must not resurrect the checkpoint (the run was interrupted).
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(isCheckpointDone("l1", "term1")).toBe(false);
    clearSpy.mockRestore();
  });
});
