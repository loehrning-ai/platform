"use client";

import { useEffect, useRef, useState } from "react";

/** Ease in and out, cubic. */
export function ease(share: number): number {
  const x = Math.min(1, Math.max(0, share));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/** 0..1 share of `progress` inside [from, to]. */
export function phase(progress: number, from: number, to: number): number {
  if (to <= from) return progress >= to ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - from) / (to - from)));
}

/**
 * A number that follows `target` over `ms`, eased. The motion of a lever the
 * visitor moved: a pure function of the time since the move, started on the
 * change, and an instant jump under reduced motion.
 */
export function useTween(target: number, ms: number, reduced: boolean): number {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const from = current.current;
    if (reduced || from === target) {
      current.current = target;
      setValue(target);
      return;
    }
    let frame = 0;
    let start = -1;
    const tick = (now: number) => {
      if (start < 0) start = now;
      const share = Math.min(1, (now - start) / ms);
      const next = from + (target - from) * ease(share);
      current.current = next;
      setValue(next);
      if (share < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [target, ms, reduced]);
  return value;
}

/**
 * 0..1 time share since `key` last changed, over `ms`: the clock of a
 * one-shot motion after a tap. Starts at 1 (no motion on mount); reduced
 * motion stays at 1.
 */
export function useSince(key: string, ms: number, reduced: boolean): number {
  const [share, setShare] = useState(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) {
      setShare(1);
      return;
    }
    let frame = 0;
    let start = -1;
    const tick = (now: number) => {
      if (start < 0) start = now;
      const next = Math.min(1, (now - start) / ms);
      setShare(next);
      if (next < 1) frame = window.requestAnimationFrame(tick);
    };
    setShare(0);
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [key, ms, reduced]);
  return share;
}
