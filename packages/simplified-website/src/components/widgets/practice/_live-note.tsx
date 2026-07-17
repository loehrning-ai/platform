"use client";

import { type JSX } from "react";
import { cn } from "@/lib/utils";

/**
 * LiveNote — honest status line for the Practice Room widgets.
 * Shown when live Claude is unavailable (feature flag/API absent or a call
 * failed). German copy, no em dashes. See shared course architecture (R5).
 */
export function LiveNote({
  available,
  className,
}: {
  /** null = not yet attempted; false = live mode unavailable; true = live. */
  readonly available: boolean | null;
  readonly className?: string;
}): JSX.Element | null {
  if (available !== false) return null;
  return (
    <p
      role="status"
      className={cn(
        "mt-3 border-l-[3px] border-brand-amber bg-brand-amber/5 px-3 py-2 font-mono text-[11px] leading-[1.5] text-muted-foreground",
        className,
      )}
    >
      Live-Modus nicht verfügbar. Du siehst den statischen Qualitätswert. Die
      Live-Ausführung mit Claude ist in dieser Umgebung nicht aktiviert.
    </p>
  );
}
