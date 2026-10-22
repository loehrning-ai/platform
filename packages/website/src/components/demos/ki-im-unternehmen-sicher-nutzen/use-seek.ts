"use client";

import { useCallback, useEffect, useState } from "react";
import { useMotionAllowed } from "@/lib/animation-policy";

export interface Seek {
  /** Progress in [0, 1]; 1 is the end state and the resting value. */
  readonly t: number;
  /** Starts the moment from t = 0. Call it from the event that causes it. */
  readonly play: () => void;
  /** Jumps to the end state. */
  readonly finish: () => void;
}

/**
 * Drives one motion moment through requestAnimationFrame. The frame itself is
 * a pure function of t (see motion.ts). Under reduced motion, or before
 * anything happened, t is 1: the meaningful end state, never a blank.
 */
export function useSeek(ms: number): Seek {
  const motion = useMotionAllowed();
  const [run, setRun] = useState<{ readonly start: number } | null>(null);
  const [t, setT] = useState(1);

  useEffect(() => {
    if (!run) return;
    let frame = 0;
    const tick = (now: number) => {
      const next = Math.min(1, Math.max(0, (now - run.start) / ms));
      setT(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, ms]);

  const play = useCallback(() => {
    if (!motion) {
      setRun(null);
      setT(1);
      return;
    }
    setT(0);
    setRun({ start: performance.now() });
  }, [motion]);

  const finish = useCallback(() => {
    setRun(null);
    setT(1);
  }, []);

  return { t: motion ? t : 1, play, finish };
}
