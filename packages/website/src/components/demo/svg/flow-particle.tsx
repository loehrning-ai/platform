"use client";

import { m, useReducedMotion } from "framer-motion";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

interface FlowParticleProps {
  /** SVG path d-string (must be "M x y C cx1 cy1, cx2 cy2, ex ey" format) */
  readonly path: string;
  readonly duration?: number;
  readonly delay?: number;
  readonly color?: string;
  readonly r?: number;
  readonly immediate?: boolean;
}

/** Parse "M x y C cx1 cy1, cx2 cy2, ex ey" into 4 control points */
function parseCubicBezier(d: string): [number, number][] | null {
  const nums = d.match(/-?\d+\.?\d*/g);
  if (!nums || nums.length < 8) return null;
  const n = nums.map(Number);
  return [
    [n[0], n[1]], // start
    [n[2], n[3]], // cp1
    [n[4], n[5]], // cp2
    [n[6], n[7]], // end
  ];
}

/** Sample N points along a cubic bezier curve */
function sampleBezier(
  points: [number, number][],
  samples = 24,
): { xs: number[]; ys: number[] } {
  const [p0, p1, p2, p3] = points;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    xs.push(mt ** 3 * p0[0] + 3 * mt ** 2 * t * p1[0] + 3 * mt * t ** 2 * p2[0] + t ** 3 * p3[0]);
    ys.push(mt ** 3 * p0[1] + 3 * mt ** 2 * t * p1[1] + 3 * mt * t ** 2 * p2[1] + t ** 3 * p3[1]);
  }
  return { xs, ys };
}

/**
 * A circle that animates along an SVG cubic bezier path.
 * Uses Framer Motion cx/cy keyframes (works natively on SVG elements).
 */
function FlowParticleContent({
  path,
  duration = 2.5,
  delay = 0,
  color = "var(--color-brand-orange)",
  r = 3,
  immediate = false,
}: FlowParticleProps) {
  // Infinite cx/cy/opacity loop bypasses MotionConfig reducedMotion="user"
  // (only transform/layout values are neutralized) — render static instead.
  const prefersReduced = useReducedMotion();
  const points = parseCubicBezier(path);
  if (!points) return null;

  const { xs, ys } = sampleBezier(points);
  const midIdx = Math.floor(xs.length / 2);

  if (immediate || prefersReduced) {
    return <circle cx={xs[midIdx]} cy={ys[midIdx]} r={r} fill={color} opacity={0.6} />;
  }

  return (
    <m.circle
      r={r}
      fill={color}
      initial={{ cx: xs[0], cy: ys[0], opacity: 0 }}
      animate={{
        cx: xs,
        cy: ys,
        opacity: [0, 0.7, 0],
      }}
      transition={{
        delay,
        duration,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

export const FlowParticle = withMotionProvider(FlowParticleContent);
