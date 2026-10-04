import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { COUNT_UP_DURATION_MS, CountUp } from "./count-up";

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

let observers: Array<{ callback: ObserverCallback; disconnect: () => void }>;
let frames: Array<(now: number) => void>;
let reducedMotion: boolean;

function setTop(top: number, height = 30) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top,
    height,
    bottom: top + height,
    left: 0,
    right: 100,
    width: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);
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
      constructor(callback: ObserverCallback) {
        this.callback = callback;
        observers.push(this);
      }
      observe() {}
      disconnect() {}
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

    setTop(0);
    render(<CountUp value={57} text="57 Lektionen" />);
    expect(screen.getByText("57 Lektionen")).toHaveClass("sr-only");
    expect(digits().parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the final value when the count is already on screen", () => {
    setTop(100);
    render(<CountUp value={57} text="57 Lektionen" />);
    expect(digits().textContent).toBe("57");
    expect(observers).toHaveLength(0);
  });

  it("keeps the final value under reduced motion", () => {
    reducedMotion = true;
    setTop(5000);
    render(<CountUp value={57} text="57 Lektionen" />);
    expect(digits().textContent).toBe("57");
    expect(observers).toHaveLength(0);
  });

  it("counts up once, eased, when a below-fold count scrolls into view", () => {
    setTop(5000);
    render(<CountUp value={57} text="57 Lektionen" />);
    expect(digits().textContent).toBe("0");
    expect(observers).toHaveLength(1);

    act(() => observers[0]!.callback([{ isIntersecting: true }]));
    runFrames(COUNT_UP_DURATION_MS / 2);
    const midway = Number(digits().textContent);
    expect(midway).toBeGreaterThan(28);
    expect(midway).toBeLessThan(57);

    runFrames(COUNT_UP_DURATION_MS);
    expect(digits().textContent).toBe("57");
    expect(frames).toHaveLength(0);
  });

  it("restores the final value on unmount mid-count", () => {
    setTop(5000);
    const { unmount } = render(<CountUp value={12} text="12 lessons" />);
    const node = digits();
    expect(node.textContent).toBe("0");
    unmount();
    expect(node.textContent).toBe("12");
  });

  it("prints the phrase as is when the value is not in it", () => {
    render(<CountUp value={3} text="drei Kurse" />);
    expect(screen.getByText("drei Kurse")).not.toHaveClass("sr-only");
    expect(document.querySelector("[data-count-up]")).toBeNull();
  });
});
