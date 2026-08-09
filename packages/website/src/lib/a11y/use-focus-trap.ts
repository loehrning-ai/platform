"use client";

import { useEffect, useRef } from "react";

/**
 * Standard focus-trap + Escape + focus-restoration hook.
 *
 * Usage:
 *   const ref = useFocusTrap(open, onClose);
 *   return <div ref={ref}>...</div>;
 *
 * When `open` is true:
 *   - First focusable inside the wrapped node receives focus on open.
 *   - Tab/Shift+Tab cycles within the node.
 *   - Escape calls onClose.
 *   - When `open` flips back to false, focus is restored to whatever element
 *     had focus at the moment of opening.
 *
 * Pattern modeled on Radix UI's FocusScope to stay screen-reader friendly.
 */
export function useFocusTrap<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
  { restoreFocus = true }: { readonly restoreFocus?: boolean } = {},
) {
  const ref = useRef<T | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    if (!node) return;

    // Snapshot the previously-focused element so we can restore on close.
    restoreRef.current = (document.activeElement as HTMLElement | null) ?? null;

    const focusables = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        ),
      ).filter((el) => !el.hasAttribute("aria-hidden"));

    // Move focus into the trap on open.
    const all = focusables();
    if (all.length > 0) {
      all[0].focus();
    } else {
      node.tabIndex = -1;
      node.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (restoreFocus) restoreRef.current?.focus?.();
    };
  }, [open, onClose, restoreFocus]);

  return ref;
}
