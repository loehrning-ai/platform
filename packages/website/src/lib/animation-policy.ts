"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const VISIBLE_FLAG = 1;
const REDUCED_MOTION_FLAG = 2;

function getAnimationEnvironmentSnapshot(): number {
  if (typeof window === "undefined" || typeof document === "undefined")
    return 0;
  const visible = document.visibilityState !== "hidden";
  const reducedMotion =
    window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false;
  return (
    (visible ? VISIBLE_FLAG : 0) | (reducedMotion ? REDUCED_MOTION_FLAG : 0)
  );
}

function getServerAnimationEnvironmentSnapshot(): number {
  // Keep server output static. React refreshes the external-store snapshot
  // after hydration, once browser visibility and motion preferences are known.
  return 0;
}

function subscribeToAnimationEnvironment(
  onStoreChange: () => void,
): () => void {
  const media = window.matchMedia?.(REDUCED_MOTION_QUERY);
  document.addEventListener("visibilitychange", onStoreChange);
  media?.addEventListener?.("change", onStoreChange);

  return () => {
    document.removeEventListener("visibilitychange", onStoreChange);
    media?.removeEventListener?.("change", onStoreChange);
  };
}

/**
 * Returns an instant scroll for people who request reduced motion while
 * preserving smooth navigation for everyone else. Read at interaction time so
 * a live operating-system preference change is respected without a rerender.
 */
export function getMotionAwareScrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  return window.matchMedia?.(REDUCED_MOTION_QUERY).matches ? "auto" : "smooth";
}

export function useMotionAllowed(): boolean {
  const flags = useSyncExternalStore(
    subscribeToAnimationEnvironment,
    getAnimationEnvironmentSnapshot,
    getServerAnimationEnvironmentSnapshot,
  );
  return (flags & VISIBLE_FLAG) !== 0 && (flags & REDUCED_MOTION_FLAG) === 0;
}

/**
 * Runs automatically only while the page is visible and motion is allowed.
 * A reduced-motion user can still explicitly start an educational simulation;
 * the first Play action records that deliberate override for this component.
 */
export function useControllableAnimation(initiallyRequested = true): {
  readonly running: boolean;
  readonly play: () => void;
  readonly pause: () => void;
  readonly toggle: () => void;
} {
  const flags = useSyncExternalStore(
    subscribeToAnimationEnvironment,
    getAnimationEnvironmentSnapshot,
    getServerAnimationEnvironmentSnapshot,
  );
  const pageVisible = Boolean(flags & VISIBLE_FLAG);
  const prefersReducedMotion = Boolean(flags & REDUCED_MOTION_FLAG);
  const [requested, setRequested] = useState(initiallyRequested);
  const [reducedMotionOverride, setReducedMotionOverride] = useState(false);
  const running =
    requested &&
    pageVisible &&
    (!prefersReducedMotion || reducedMotionOverride);

  const play = useCallback(() => {
    setRequested(true);
    if (prefersReducedMotion) setReducedMotionOverride(true);
  }, [prefersReducedMotion]);

  const pause = useCallback(() => {
    setRequested(false);
  }, []);

  const toggle = useCallback(() => {
    if (running) {
      setRequested(false);
      return;
    }
    setRequested(true);
    if (prefersReducedMotion) setReducedMotionOverride(true);
  }, [prefersReducedMotion, running]);

  return { running, play, pause, toggle };
}
