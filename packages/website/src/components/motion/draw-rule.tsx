"use client";

import { m } from "framer-motion";
import { drawLine } from "@/lib/animations";

/**
 * A Kupfer accent rule that draws itself in from the left on mount. Transform
 * only (scaleX), so `MotionConfig reducedMotion="user"` renders it settled at
 * scaleX(1) for reduced-motion users, and it can never shift layout or delay
 * a paint candidate.
 */
export function DrawRule({ className }: { className?: string }) {
  return (
    <m.div
      aria-hidden="true"
      className={className}
      style={{ transformOrigin: "left" }}
      variants={drawLine}
      initial="hidden"
      animate="visible"
    />
  );
}
