"use client";

// ─── useCanvasRAF ────────────────────────────────
//
// Ports the source's shared `RAF()` helper (js/data-widgets.js lines 13-25):
// pause entirely while the tab is hidden (background tabs never burn CPU
// repainting an offscreen canvas), and throttle to ~4fps under
// prefers-reduced-motion instead of 60fps. Adds one thing the source never
// had: a "settled" concept. The source's `loop()` functions call `RAF(loop)`
// unconditionally at the end of every frame, so every canvas widget animates
// forever at its target frame rate for as long as it stays mounted, even
// once every particle/pulse/transition has finished. Here, `draw` reports
// whether it still has pending animation state; once it reports false the
// hook stops scheduling new frames entirely (idle widgets truly idle, not
// just visually static) until `wake()` is called again by an interaction
// that produces new state.
//
// Deliberately independent of framer-motion's `useReducedMotion` (a
// module-level singleton — see terminal-replay.test.tsx's own comment on why
// that hook is unreliable to flip per-test): this hook reads
// `window.matchMedia` directly, so each mounted instance observes the media
// query fresh and is trivially mockable per-test.

import { useCallback, useEffect, useRef } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** ~4fps, matching the source's own reduced-motion cadence. */
const REDUCED_MOTION_INTERVAL_MS = 250;

function readReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return false;
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  } catch {
    return false;
  }
}

export interface UseCanvasRAFHandle {
  /**
   * Wake the loop after an interaction that produces new animation state
   * (a particle burst, a pulse, a rollback animation). No-op while a frame
   * is already scheduled. Safe to call from any event handler.
   */
  readonly wake: () => void;
  /** Current prefers-reduced-motion value, read once per render is unsafe —
   * this is a live ref-backed getter, not React state, so it never triggers
   * a re-render on its own. */
  readonly isReducedMotion: () => boolean;
}

/**
 * @param draw Called with a high-resolution timestamp on every scheduled
 *   frame, INSIDE the effect's lifetime only (never during render — callers
 *   must invoke `wake()`/rely on the mount-time first frame from inside
 *   their own `useEffect`/`useLayoutEffect`). Return `true` while there is
 *   still pending animation state so the loop keeps scheduling; return
 *   `false` once idle so scheduling stops.
 */
export function useCanvasRAF(
  draw: (now: number) => boolean,
): UseCanvasRAFHandle {
  const drawRef = useRef(draw);
  drawRef.current = draw;

  const rafIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibilityListenerRef = useRef<(() => void) | null>(null);
  const scheduledRef = useRef(false);
  const unmountedRef = useRef(false);

  const clearPending = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (timeoutIdRef.current != null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (visibilityListenerRef.current) {
      document.removeEventListener(
        "visibilitychange",
        visibilityListenerRef.current,
      );
      visibilityListenerRef.current = null;
    }
    scheduledRef.current = false;
  }, []);

  const scheduleRef = useRef<() => void>(() => {});
  scheduleRef.current = () => {
    if (unmountedRef.current || scheduledRef.current) return;
    scheduledRef.current = true;

    if (typeof document !== "undefined" && document.hidden) {
      const onVisible = () => {
        document.removeEventListener("visibilitychange", onVisible);
        visibilityListenerRef.current = null;
        scheduledRef.current = false;
        scheduleRef.current();
      };
      visibilityListenerRef.current = onVisible;
      document.addEventListener("visibilitychange", onVisible);
      return;
    }

    const runFrame = (now: number) => {
      rafIdRef.current = null;
      timeoutIdRef.current = null;
      scheduledRef.current = false;
      if (unmountedRef.current) return;
      const hasPending = drawRef.current(now);
      if (hasPending) scheduleRef.current();
    };

    if (readReducedMotion()) {
      timeoutIdRef.current = setTimeout(() => {
        rafIdRef.current = requestAnimationFrame(runFrame);
      }, REDUCED_MOTION_INTERVAL_MS);
    } else {
      rafIdRef.current = requestAnimationFrame(runFrame);
    }
  };

  const wake = useCallback(() => {
    scheduleRef.current();
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    // Always draw one frame synchronously on mount so the widget's initial
    // static state renders immediately, including under reduced motion
    // (Done Criteria: "a single static frame") — this call is direct, not
    // scheduled through RAF, so it happens before paint.
    const hasPending = drawRef.current(performance.now());
    if (hasPending) scheduleRef.current();
    return () => {
      unmountedRef.current = true;
      clearPending();
    };
  }, [clearPending]);

  return { wake, isReducedMotion: readReducedMotion };
}
