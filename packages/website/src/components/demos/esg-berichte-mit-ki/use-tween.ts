"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A number that can be set, or tweened to a target. The tween only ever
 * changes this one input; everything drawn is a pure function of it
 * (scene.ts). `ms` is the time for a full 0..1 run, so a short way takes less.
 */
export function useTween(initial: number) {
  const [value, setValue] = useState(initial);
  const current = useRef(initial);
  const frame = useRef(0);

  const stop = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = 0;
  }, []);

  const set = useCallback(
    (next: number) => {
      stop();
      current.current = next;
      setValue(next);
    },
    [stop],
  );

  const to = useCallback(
    (target: number, ms: number, done?: () => void) => {
      stop();
      const from = current.current;
      if (from === target) {
        done?.();
        return;
      }
      const span = Math.abs(target - from) * ms;
      let start: number | null = null;
      const tick = (now: number) => {
        if (start === null) start = now;
        const t = Math.min(1, (now - start) / span);
        const next = from + (target - from) * t;
        current.current = next;
        setValue(next);
        if (t < 1) {
          frame.current = requestAnimationFrame(tick);
        } else {
          frame.current = 0;
          done?.();
        }
      };
      frame.current = requestAnimationFrame(tick);
    },
    [stop],
  );

  useEffect(() => stop, [stop]);
  return { value, current, set, to, stop };
}

/** True when the visitor asked for less motion. The server renders the end state either way. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
