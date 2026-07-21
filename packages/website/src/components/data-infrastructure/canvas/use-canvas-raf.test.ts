import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanvasRAF } from "./use-canvas-raf";

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
}

function setReducedMotion(matches: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any;
}

describe("useCanvasRAF ", () => {
  let rafCallbacks: FrameRequestCallback[];
  let rafSpy: ReturnType<typeof vi.fn>;
  let cancelSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setHidden(false);
    setReducedMotion(false);
    rafCallbacks = [];
    rafSpy = vi.fn((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    cancelSpy = vi.fn();
    // vi.useFakeTimers() installs its own fake requestAnimationFrame/
    // cancelAnimationFrame (part of sinon's default toFake list) — stub
    // AFTER enabling fake timers so these spies are the ones actually
    // installed on globalThis, not silently overwritten by fake-timers init.
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", rafSpy);
    vi.stubGlobal("cancelAnimationFrame", cancelSpy);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setHidden(false);
  });

  function flushRaf(now = 16) {
    const pending = [...rafCallbacks];
    rafCallbacks = [];
    for (const cb of pending) act(() => cb(now));
  }

  it("draws one frame synchronously on mount, before any requestAnimationFrame call", () => {
    const draw = vi.fn().mockReturnValue(false);
    renderHook(() => useCanvasRAF(draw));
    expect(draw).toHaveBeenCalledTimes(1);
  });

  it("stops scheduling once draw reports settled (no pending animation state)", () => {
    const draw = vi.fn().mockReturnValue(false);
    renderHook(() => useCanvasRAF(draw));
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("keeps scheduling frames while draw reports pending state, then settles", () => {
    let pending = true;
    const draw = vi.fn(() => pending);
    renderHook(() => useCanvasRAF(draw));
    expect(draw).toHaveBeenCalledTimes(1);
    expect(rafSpy).toHaveBeenCalledTimes(1);

    flushRaf();
    expect(draw).toHaveBeenCalledTimes(2);
    expect(rafSpy).toHaveBeenCalledTimes(2);

    pending = false;
    flushRaf();
    expect(draw).toHaveBeenCalledTimes(3);
    // draw returned false on this frame, so no further frame is scheduled.
    expect(rafSpy).toHaveBeenCalledTimes(2);
  });

  it("wake() resumes scheduling after the loop has settled", () => {
    const draw = vi.fn().mockReturnValue(false);
    const { result } = renderHook(() => useCanvasRAF(draw));
    expect(rafSpy).not.toHaveBeenCalled();

    act(() => result.current.wake());
    expect(rafSpy).toHaveBeenCalledTimes(1);
  });

  it("pauses while the tab is hidden and resumes on visibilitychange", () => {
    setHidden(true);
    const draw = vi.fn().mockReturnValue(true);
    renderHook(() => useCanvasRAF(draw));
    // The mount-time synchronous draw still happens (it runs before the
    // scheduler's hidden-tab check), but no frame gets scheduled while hidden.
    expect(draw).toHaveBeenCalledTimes(1);
    expect(rafSpy).not.toHaveBeenCalled();

    setHidden(false);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(rafSpy).toHaveBeenCalledTimes(1);
  });

  it("throttles to a ~250ms setTimeout cadence under prefers-reduced-motion instead of 60fps", () => {
    setReducedMotion(true);
    let pending = true;
    const draw = vi.fn(() => pending);
    renderHook(() => useCanvasRAF(draw));
    expect(rafSpy).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(250));
    expect(rafSpy).toHaveBeenCalledTimes(1);
    flushRaf();
    expect(draw).toHaveBeenCalledTimes(2);

    pending = false;
    act(() => vi.advanceTimersByTime(250));
    flushRaf();
    // Settled: no further timers scheduled after the last frame.
    expect(rafSpy).toHaveBeenCalledTimes(2);
  });

  it("cancels any pending frame and the visibility listener on unmount", () => {
    const draw = vi.fn().mockReturnValue(true);
    const { unmount } = renderHook(() => useCanvasRAF(draw));
    expect(rafSpy).toHaveBeenCalledTimes(1);

    const removeSpy = vi.spyOn(document, "removeEventListener");
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
    removeSpy.mockRestore();
  });
});
