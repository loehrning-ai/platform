"use client";

import { m } from "framer-motion";
import { drawLine } from "@/lib/animations";

/**
 * A Kupfer accent rule that draws itself in from the left on mount. Transform
 * only (scaleX), so `MotionConfig reducedMotion="user"` renders it settled at
 * scaleX(1) for reduced-motion users, and it can never shift layout or delay
 * a paint candidate.
 *
 * `js-reveal` is not optional: framer serializes the hidden variant into the
 * server HTML, so without scripting the rule would stay at scaleX(0) and never
 * appear. The noscript rule in layout.tsx forces `transform: none` on this
 * class, which settles it.
 */
export function DrawRule({ className }: { className?: string }) {
  return (
    <m.div
      aria-hidden="true"
      className={className ? `js-reveal ${className}` : "js-reveal"}
      style={{ transformOrigin: "left" }}
      variants={drawLine}
      initial="hidden"
      animate="visible"
    />
  );
}
