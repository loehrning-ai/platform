import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useElementVisibility,
  useInView,
  useInterval,
  useTicker,
} from "./hooks";

describe("data-science shared hooks ", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("useInView", () => {
    it("starts not-in-view and exposes a ref", () => {
      const { result } = renderHook(() => useInView());
      expect(result.current[1]).toBe(false);
      expect(result.current[0].current).toBeNull();
    });
  });

  describe("useInterval", () => {
    it("invokes the callback repeatedly on the given interval", () => {
      vi.useFakeTimers();
      const cb = vi.fn();
      renderHook(() => useInterval(cb, 1000));
      expect(cb).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(cb).toHaveBeenCalledTimes(3);
    });

    it("does nothing when ms is null", () => {
      vi.useFakeTimers();
      const cb = vi.fn();
      renderHook(() => useInterval(cb, null));
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(cb).not.toHaveBeenCalled();
    });

    it("clears the interval on unmount", () => {
      vi.useFakeTimers();
      const cb = vi.fn();
      const { unmount } = renderHook(() => useInterval(cb, 1000));
      unmount();
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("useElementVisibility", () => {
    it("falls back to visible when IntersectionObserver is unavailable", () => {
      vi.stubGlobal("IntersectionObserver", undefined);
      const element = document.createElement("div");
      const { result } = renderHook(() => {
        const state = useElementVisibility<HTMLDivElement>();
        state[0].current = element;
        return state;
      });

      expect(result.current[1]).toBe(true);
    });
  });

  describe("useTicker", () => {
    it("returns 0 when not running", () => {
      const { result } = renderHook(() => useTicker(false));
      expect(result.current).toBe(0);
    });
  });
});
