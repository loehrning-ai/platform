"use client";

import { useEffect, useRef, useState } from "react";

// ─── AnimPath (plan 012 stage 4) ───────────────────────────────────────
//
// Typed port of `src/v8/shared.js`'s `AnimPath`: measures the path's own
// length on mount/`d`-change, then animates `stroke-dashoffset` from that
// length to 0 via the `drawPath` @keyframes rule (ported in ds-v8-scope.css).

export interface AnimPathProps {
  readonly d: string;
  readonly stroke?: string;
  readonly width?: number;
  readonly dur?: number;
  readonly delay?: number;
  readonly fill?: string;
  readonly opacity?: number;
}

export function AnimPath({
  d,
  stroke = "currentColor",
  width = 2,
  dur = 1.2,
  delay = 0,
  fill = "none",
  opacity = 1,
}: AnimPathProps) {
  const ref = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);

  useEffect(() => {
    // jsdom (used by this repo's component tests) doesn't implement
    // SVGPathElement.getTotalLength — guard so tests render instead of
    // throwing; every real browser implements it.
    if (ref.current && typeof ref.current.getTotalLength === "function") {
      setLen(ref.current.getTotalLength());
    }
  }, [d]);

  return (
    <path
      ref={ref}
      d={d}
      stroke={stroke}
      strokeWidth={width}
      fill={fill}
      strokeDasharray={len}
      strokeDashoffset={len}
      opacity={opacity}
      style={{ animation: `drawPath ${dur}s ${delay}s cubic-bezier(.6,.05,.2,1) forwards` }}
    />
  );
}
