"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A progress clock. While `run` is a number, `p` moves 0 to 1 over
 * `durationMs` (rAF timestamps only, no timers); a new `run` value restarts
 * it. Every frame of the demo is a pure function of p, so seeking, reduced
 * motion and tests only choose the number.
 */
export function useProgress(
  run: number | null,
  durationMs: number,
  onDone?: () => void,
): number {
  const [state, setState] = useState({ run: -1, p: 0 });
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (run === null) return;
    let frame = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const next = Math.min(1, (now - start) / durationMs);
      setState({ run, p: next });
      if (next < 1) frame = requestAnimationFrame(tick);
      else done.current?.();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, durationMs]);

  // A fresh run starts at 0, never at the last value of the one before.
  return state.run === run ? state.p : 0;
}

/** true after the first render on the client (SSR and first paint stay on the end state). */
export function useReducedMotion(): boolean | null {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Width of an element, kept current with a ResizeObserver; `initial` until measured. */
export function useWidth<T extends HTMLElement>(initial: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const next = node.clientWidth;
      if (next > 0) setWidth(next);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Whether an element is on screen at all, or mostly (ratio), via IntersectionObserver. */
export function useVisibility<T extends HTMLElement>(ratio: number) {
  const ref = useRef<T>(null);
  const [state, setState] = useState({ any: false, enough: false });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setState({ any: true, enough: true });
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry)
          setState({
            any: entry.isIntersecting,
            enough: entry.intersectionRatio >= ratio,
          });
      },
      { threshold: [0, ratio] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ratio]);
  return [ref, state] as const;
}
