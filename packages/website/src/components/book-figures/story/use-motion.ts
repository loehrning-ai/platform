"use client";

/**
 * Motion hooks for the story islands. Every figure is a pure function of a
 * progress from 0 to 1 (see lib/figures); these hooks only produce that
 * number. The server and the first client render always use the finished
 * state, so reduced motion, no JS and the PDF never see a half-drawn figure.
 */

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function reducedMatches(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(REDUCED_QUERY).matches;
}

function subscribeReduced(onChange: () => void): () => void {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True when the visitor asked for reduced motion. The server snapshot is false. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, reducedMatches, () => false);
}

/** Live result of a CSS media query; false on the server and until mounted. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => typeof window.matchMedia === "function" && window.matchMedia(query).matches,
    () => false,
  );
}

const easeOut = (t: number): number => 1 - (1 - t) ** 3;

/**
 * Eases toward `target` over `durationMs`. Disabled (reduced motion, or no
 * change wanted) it returns the target at once. The first render never
 * animates.
 */
export function useTween(target: number, durationMs: number, enabled: boolean): number {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  // Disabled, the state follows the target (adjusted during render, so the
  // frame after a switch to "enabled" starts from the right value).
  if (!enabled && value !== target) setValue(target);

  useEffect(() => {
    if (!enabled || durationMs <= 0) {
      current.current = target;
      return;
    }
    const from = current.current;
    if (from === target) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const next = from + (target - from) * easeOut(t);
      current.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, enabled]);

  return enabled ? value : target;
}

export type RevealPhase = "done" | "armed" | "playing";

/**
 * One-shot reveal when the element first scrolls into view. Before that the
 * figure sits at progress 0 (only if it started below the fold); a figure
 * already on screen at load stays finished, so nothing flashes. Reduced motion
 * or a missing IntersectionObserver keep the finished state.
 */
export function useRevealOnView<T extends Element>(
  durationMs = 450,
): { ref: RefObject<T | null>; progress: number; phase: RevealPhase } {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<RevealPhase>("done");

  useEffect(() => {
    const node = ref.current;
    if (reduced || !node || typeof IntersectionObserver === "undefined") return;
    let first = true;
    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries.some((entry) => entry.isIntersecting);
        if (first) {
          first = false;
          if (seen) {
            observer.disconnect();
            return;
          }
          setPhase("armed");
          return;
        }
        if (seen) {
          setPhase("playing");
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  const tweened = useTween(phase === "armed" ? 0 : 1, durationMs, phase === "playing" && !reduced);
  const progress = reduced || phase === "done" ? 1 : phase === "armed" ? 0 : tweened;
  return { ref, progress, phase };
}
