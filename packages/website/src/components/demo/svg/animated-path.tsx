"use client";

import { m } from "framer-motion";
import { svgDrawOn } from "@/lib/animations";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

interface AnimatedPathProps {
  readonly d: string;
  readonly delay?: number;
  readonly duration?: number;
  readonly color?: string;
  readonly strokeWidth?: number;
  readonly immediate?: boolean;
  readonly glow?: boolean;
  readonly className?: string;
}

function AnimatedPathContent({
  d,
  delay = 0,
  duration = 1.2,
  color = "currentColor",
  strokeWidth = 1.5,
  immediate = false,
  glow = false,
  className,
}: AnimatedPathProps) {
  const glowFilter = glow ? "drop-shadow(0 0 6px currentColor)" : undefined;

  if (immediate) {
    return (
      <path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        style={{ filter: glowFilter }}
        className={className}
      />
    );
  }

  return (
    <m.path
      d={d}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      variants={svgDrawOn}
      initial="hidden"
      animate="visible"
      custom={delay / 0.2}
      style={{ filter: glowFilter }}
      transition={{
        delay,
        duration,
      }}
      className={className}
    />
  );
}

export const AnimatedPath = withMotionProvider(AnimatedPathContent);
