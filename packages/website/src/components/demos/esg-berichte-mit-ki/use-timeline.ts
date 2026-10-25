"use client";

import { useEffect, useState } from "react";

/**
 * A local clock for motion the visitor starts inside a beat (the folder
 * sweep, the cascade, a verdict). `run` is a key: a new key plays 0 to 1 once
 * over `ms`, null rests at 0. The frame is a pure function of the returned t;
 * with reduced motion t jumps to 1.
 */
export function useTimeline(run: string | null, ms: number, reducedMotion: boolean): number {
  const [state, setState] = useState<{ readonly run: string | null; readonly t: number }>({ run: null, t: 0 });

  useEffect(() => {
    if (run === null || reducedMotion) return;
    let frame = 0;
    let start = -1;
    const tick = (now: number) => {
      if (start < 0) start = now;
      const t = Math.min(1, (now - start) / ms);
      setState({ run, t });
      if (t < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [ms, reducedMotion, run]);

  if (run === null) return 0;
  if (reducedMotion) return 1;
  return state.run === run ? state.t : 0;
}
