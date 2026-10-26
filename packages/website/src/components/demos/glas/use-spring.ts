"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GLAS_SPRINGS, isSettled, stepSpring, type GlasSpringName, type SpringConfig } from "@/lib/glas-motion";

/**
 * Springs for Glas, without a motion library: a small rAF integrator over
 * the tokens in src/lib/glas-motion.ts. Every spring starts from the current
 * value and velocity, so a new target or a drag interrupts it smoothly.
 * With reduced motion the value jumps to its target.
 */

export type SpringInput = GlasSpringName | SpringConfig;

export function springConfig(input: SpringInput): SpringConfig {
  return typeof input === "string" ? GLAS_SPRINGS[input] : input;
}

export interface SpringHandle {
  /** Starts (or retargets) the spring. */
  readonly to: (target: number, options?: { readonly velocity?: number; readonly immediate?: boolean }) => void;
  /** Sets the value at once and stops (a finger drag). */
  readonly set: (value: number) => void;
  readonly value: () => number;
  readonly stop: () => void;
}

/**
 * An imperative spring that calls `onFrame` with every value. No re-render:
 * write the value into a style in `onFrame`.
 */
export function createSpring(initial: number, input: SpringInput, onFrame: (value: number) => void, onRest?: () => void): SpringHandle {
  let value = initial;
  let velocity = 0;
  let target = initial;
  let frame = 0;
  let last = 0;
  let travel = 1;
  const config = springConfig(input);

  const stop = () => {
    if (frame && typeof window !== "undefined") window.cancelAnimationFrame(frame);
    frame = 0;
  };
  const tick = (now: number) => {
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    const next = stepSpring({ value, velocity }, target, config, dt);
    value = next.value;
    velocity = next.velocity;
    if (isSettled(next, target, travel)) {
      value = target;
      velocity = 0;
      frame = 0;
      onFrame(value);
      onRest?.();
      return;
    }
    onFrame(value);
    frame = window.requestAnimationFrame(tick);
  };
  return {
    to(nextTarget, options) {
      target = nextTarget;
      if (options?.velocity !== undefined) velocity = options.velocity;
      if (options?.immediate || typeof window === "undefined") {
        stop();
        value = nextTarget;
        velocity = 0;
        onFrame(value);
        onRest?.();
        return;
      }
      travel = Math.max(Math.abs(nextTarget - value), 1e-3);
      if (!frame) {
        last = 0;
        frame = window.requestAnimationFrame(tick);
      }
    },
    set(nextValue) {
      stop();
      value = nextValue;
      target = nextValue;
      velocity = 0;
      onFrame(value);
    },
    value: () => value,
    stop,
  };
}

/** True when the visitor asked for reduced motion (live). */
export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return reduce;
}

/**
 * A spring that follows `target` and re-renders with each value. For small
 * things (a readout number, a pill position); for per-frame style writes use
 * createSpring.
 */
export function useSpringValue(target: number, input: SpringInput = "smooth", reducedMotion = false): number {
  const [value, setValue] = useState(target);
  const handle = useRef<SpringHandle | null>(null);
  const configKey = typeof input === "string" ? input : `${input.stiffness}/${input.damping}`;
  useLayoutEffect(() => {
    handle.current = createSpring(target, input, setValue);
    return () => handle.current?.stop();
    // The spring is created once per config; later targets go through `to`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);
  useEffect(() => {
    handle.current?.to(target, { immediate: reducedMotion });
  }, [target, reducedMotion]);
  return value;
}
