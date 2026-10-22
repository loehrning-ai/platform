"use client";

import { useEffect, useState, type RefObject } from "react";
import { clamp01 } from "@/lib/demo-cases/esg-berichte-mit-ki/core";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * True once the element has been at least `ratio` visible, and from then on.
 * Without IntersectionObserver (old browsers, tests) it is true at once.
 */
export function useSeenOnce(ref: RefObject<Element | null>, ratio = 0.6): boolean {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (seen || !element) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= ratio)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: [ratio] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, ratio, seen]);
  return seen;
}

/**
 * One clock for every motion of the demo: t runs from 0 to 1 over `ms` on
 * requestAnimationFrame, once per `playKey`, and only after `armed` (the
 * picture is in view). Until then the frame holds at t = 0. Pure frame
 * functions turn t into a picture, so a frame is a function of t and nothing
 * else. With reduced motion (and on the server) t is 1 from the first render:
 * the end state. Nothing loops and nothing starts without a key.
 */
export function useSeek(ms: number, playKey: string | null, armed = true): number {
  const [state, setState] = useState<{ key: string | null; t: number }>(() => ({
    key: playKey,
    t: playKey !== null && !prefersReducedMotion() ? 0 : 1,
  }));

  useEffect(() => {
    if (playKey === null || !armed || prefersReducedMotion()) return undefined;
    let frame = 0;
    // The first frame's own timestamp is t = 0: one clock, the frame clock.
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const t = clamp01((now - start) / ms);
      setState({ key: playKey, t });
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ms, playKey, armed]);

  if (state.key !== playKey) return playKey !== null && !prefersReducedMotion() ? 0 : 1;
  return state.t;
}
