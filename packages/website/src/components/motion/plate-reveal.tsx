"use client";

import { useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

/**
 * In-view gate for the CSS-only Typenschild assembly. Sets `data-assembled`
 * once the plate scrolls into view; the plate's own CSS keyframes
 * (`plate-rule-in`, `plate-row-in`, `plate-numeral-in`, all `backwards`)
 * then run exactly once and settle.
 *
 * Deliberately no framer variants on the children: the plate stays a server
 * component and carries no inline opacity for the reduced-motion samplers;
 * the global `prefers-reduced-motion` kill-switch collapses the keyframes to
 * their end state. Note the plate's own no-JS safety only holds together
 * with the layout's `.js-reveal` noscript escape hatch, because the grid
 * wraps cards in framer entrance wrappers that serialize opacity:0.
 */
export function PlateReveal({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <div
      ref={ref}
      className={className}
      data-assembled={inView ? "" : undefined}
    >
      {children}
    </div>
  );
}
