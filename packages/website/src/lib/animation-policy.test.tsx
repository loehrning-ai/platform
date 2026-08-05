import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useControllableAnimation,
  useMotionAllowed,
} from "./animation-policy";

function setReducedMotion(matches: boolean) {
  const listeners = new Set<() => void>();
  const media = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  return {
    update(next: boolean) {
      media.matches = next;
      act(() => listeners.forEach((listener) => listener()));
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("animation policy", () => {
  it("allows motion on a visible page without a reduced-motion preference", () => {
    setReducedMotion(false);
    const { result } = renderHook(() => useMotionAllowed());
    expect(result.current).toBe(true);
  });

  it("stops automatic motion when reduced motion is requested", () => {
    setReducedMotion(true);
    const { result } = renderHook(() => useControllableAnimation());
    expect(result.current.running).toBe(false);
  });

  it("allows a reduced-motion user to explicitly play and pause a simulation", () => {
    setReducedMotion(true);
    const { result } = renderHook(() => useControllableAnimation());

    act(() => result.current.play());
    expect(result.current.running).toBe(true);
    act(() => result.current.pause());
    expect(result.current.running).toBe(false);
  });

  it("reacts to changes in the browser motion preference", () => {
    const preference = setReducedMotion(false);
    const { result } = renderHook(() => useMotionAllowed());
    expect(result.current).toBe(true);

    preference.update(true);
    expect(result.current).toBe(false);
  });
});
