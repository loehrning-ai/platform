"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAnimatedCounterOptions {
  readonly target: number;
  readonly duration?: number;
  readonly suffix?: string;
  readonly autoStart?: boolean;
  readonly enabled?: boolean;
}

interface UseAnimatedCounterReturn {
  readonly value: number;
  readonly display: string;
  readonly isComplete: boolean;
  readonly start: () => void;
}

export function useAnimatedCounter({
  target,
  duration = 1500,
  suffix = "",
  autoStart = false,
  enabled,
}: UseAnimatedCounterOptions): UseAnimatedCounterReturn {
  const [value, setValue] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const rafRef = useRef<number>(0);
  const hasStartedRef = useRef(false);

  const shouldStart = enabled ?? autoStart;

  const start = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsComplete(true);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [target, duration]);

  useEffect(() => {
    if (shouldStart) start();
  }, [shouldStart, start]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return {
    value,
    display: `${value}${suffix}`,
    isComplete,
    start,
  };
}
