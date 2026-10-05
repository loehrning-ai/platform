"use client";

import type { JSX } from "react";
import { m } from "framer-motion";
import { useCalmMotion } from "./use-calm-motion";

const COLORS = ["#2747b5", "#205b46", "#b73a15", "#a9ddfc", "#ddf45a", "#ffb8c8"] as const;
const PIECES = 16;

/**
 * A tasteful, finite celebration: sixteen paper confetti pieces fly out once
 * from the centre of the parent and fade. Decorative only (aria-hidden). It
 * renders nothing under reduced motion or Save-Data; the caller always shows
 * the static completion state as well.
 */
export function CelebrationBurst({
  play,
  radius = 120,
}: {
  /** Mount with true to play once. */
  readonly play: boolean;
  readonly radius?: number;
}): JSX.Element | null {
  const calm = useCalmMotion();
  if (!play || calm) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
      {Array.from({ length: PIECES }, (_, index) => {
        const angle = (index / PIECES) * Math.PI * 2 + (index % 2 ? 0.2 : 0);
        const distance = radius * (index % 3 === 0 ? 1 : index % 3 === 1 ? 0.78 : 0.6);
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const square = index % 4 === 0;
        return (
          <m.span
            key={index}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
            animate={{ x, y: y + 18, opacity: 0, scale: 1, rotate: square ? 180 : 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: (index % 4) * 0.03 }}
            className={square ? "absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-[3px]" : "absolute left-1/2 top-1/2 h-2 w-2 rounded-full"}
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          />
        );
      })}
    </span>
  );
}
