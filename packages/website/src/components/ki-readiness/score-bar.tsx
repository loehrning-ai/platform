"use client";

import { m, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

interface ScoreBarProps {
  value: number; // 0-100
  color?: "orange" | "amber" | "sand";
  delay?: number;
}

const colorMap = {
  orange: "bg-brand-orange",
  amber: "bg-brand-amber",
  sand: "bg-brand-sand",
};

function ScoreBarContent({ value, color = "orange", delay = 0 }: ScoreBarProps) {
  // The width animation is NOT a transform, so MotionConfig reducedMotion="user"
  // does not neutralize it — guard it explicitly.
  const reduceMotion = useReducedMotion();
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/30">
      <m.div
        className={cn("h-full rounded-full", colorMap[color])}
        initial={reduceMotion ? false : { width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ delay, duration: 0.8, ease: EASE_OUT_EXPO }}
      />
    </div>
  );
}

export const ScoreBar = withMotionProvider(ScoreBarContent);
