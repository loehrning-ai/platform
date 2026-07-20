"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export interface PhaseConfig {
  readonly duration: number;
  readonly id?: string;
  readonly at?: number;
}

interface UseAutoplayOptions {
  readonly phases: readonly PhaseConfig[];
  readonly loop?: boolean;
}

interface UseAutoplayReturn {
  readonly phase: number;
  readonly activePhase: number;
  readonly phaseIndex: number;
  readonly ref: React.RefObject<HTMLDivElement | null>;
  readonly containerRef: React.RefObject<HTMLDivElement | null>;
  readonly inView: boolean;
  readonly isPlaying: boolean;
  readonly isInteractive: boolean;
  readonly setPhase: (p: number) => void;
  readonly resume: () => void;
  readonly restart: () => void;
  readonly hasReached: (id: string) => boolean;
}

export function useAutoplay({
  phases,
  loop = false,
}: UseAutoplayOptions): UseAutoplayReturn {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: !loop, amount: 0.3 });
  const [phase, setPhaseState] = useState(-1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setPhase = useCallback((p: number) => {
    clearTimer();
    setPhaseState(p);
    setPaused(true);
  }, [clearTimer]);

  const resume = useCallback(() => {
    setPaused(false);
  }, []);

  const restart = useCallback(() => {
    clearTimer();
    setPhaseState(0);
    setPaused(false);
  }, [clearTimer]);

  useEffect(() => {
    if (!inView) {
      clearTimer();
      return;
    }

    if (phase === -1) {
      setPhaseState(0);
      return;
    }

    if (paused) return;

    const current = phases[phase];
    if (!current) return;

    timerRef.current = setTimeout(() => {
      setPhaseState((prev) => {
        const next = prev + 1;
        if (next >= phases.length) {
          return loop ? 0 : prev;
        }
        return next;
      });
    }, current.duration);

    return clearTimer;
  }, [inView, phase, phases, loop, paused, clearTimer]);

  const hasReached = useCallback(
    (id: string) => {
      if (phase < 0) return false;
      const idx = phases.findIndex((p) => p.id === id);
      return idx >= 0 && phase >= idx;
    },
    [phase, phases],
  );

  const isInteractive = phase >= phases.length - 1 && !loop;

  return {
    phase: Math.max(0, phase),
    activePhase: Math.max(0, phase),
    phaseIndex: Math.max(0, phase),
    ref,
    containerRef: ref,
    inView,
    isPlaying: phase >= 0 && phase < phases.length - 1 && !paused,
    isInteractive,
    setPhase,
    resume,
    restart,
    hasReached,
  };
}
