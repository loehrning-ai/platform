"use client";

import { useCallback } from "react";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** The scroll behaviour to use right now: instant under reduced motion. */
export function useReducedMotionScroll(): () => ScrollBehavior {
  return useCallback(() => (prefersReducedMotion() ? "auto" : "smooth"), []);
}

/**
 * Bring a fieldset (or any block) to the top of the view and focus its first
 * input, without touching the URL hash.
 */
export function focusFirstInput(container: HTMLElement | null | undefined, behavior: ScrollBehavior): void {
  if (!container) return;
  container.scrollIntoView?.({ block: "start", behavior });
  const input = container.querySelector<HTMLInputElement>("input");
  input?.focus({ preventScroll: true });
}

/** Scroll to an element and focus it (a heading with tabIndex -1). */
export function focusBlock(element: HTMLElement | null | undefined, behavior: ScrollBehavior): void {
  if (!element) return;
  element.scrollIntoView?.({ block: "start", behavior });
  element.focus({ preventScroll: true });
}
