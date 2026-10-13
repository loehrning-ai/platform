import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COUNT_UP_DURATION_MS, CountUp } from "./count-up";

type Entry = {
  isIntersecting: boolean;
  boundingClientRect: { top: number; height: number };
  rootBounds: { height: number } | null;
};
type ObserverCallback = (entries: Entry[]) => void;

const VIEWPORT = 800;

let observers: Array<{ callback: ObserverCallback; disconnected: boolean }>;
let frames: Array<(now: number) => void>;
let reducedMotion: boolean;

/** The observer's report for a count whose top sits at `top`. */
function report(top: number, height = 30, isIntersecting = false) {
  act(() =>
    observers[0]!.callback([
      {
        isIntersecting,
        boundingClientRect: { top, height },
        rootBounds: { height: VIEWPORT },
      },
    ]),
  );
}

function digits(): HTMLElement {
  const node = document.querySelector<HTMLElement>("[data-count-up]");
  if (!node) throw new Error("no count-up digits");
  return node;
}

function runFrames(now: number) {
  const pending = frames;
  frames = [];
  for (const frame of pending) frame(now);
}

beforeEach(() => {
  observers = [];
  frames = [];
  reducedMotion = false;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      callback: ObserverCallback;
      disconnected = false;
      constructor(callback: ObserverCallback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {}
      disconnect() {
        this.disconnected = true;
      }
    },
  );
  vi.stubGlobal("requestAnimationFrame", (frame: (now: number) => void) => {
    frames.push(frame);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("reduce") ? reducedMotion : false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
  vi.spyOn(performance, "now").mockReturnValue(0);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CountUp", () => {
  it("serves the final value and reads the phrase once to assistive tech", () => {
    const html = renderToString(<CountUp value={57} text="57 Lektionen" />);
    expect(html).toMatch(/data-count-up="57"[^>]*>57</);

    render(<CountUp value={57} text="57 Lektionen" />);
    expect(screen.getByText("57 Lektionen")).toHaveClass("sr-only");
    expect(digits().parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("never reads layout while the page hydrates", () => {
    const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");
    render(<CountUp value={57} text="57 Lektionen" />);
    report(5000);
    expect(rect).not.toHaveBeenCalled();
  });

  it("keeps the final value when the count is already on screen", () => {
    render(<CountUp value={57} text="57 Lektionen" />);
    expect(observers).toHaveLength(1);
    // Partly in view counts as on screen, as does scrolled past.
    report(VIEWPORT - 10);
    expect(observers[0]!.disconnected).toBe(true);
    expect(digits().textContent).toBe("57");
    expect(frames).toHaveLength(0);
  });

  it("keeps the final value when the count is scrolled past or not laid out", () => {
    const first = render(<CountUp value={57} text="57 Lektionen" />);
    report(-400);
    expect(observers[0]!.disconnected).toBe(true);
    first.unmount();

    observers = [];
    render(<CountUp value={57} text="57 Lektionen" />);
    report(5000, 0);
    expect(observers[0]!.disconnected).toBe(true);
    expect(digits().textContent).toBe("57");
  });

  it("keeps the final value under reduced motion", () => {
    reducedMotion = true;
    render(<CountUp value={57} text="57 Lektionen" />);
    expect(digits().textContent).toBe("57");
    expect(observers).toHaveLength(0);
  });

  it("counts up once, eased, when a below-fold count scrolls into view", () => {
    render(<CountUp value={57} text="57 Lektionen" />);
    report(5000);
    // Off screen the final count stays: a jump past it never shows a zero.
    expect(digits().textContent).toBe("57");
    expect(observers[0]!.disconnected).toBe(false);

    report(400, 30, true);
    expect(observers[0]!.disconnected).toBe(true);
    expect(digits().textContent).toBe("0");
    runFrames(COUNT_UP_DURATION_MS / 2);
    const midway = Number(digits().textContent);
    expect(midway).toBeGreaterThan(28);
    expect(midway).toBeLessThan(57);

    runFrames(COUNT_UP_DURATION_MS);
    expect(digits().textContent).toBe("57");
    expect(frames).toHaveLength(0);
  });

  it("restores the final value on unmount mid-count", () => {
    const { unmount } = render(<CountUp value={12} text="12 lessons" />);
    const node = digits();
    report(5000);
    report(400, 30, true);
    runFrames(COUNT_UP_DURATION_MS / 3);
    expect(Number(node.textContent)).toBeLessThan(12);
    unmount();
    expect(node.textContent).toBe("12");
  });

  it("prints the phrase as is when the value is not in it", () => {
    render(<CountUp value={3} text="drei Kurse" />);
    expect(screen.getByText("drei Kurse")).not.toHaveClass("sr-only");
    expect(document.querySelector("[data-count-up]")).toBeNull();
  });
});
