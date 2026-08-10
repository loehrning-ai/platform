"use client";

import { m, useReducedMotion } from "framer-motion";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

interface PulsingDotProps {
  readonly cx: number;
  readonly cy: number;
  readonly r?: number;
  readonly color?: string;
  readonly delay?: number;
  readonly immediate?: boolean;
}

function PulsingDotContent({
  cx,
  cy,
  r = 4,
  color = "var(--color-brand-orange)",
  delay = 0,
  immediate = false,
}: PulsingDotProps) {
  // Infinite r/opacity loop bypasses MotionConfig reducedMotion="user"
  // (only transform/layout values are neutralized) — render static instead.
  const prefersReduced = useReducedMotion();
  if (immediate || prefersReduced) {
    return <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.8} />;
  }

  // Animate r directly instead of scale (scale doesn't work reliably on SVG circles)
  return (
    <>
      <m.circle
        cx={cx}
        cy={cy}
        fill={color}
        initial={{ r: 0, opacity: 0 }}
        animate={{
          r: [r, r * 1.2, r],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          delay,
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Subtle glow ring */}
      <m.circle
        cx={cx}
        cy={cy}
        r={r * 2}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{
          delay: delay + 0.3,
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
}

export const PulsingDot = withMotionProvider(PulsingDotContent);
