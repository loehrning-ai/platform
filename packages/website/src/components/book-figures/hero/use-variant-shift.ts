"use client";

/**
 * Animates a control change between two baked variants (detents). The figure
 * engine blends `from` into `variant` by `shift` (0 to 1); this hook produces
 * that number over 180 ms (the learner-triggered window is 120 to 200 ms).
 * Under reduced motion, and on the first render, the change is instant.
 */

import { useEffect, useRef, useState } from "react";

export const SHIFT_MS = 180;

export interface ShiftState {
  /** Variant being shown (the target). */
  readonly variant: string | undefined;
  /** Variant being left, only while shift < 1. */
  readonly from: string | undefined;
  /** 0 to 1 from `from` to `variant`. */
  readonly shift: number;
}

export function useVariantShift(target: string | undefined, reduced: boolean): ShiftState {
  const [state, setState] = useState<ShiftState>({ variant: target, from: undefined, shift: 1 });
  const shown = useRef(target);
  const frame = useRef(0);

  useEffect(() => {
    if (target === shown.current) return undefined;
    const from = shown.current;
    shown.current = target;
    if (reduced || typeof window.requestAnimationFrame !== "function") {
      setState({ variant: target, from: undefined, shift: 1 });
      return undefined;
    }
    const start = window.performance.now();
    const step = (now: number): void => {
      const t = Math.min(1, Math.max(0, (now - start) / SHIFT_MS));
      setState(t >= 1 ? { variant: target, from: undefined, shift: 1 } : { variant: target, from, shift: t });
      if (t < 1) frame.current = window.requestAnimationFrame(step);
    };
    setState({ variant: target, from, shift: 0 });
    frame.current = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame.current);
  }, [target, reduced]);

  return state;
}
