/**
 * engagement-tracker.test.tsx (regression coverage)
 *
 * EngagementTracker is a silent probe: it accrues one second per interval tick
 * only while the demo is BOTH in the viewport (IntersectionObserver) AND the tab
 * is visible, and fires trackDemoEngagedSeconds at 10 / 20 / 30 / 60s, once each.
 *
 * Rather than lean on fake timers (whose patching of window.setInterval in jsdom
 * is not guaranteed), we spy on window.setInterval to CAPTURE the component's
 * real `tick` closure and invoke it one call == one second. That drives the real
 * counter + threshold + visibility/tab gating deterministically. A controllable
 * IntersectionObserver lets a test flip visibility, and document.visibilityState
 * is toggled directly. The analytics dispatcher is the only stub (a spy).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { EngagementTracker } from "./engagement-tracker";
import { trackDemoEngagedSeconds } from "@/lib/analytics";

vi.mock("@/lib/analytics", () => ({
  trackDemoEngagedSeconds: vi.fn(),
}));

const mockedTrack = vi.mocked(trackDemoEngagedSeconds);

/* Controllable IntersectionObserver - captures the component's callback so a
   test can push isIntersecting transitions, and counts observe/disconnect. */
let ioCallback: IntersectionObserverCallback | null = null;
let observeCount = 0;
let disconnectCount = 0;

class TestIntersectionObserver {
  root = null;
  rootMargin = "";
  thresholds: readonly number[] = [];
  constructor(cb: IntersectionObserverCallback) {
    ioCallback = cb;
  }
  observe() {
    observeCount += 1;
  }
  unobserve() {}
  disconnect() {
    disconnectCount += 1;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

const OriginalIO = globalThis.IntersectionObserver;

/* Captured interval "tick" - invoking it N times == advancing N seconds. */
let tickFn: (() => void) | null = null;
let clearedIntervals: number[] = [];

function setIntersecting(value: boolean): void {
  ioCallback?.(
    [{ isIntersecting: value } as unknown as IntersectionObserverEntry],
    {} as IntersectionObserver,
  );
}

function setTabVisibility(state: "visible" | "hidden"): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function advanceSeconds(n: number): void {
  for (let i = 0; i < n; i += 1) tickFn?.();
}

describe("<EngagementTracker>", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ioCallback = null;
    tickFn = null;
    observeCount = 0;
    disconnectCount = 0;
    clearedIntervals = [];

    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      TestIntersectionObserver as unknown as typeof IntersectionObserver;

    let nextId = 1;
    vi.spyOn(window, "setInterval").mockImplementation(((handler: TimerHandler) => {
      tickFn = handler as () => void;
      return nextId++;
    }) as unknown as typeof window.setInterval);
    vi.spyOn(window, "clearInterval").mockImplementation(((id?: number) => {
      if (typeof id === "number") clearedIntervals.push(id);
    }) as unknown as typeof window.clearInterval);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      OriginalIO;
    setTabVisibility("visible");
  });

  it("renders a silent, aria-hidden zero-size probe and observes it on mount", () => {
    const { container } = render(<EngagementTracker slug="excel" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el.textContent).toBe("");
    expect(observeCount).toBe(1);
  });

  it("fires the 10s threshold once the demo has been continuously visible", () => {
    render(<EngagementTracker slug="excel" />);
    setIntersecting(true);
    advanceSeconds(10);
    expect(mockedTrack).toHaveBeenCalledTimes(1);
    expect(mockedTrack).toHaveBeenCalledWith("excel", 10);
  });

  it("fires every threshold in order across 60s of continuous visibility", () => {
    render(<EngagementTracker slug="word" />);
    setIntersecting(true);
    advanceSeconds(60);
    // 40s and 50s are NOT thresholds, so they never fire.
    expect(mockedTrack.mock.calls).toEqual([
      ["word", 10],
      ["word", 20],
      ["word", 30],
      ["word", 60],
    ]);
  });

  it("does not accrue time while the demo is outside the viewport", () => {
    render(<EngagementTracker slug="excel" />);
    // Never signalled as intersecting -> counter stays at zero.
    advanceSeconds(60);
    expect(mockedTrack).not.toHaveBeenCalled();
  });

  it("pauses the counter when the demo scrolls away and resumes when it returns", () => {
    render(<EngagementTracker slug="excel" />);
    setIntersecting(true);
    advanceSeconds(10); // reaches 10s -> fires 10
    expect(mockedTrack).toHaveBeenCalledTimes(1);

    setIntersecting(false);
    advanceSeconds(30); // frozen at 10s -> nothing new
    expect(mockedTrack).toHaveBeenCalledTimes(1);

    setIntersecting(true);
    advanceSeconds(10); // 11..20 -> fires 20
    expect(mockedTrack).toHaveBeenCalledTimes(2);
    expect(mockedTrack).toHaveBeenLastCalledWith("excel", 20);
  });

  it("does not accrue time while the browser tab is hidden", () => {
    render(<EngagementTracker slug="excel" />);
    setIntersecting(true);
    setTabVisibility("hidden");
    advanceSeconds(30);
    expect(mockedTrack).not.toHaveBeenCalled();

    setTabVisibility("visible");
    advanceSeconds(10);
    expect(mockedTrack).toHaveBeenCalledWith("excel", 10);
  });

  it("tears down the observer and the interval on unmount", () => {
    const { unmount } = render(<EngagementTracker slug="excel" />);
    setIntersecting(true);
    advanceSeconds(5); // below the first threshold -> nothing fired yet
    expect(mockedTrack).not.toHaveBeenCalled();

    unmount();
    // Cleanup disconnects the observer and clears the interval id it created.
    expect(disconnectCount).toBe(1);
    expect(clearedIntervals).toContain(1);
  });
});
