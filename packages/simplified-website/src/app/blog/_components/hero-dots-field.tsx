"use client";

import { useEffect, useState } from "react";

interface Dot {
  readonly id: string;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly opacity: number;
}

/**
 * Hero background: 70 random copper dots. Generated client-side so SSR/CSR
 * positions agree.
 */
export function HeroDotsField() {
  const [dots, setDots] = useState<readonly Dot[]>([]);

  useEffect(() => {
    const next: Dot[] = [];
    for (let i = 0; i < 70; i++) {
      next.push({
        id: `dot-${i}`,
        cx: Math.random() * 1200,
        cy: Math.random() * 700,
        r: 1 + Math.random() * 2.5,
        opacity: 0.15 + Math.random() * 0.25,
      });
    }
    setDots(next);
  }, []);

  return (
    <svg
      className="hero__field"
      id="hero-dots"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {dots.map((d) => (
        <circle
          key={d.id}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill="#C4431A"
          opacity={d.opacity}
        />
      ))}
    </svg>
  );
}
