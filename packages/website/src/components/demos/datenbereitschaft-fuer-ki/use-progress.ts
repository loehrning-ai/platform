"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clamp01, lerp } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/scene";

const easeOut = (x: number): number => 1 - (1 - x) * (1 - x);

/**
 * The one clock of the demo: progress p in 0..1. Dragging sets it directly;
 * `play` writes it from a pure function of elapsed time (intro, release snap,
 * button tween). Nothing else is animated; the scene is a function of p.
 */
export function useProgress(initial: number) {
  const [p, setP] = useState(initial);
  const current = useRef(initial);
  const frame = useRef<number | null>(null);

  const cancel = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const write = useCallback((value: number) => {
    current.current = value;
    setP(value);
  }, []);

  const set = useCallback(
    (value: number) => {
      cancel();
      write(clamp01(value));
    },
    [cancel, write],
  );

  const play = useCallback(
    (duration: number, at: (ms: number) => number) => {
      cancel();
      let began: number | null = null;
      const step = (now: number) => {
        began ??= now;
        const ms = Math.min(duration, now - began);
        write(at(ms));
        frame.current = ms < duration ? requestAnimationFrame(step) : null;
      };
      frame.current = requestAnimationFrame(step);
    },
    [cancel, write],
  );

  const animateTo = useCallback(
    (target: number, duration: number) => {
      const from = current.current;
      play(duration, (ms) => (ms >= duration ? target : lerp(from, target, easeOut(ms / duration))));
    },
    [play],
  );

  useEffect(() => cancel, [cancel]);

  return { p, set, play, animateTo, cancel };
}
