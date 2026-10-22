"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  } catch {
    return false;
  }
}

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const easeOutQuad = (t: number) => 1 - (1 - t) ** 2;

/**
 * Progress from 0 to 1 over `durationMs`, driven by requestAnimationFrame and
 * started only by a user action. It rests at 1, so the server and the first
 * paint show the end state, and under prefers-reduced-motion `start` keeps it
 * at 1. Motion built on it is a pure function of t (seek(t)).
 */
export function useProgress(durationMs: number): { readonly t: number; readonly start: () => void } {
  const [t, setT] = useState(1);
  const frame = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    if (prefersReducedMotion() || typeof requestAnimationFrame !== "function") {
      setT(1);
      return;
    }
    setT(0);
    let origin: number | null = null;
    const tick = (now: number) => {
      origin ??= now;
      const next = clamp01((now - origin) / durationMs);
      setT(next);
      frame.current = next < 1 ? requestAnimationFrame(tick) : null;
    };
    frame.current = requestAnimationFrame(tick);
  }, [durationMs, stop]);

  useEffect(() => stop, [stop]);

  return { t, start };
}
