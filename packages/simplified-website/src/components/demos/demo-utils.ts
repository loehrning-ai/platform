"use client";

/**
 * Shared constants for demo components.
 *
 * The tiny `Overline` helper-element factory is kept here to avoid a wrapper
 * `"use client"` component import chain; every demo renders its own JSX from
 * the palette in `src/lib/demo-tokens.ts`.
 */

import { useEffect, useRef, useState } from "react";

/** True when the user has requested reduced motion via their OS. */
export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefers;
}

/**
 * Fires the callback once the demo enters the viewport and the tab is visible.
 * Pauses the caller's own animation loop when the tab is hidden.
 *
 * Returns { visible, ref } — spread `ref` onto the demo root. Use `visible`
 * to gate timers (e.g. `if (!visible) return;` inside your effect).
 */
export function useVisibleAutoplay<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handler = () => setTabVisible(document.visibilityState !== "hidden");
    handler();
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setInView(entry.isIntersecting);
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible: inView && tabVisible };
}

/**
 * Timer utility: runs a looped sequence of phases only while `enabled=true`.
 * Emits phase index on each tick; respects reduced-motion (holds on phase 0).
 */
export function usePhasedLoop(
  phases: readonly { duration: number }[],
  enabled: boolean,
  reducedMotion: boolean,
): number {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!enabled || reducedMotion || phases.length === 0) return;
    const id = setTimeout(() => {
      setPhase((p) => (p + 1) % phases.length);
    }, phases[phase]?.duration ?? 1000);
    return () => clearTimeout(id);
  }, [phase, enabled, reducedMotion, phases]);

  return phase;
}

export const DEMO_HEIGHT = 620;
