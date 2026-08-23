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
    const trapNode: T = node;

    // Snapshot the previously-focused element so we can restore on close.
    restoreRef.current = (document.activeElement as HTMLElement | null) ?? null;

    const focusables = () =>
      Array.from(
        trapNode.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        ),
      ).filter(
        (el) =>
          !el.closest('[hidden], [inert], [aria-hidden="true"]') &&
          el.getAttribute("tabindex") !== "-1",
      );

    const focusInside = () => {
      const all = focusables();
      if (all.length > 0) {
        all[0].focus();
      } else {
        trapNode.tabIndex = -1;
        trapNode.focus();
      }
    };

    // Move focus into the trap on open.
    focusInside();

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

    // Keyboard wrapping alone is not modal containment. Scripted focus,
    // assistive-technology navigation, and browser UI can all move focus
    // without a Tab keydown. Capture focusin at the document boundary and
    // return every escape attempt to the first usable control in the dialog.
    function onFocusIn(event: FocusEvent) {
      const target = event.target;
      if (target instanceof Node && trapNode.contains(target)) return;
      focusInside();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn, true);
      if (!restoreFocus) return;

      const restoreTarget = restoreRef.current;
      // Modal owners release their inert markers in sibling effects during the
      // same commit. Restore after those cleanups, never while the opener is
      // still inert, and never focus a detached or independently locked node.
      queueMicrotask(() => {
        if (
          restoreTarget?.isConnected &&
          !restoreTarget.closest('[inert], [aria-hidden="true"]')
        ) {
          restoreTarget.focus();
        }
      });
    };
  }, [open, onClose, restoreFocus]);

  return ref;
}
