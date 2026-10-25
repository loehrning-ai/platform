"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A short local transition between two values of a lever (merge on or off,
 * month total or per week): returns the value it comes from, the value it
 * goes to and the share 0..1, advanced by requestAnimationFrame. Reduced
 * motion jumps to the end. The stage draws f(from, to, share).
 */
export function useTransitionShare<T>(value: T, ms: number, reducedMotion: boolean) {
  const [state, setState] = useState({ from: value, to: value, share: 1 });
  const frame = useRef(0);
  useEffect(() => {
    if (Object.is(value, state.to)) return;
    window.cancelAnimationFrame(frame.current);
    const from = state.to;
    if (reducedMotion) {
      setState({ from: value, to: value, share: 1 });
      return;
    }
    let start = -1;
    const tick = (now: number) => {
      if (start < 0) start = now;
      const share = Math.min(1, (now - start) / ms);
      setState({ from, to: value, share });
      if (share < 1) frame.current = window.requestAnimationFrame(tick);
    };
    frame.current = window.requestAnimationFrame(tick);
  }, [value, ms, reducedMotion, state.to]);
  useEffect(() => () => window.cancelAnimationFrame(frame.current), []);
  return state;
}

/**
 * Milliseconds since `runKey` last changed to a non-null value, capped at
 * `ms`; 0 while it is null. One run per tap (the trace), restartable.
 */
export function useRunClock(runKey: number | null, ms: number, reducedMotion: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const frame = useRef(0);
  useEffect(() => {
    window.cancelAnimationFrame(frame.current);
    if (runKey === null) {
      setElapsed(0);
      return;
    }
    if (reducedMotion) {
      setElapsed(ms);
      return;
    }
    let start = -1;
    const tick = (now: number) => {
      if (start < 0) start = now;
      const value = Math.min(ms, now - start);
      setElapsed(value);
      if (value < ms) frame.current = window.requestAnimationFrame(tick);
    };
    frame.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame.current);
  }, [runKey, ms, reducedMotion]);
  return elapsed;
}
