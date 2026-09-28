"use client";

/**
 * Prints one part of an article. The click sets
 * html[data-print-scope="<scope>"], which the article stylesheet uses to hide
 * everything but that part (post-wz.css, @media print), then opens the
 * browser's print dialog.
 *
 * The attribute stays set until printing has finished. Desktop browsers block
 * in window.print() until the dialog closes, but some mobile browsers return
 * at once and lay out the pages afterwards; clearing right after print()
 * returned would print the whole article there. So the scope is cleared on
 * afterprint, when the print media query stops matching, or, for a browser
 * that signals neither, on the next focus, pointer or key press after a short
 * delay. A later plain browser print then prints the whole article again.
 * Without JavaScript the button does nothing and the browser's own print
 * still prints the article.
 */

import { useEffect, useRef } from "react";

/** Wait before the fallback listens, so the click that opened print is past. */
export const PRINT_SCOPE_FALLBACK_MS = 1000;

export function PrintSheetButton({
  label,
  scope = "sheet",
  tone = "primary",
}: {
  label: string;
  scope?: string;
  /** "secondary" for a second print button on the page: one filled Mennige button per paper page. */
  tone?: "primary" | "secondary";
}) {
  const release = useRef<(() => void) | null>(null);

  // Leaving the page (or unmounting) must not leave a print scope behind.
  useEffect(() => () => release.current?.(), []);

  const handleClick = () => {
    release.current?.();

    const root = document.documentElement;
    const printMedia =
      typeof window.matchMedia === "function"
        ? window.matchMedia("print")
        : null;

    function onPrintMediaChange(event: MediaQueryListEvent) {
      if (!event.matches) clear();
    }

    function clear() {
      delete root.dataset.printScope;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("afterprint", clear);
      printMedia?.removeEventListener("change", onPrintMediaChange);
      window.removeEventListener("focus", clear);
      window.removeEventListener("pointerdown", clear, true);
      window.removeEventListener("keydown", clear, true);
      if (release.current === clear) release.current = null;
    }

    const fallbackTimer = window.setTimeout(() => {
      window.addEventListener("focus", clear);
      window.addEventListener("pointerdown", clear, true);
      window.addEventListener("keydown", clear, true);
    }, PRINT_SCOPE_FALLBACK_MS);
    release.current = clear;
    root.dataset.printScope = scope;
    window.addEventListener("afterprint", clear);
    printMedia?.addEventListener("change", onPrintMediaChange);

    try {
      window.print();
    } catch (error) {
      clear();
      throw error;
    }
  };

  return (
    <button
      type="button"
      className={tone === "primary" ? "wz-btn wz-btn--primary" : "wz-btn"}
      onClick={handleClick}
    >
      {label}
    </button>
  );
}
