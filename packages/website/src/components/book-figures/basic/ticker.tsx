"use client";

import { useRef } from "react";
import { easeOutCubic, formatInterval, formatN, formatValue } from "@/lib/figures";
import { useStage } from "./use-stage";
import type { TickerSpec } from "./types";

/**
 * One big number that counts up once when it first scrolls into view. The
 * server renders the final number; a hidden copy holds the width so nothing
 * shifts, and screen readers get the final value, never the count.
 */
export function TickerIsland({ spec }: { readonly spec: TickerSpec }) {
  const ref = useRef<HTMLDivElement>(null);
  const snap = useStage(ref);
  const final = formatValue(spec.fmt, spec.value);
  const live = formatValue(spec.fmt, spec.value * easeOutCubic(snap.progress));
  return (
    <div ref={ref} className="bf-ticker">
      <span className="bf-ticker-number">
        <span className="bf-ticker-sizer" aria-hidden="true">
          {final}
        </span>
        <span aria-hidden="true">{live}</span>
        <span className="bf-sr">{final}</span>
      </span>
      <p className="bf-ticker-tail">{spec.tail}</p>
      <p className="bf-ticker-meta">
        {spec.interval ? `95-%-Intervall ${formatInterval(spec.fmt, spec.interval[0], spec.interval[1])}, ` : ""}
        {formatN(spec.n)}
      </p>
    </div>
  );
}
