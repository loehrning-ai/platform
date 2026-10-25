"use client";

import { useCallback, useRef } from "react";

/**
 * A radio chosen by tap or click hands focus to "Weiter", so the next
 * ArrowRight moves on instead of cycling the radio group back to its first
 * option. A choice made with the keyboard keeps focus in the group, where
 * the arrows belong to the radios.
 */
export function usePointerChoice() {
  const byPointer = useRef(false);
  const onPointerDown = useCallback(() => {
    byPointer.current = true;
  }, []);
  const onKeyDown = useCallback(() => {
    byPointer.current = false;
  }, []);
  /** Call after the choice is stored. */
  const settle = useCallback(() => {
    if (!byPointer.current) return;
    byPointer.current = false;
    window.requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === "radio") active.blur();
      document.querySelector<HTMLElement>("[data-demo-next]")?.focus({ preventScroll: true });
    });
  }, []);
  return { onPointerDown, onKeyDown, settle };
}
