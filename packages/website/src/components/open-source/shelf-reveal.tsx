"use client";

import type { ReactNode } from "react";

/**
 * Stable wrapper for one Werkverzeichnis card. It accepts server-rendered
 * children, so it must not put them below a client motion provider.
 *
 * - `index === 0` renders WITHOUT an entrance: the first card can intersect
 *   the initial viewport on tall windows, and an opacity-0 start would delay
 *   its paint (LCP discipline; the h1 stays the primary candidate).
 * - Later cards keep the same static composition and remain visible without
 *   JavaScript, reduced-motion branching, or hydration-time style changes.
 */
export function ShelfReveal({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  if (index === 0) {
    return <div className={className}>{children}</div>;
  }

  return <div className={className}>{children}</div>;
}
