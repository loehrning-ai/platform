"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "@/lib/animations";

/**
 * Entrance wrapper for one Werkverzeichnis card. The single client boundary
 * in the shelf: it accepts server-rendered children, so the card itself stays
 * a server component.
 *
 * - `index === 0` renders WITHOUT an entrance: the first card can intersect
 *   the initial viewport on tall windows, and an opacity-0 start would delay
 *   its paint (LCP discipline; the h1 stays the primary candidate).
 * - Later cards reveal per COLUMN (`index % 3`), never cumulatively, so card
 *   20 animates exactly like card 2 when its row scrolls in.
 * - `once: true` gives a deterministic end state at opacity 1, which the
 *   settleMotion e2e helper samples for.
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

  return (
    <m.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      custom={index % 3}
    >
      {children}
    </m.div>
  );
}
