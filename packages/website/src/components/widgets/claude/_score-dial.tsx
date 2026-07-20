"use client";

import { type JSX } from "react";

/**
 * ScoreDial — circular 0-100 gauge, ported from `claude/js/widgets.js`'s
 * `ScoreDial`. Pure SVG, no motion to gate (a static arc, no animation).
 */
export function ScoreDial({ score }: { readonly score: number }): JSX.Element {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const dash = (pct / 100) * c;
  const color =
    pct >= 80 ? "#22c55e" : pct >= 50 ? "var(--color-brand-amber)" : "var(--color-destructive)";

  return (
    <svg
      width={96}
      height={96}
      viewBox="0 0 110 110"
      role="img"
      aria-label={`Score: ${pct} out of 100`}
    >
      <circle cx={55} cy={55} r={r} fill="none" stroke="var(--color-border)" strokeWidth={8} />
      <circle
        cx={55}
        cy={55}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 55 55)"
      />
      <text
        x={55}
        y={52}
        textAnchor="middle"
        fontSize={24}
        fontWeight={700}
        fill="var(--color-foreground)"
      >
        {pct}
      </text>
      <text
        x={55}
        y={70}
        textAnchor="middle"
        fontSize={9}
        fill="var(--color-muted-foreground)"
        letterSpacing={1}
      >
        SCORE
      </text>
    </svg>
  );
}
