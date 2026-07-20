import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  DEMO_HEIGHT,
  usePhasedLoop,
  usePrefersReducedMotion,
  useVisibleAutoplay,
} from "./demo-utils";

/**
 * demo-utils.test.ts (regression coverage)
 *
 * Unit coverage for the shared demo hooks every synthetic sandbox reader
 * depends on: reduced-motion detection, the visibility/in-view autoplay gate,
 * and the phased animation loop. These are pure hooks driven directly with
 * renderHook (no demo component rendered), so they stay green regardless of the
 * demo content.
 *
 * matchMedia + IntersectionObserver are polyfilled in src/test/setup.ts;
 * individual tests override matchMedia / document.visibilityState to drive the
 * branch under test.
 */

/** Override matchMedia so `(prefers-reduced-motion: reduce)` reports `reduced`. */
function setReducedMotion(reduced: boolean): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

/** Flip document.visibilityState and fire the visibilitychange event. */
function setVisibility(state: "visible" | "hidden"): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("usePrefersReducedMotion", () => {
  afterEach(() => {
    setReducedMotion(false);
  });

  it("defaults to false when the OS does not request reduced motion", () => {
    setReducedMotion(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("reports true when the OS requests reduced motion", () => {
    setReducedMotion(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });
});

describe("useVisibleAutoplay", () => {
  afterEach(() => {
    setVisibility("visible");
  });

  it("returns a ref and becomes visible when the tab is shown", () => {
    const { result } = renderHook(() => useVisibleAutoplay());
    expect(result.current.ref).toHaveProperty("current");
    // With no element attached, the IO fallback marks it in-view; the tab is
    // visible, so the demo is allowed to autoplay.
    expect(result.current.visible).toBe(true);
  });

  it("pauses (visible=false) while the tab is hidden and resumes when shown", () => {
    const { result } = renderHook(() => useVisibleAutoplay());
    expect(result.current.visible).toBe(true);

    act(() => {
      setVisibility("hidden");
    });
    expect(result.current.visible).toBe(false);

    act(() => {
      setVisibility("visible");
    });
    expect(result.current.visible).toBe(true);
  });
});

describe("usePhasedLoop", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const phases = [{ duration: 100 }, { duration: 100 }, { duration: 100 }];

  it("starts on phase 0 and advances through phases on each tick, wrapping around", () => {
    const { result } = renderHook(() => usePhasedLoop(phases, true, false));
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(1);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(2);

    // Wraps back to 0 (modulo phases.length).
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(0);
  });

  it("holds on phase 0 when reduced motion is requested", () => {
    const { result } = renderHook(() => usePhasedLoop(phases, true, true));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(0);
  });

  it("holds on phase 0 when disabled", () => {
    const { result } = renderHook(() => usePhasedLoop(phases, false, false));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(0);
  });

  it("holds on phase 0 when there are no phases", () => {
    const { result } = renderHook(() => usePhasedLoop([], true, false));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe(0);
  });
});

describe("DEMO_HEIGHT", () => {
  it("exposes the shared demo canvas height", () => {
    expect(DEMO_HEIGHT).toBe(620);
  });
});
