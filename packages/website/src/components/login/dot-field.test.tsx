import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DotField } from "./dot-field";
import { DOT_FIELD_FRAME_MS } from "./dot-field-shapes";

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;

function flushFrame(now: number) {
  const pending = [...frames.entries()];
  frames.clear();
  for (const [, callback] of pending) callback(now);
}

function stubReducedMotion(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (media: string) =>
      ({
        matches,
        media,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

let clearRect: ReturnType<typeof vi.fn>;
let arc: ReturnType<typeof vi.fn>;

beforeEach(() => {
  frames = new Map();
  nextFrame = 1;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    frames.delete(id);
  });
  clearRect = vi.fn();
  arc = vi.fn();
  const context = new Proxy(
    { clearRect, arc } as Record<string, unknown>,
    {
      get(target, prop: string) {
        if (prop in target) return target[prop];
        return () => {};
      },
      set(target, prop: string, value) {
        target[prop] = value;
        return true;
      },
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
});

afterEach(() => {
  cleanup();
  setVisibility("visible");
  vi.restoreAllMocks();
});

describe("DotField", () => {
  it("renders one decorative canvas and draws at about 30fps", () => {
    stubReducedMotion(false);
    const { container } = render(<DotField paused={false} />);

    const canvas = container.querySelector("canvas");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas?.className).toBe("login-dot-field");

    const drawnAtMount = clearRect.mock.calls.length;
    // The first frame is painted at mount, so a paused scene is never blank.
    expect(arc).toHaveBeenCalled();
    expect(frames.size).toBe(1);
    act(() => flushFrame(DOT_FIELD_FRAME_MS));
    expect(clearRect.mock.calls.length).toBe(drawnAtMount + 1);
    // A frame that arrives too early (a 120Hz display) is skipped.
    act(() => flushFrame(DOT_FIELD_FRAME_MS + 8));
    expect(clearRect.mock.calls.length).toBe(drawnAtMount + 1);
    act(() => flushFrame(DOT_FIELD_FRAME_MS * 2 + 1));
    expect(clearRect.mock.calls.length).toBe(drawnAtMount + 2);
  });

  it("stops scheduling while paused and resumes on play", () => {
    stubReducedMotion(false);
    const { rerender } = render(<DotField paused={false} />);
    expect(frames.size).toBe(1);

    rerender(<DotField paused />);
    expect(frames.size).toBe(0);

    rerender(<DotField paused={false} />);
    expect(frames.size).toBe(1);
  });

  it("pauses while the document is hidden", () => {
    stubReducedMotion(false);
    render(<DotField paused={false} />);
    expect(frames.size).toBe(1);

    act(() => setVisibility("hidden"));
    expect(frames.size).toBe(0);

    act(() => setVisibility("visible"));
    expect(frames.size).toBe(1);
  });

  it("draws nothing and schedules nothing under reduced motion", () => {
    stubReducedMotion(true);
    render(<DotField paused={false} />);

    expect(frames.size).toBe(0);
    // It may clear the canvas, but it never paints a single dot.
    expect(arc).not.toHaveBeenCalled();
  });
});
