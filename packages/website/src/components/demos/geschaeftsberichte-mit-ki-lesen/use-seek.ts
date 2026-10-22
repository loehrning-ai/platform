"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener?.("change", onChange);
  return () => media.removeEventListener?.("change", onChange);
}

function reducedNow(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(QUERY).matches
  );
}

/** True when the visitor asked for reduced motion. The server renders false. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, reducedNow, () => false);
}

/**
 * Drive t from 0 to 1 over `ms` with requestAnimationFrame while `running`.
 * No timers, no loops: one pass per change, then it stops.
 */
function useClock(running: boolean, ms: number, restartKey: unknown, onTick: (t: number) => void): void {
  useEffect(() => {
    if (!running) return;
    if (typeof requestAnimationFrame !== "function" || ms <= 0) {
      onTick(1);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      onTick(t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // onTick only writes state; the clock restarts on a new target, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, ms, restartKey]);
}

/**
 * p moves from where it is to `target` in `ms` (scaled by the distance).
 * Returns the target at once under reduced motion and on the first render,
 * so the server and a reduced-motion visitor see the end state.
 */
export function useSeek(target: number, ms: number): number {
  const reduced = useReducedMotion();
  const [state, setState] = useState({ from: target, to: target, p: target });
  if (state.to !== target) {
    setState({ from: state.p, to: target, p: state.p });
  }
  const running = !reduced && state.p !== state.to;
  const duration = ms * Math.abs(state.to - state.from);
  useClock(running, duration, state.to, (t) =>
    setState((current) => ({ ...current, p: current.from + (current.to - current.from) * t })),
  );
  return reduced ? target : state.p;
}

/**
 * For a figure that morphs between discrete states (the rate ladder): the
 * previous and the current state and p from 0 to 1 between them.
 */
export function useMorph<T>(value: T, ms: number): { from: T; to: T; p: number } {
  const reduced = useReducedMotion();
  const [state, setState] = useState({ from: value, to: value, p: 1 });
  if (state.to !== value) {
    setState({ from: state.to, to: value, p: 0 });
  }
  const running = !reduced && state.p < 1;
  useClock(running, ms, state.to, (t) => setState((current) => ({ ...current, p: t })));
  return reduced ? { from: value, to: value, p: 1 } : state;
}
