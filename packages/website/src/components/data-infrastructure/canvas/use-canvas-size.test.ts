import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { createRef } from "react";
import { useCanvasAutoSize } from "./use-canvas-size";

/**
 * Regression test for a real bug found during plan 010 stage 14's live QA
 * pass: every canvas widget on every lesson rendered completely blank on
 * first load. Root cause: ResizeObserver fires an "initial" callback
 * asynchronously right after `.observe()`, even when nothing changed since
 * the synchronous `resize()` call that already ran. Reassigning
 * `canvas.width`/`canvas.height` unconditionally clears the canvas bitmap
 * per the HTML spec — even when set to the exact same value — so that
 * redundant callback silently wiped out the very first real draw before any
 * "settled" widget (draw() returning false, i.e. every canvas widget with no
 * animation in flight) ever got a reason to schedule another frame and
 * redraw. jsdom has no native ResizeObserver, so this path was never
 * exercised by any other test in this course's suite — a mock is installed
 * here specifically to exercise it.
 */

type ResizeCallback = () => void;

function installMockResizeObserver(): { fireAll: () => void; observeCount: () => number } {
  const callbacks: ResizeCallback[] = [];
  class MockResizeObserver {
    private readonly cb: ResizeCallback;
    constructor(cb: ResizeCallback) {
      this.cb = cb;
    }
    observe(): void {
      callbacks.push(this.cb);
    }
    unobserve(): void {}
    disconnect(): void {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = MockResizeObserver;
  return {
    fireAll: () => callbacks.forEach((cb) => cb()),
    observeCount: () => callbacks.length,
  };
}

afterEach(() => {
  cleanup();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).ResizeObserver;
});

describe("useCanvasAutoSize (plan 010 stage 14 regression)", () => {
  it("does not reassign canvas.width/height (and does not re-clear the canvas) when a ResizeObserver callback fires with an unchanged size", () => {
    const ro = installMockResizeObserver();
    const canvas = document.createElement("canvas");
    const wrap = document.createElement("div");
    wrap.appendChild(canvas);
    document.body.appendChild(wrap);
    vi.spyOn(wrap, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const canvasRef = createRef<HTMLCanvasElement | null>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (canvasRef as any).current = canvas;
    const wrapRef = createRef<HTMLElement | null>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wrapRef as any).current = wrap;

    const onResize = vi.fn();
    renderHook(() => useCanvasAutoSize(canvasRef, wrapRef, { onResize }));

    // The synchronous initial resize() call already ran during the effect.
    expect(onResize).toHaveBeenCalledTimes(1);
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);

    const widthSetterSpy = vi.spyOn(canvas, "width", "set");
    const heightSetterSpy = vi.spyOn(canvas, "height", "set");

    expect(ro.observeCount()).toBe(1);
    ro.fireAll(); // simulates ResizeObserver's redundant initial callback

    // The bug: this used to reassign width/height (implicitly clearing the
    // canvas bitmap) even though the observed size never changed. The fix:
    // both setters must NOT be invoked, and onResize must not fire again.
    expect(widthSetterSpy).not.toHaveBeenCalled();
    expect(heightSetterSpy).not.toHaveBeenCalled();
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  it("does reassign canvas.width/height when the observed size genuinely changes", () => {
    const ro = installMockResizeObserver();
    const canvas = document.createElement("canvas");
    const wrap = document.createElement("div");
    wrap.appendChild(canvas);
    document.body.appendChild(wrap);
    const rectSpy = vi.spyOn(wrap, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const canvasRef = createRef<HTMLCanvasElement | null>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (canvasRef as any).current = canvas;
    const wrapRef = createRef<HTMLElement | null>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wrapRef as any).current = wrap;

    const onResize = vi.fn();
    renderHook(() => useCanvasAutoSize(canvasRef, wrapRef, { onResize }));
    expect(onResize).toHaveBeenCalledTimes(1);

    rectSpy.mockReturnValue({
      width: 600,
      height: 300,
      top: 0,
      left: 0,
      right: 600,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    ro.fireAll();

    expect(onResize).toHaveBeenCalledTimes(2);
  });
});
