"use client";

import { useEffect, useRef } from "react";
import { m } from "framer-motion";
import { EASE_OUT_EXPO } from "@/lib/animations";
import type { ExternalBenchmark } from "@/lib/external-benchmarks";
import { trackExternalBenchmarkVisible } from "@/lib/analytics";

export interface ExternalBenchmarkStripProps {
  items: readonly ExternalBenchmark[];
  /** Kicker label above the strip. Defaults to a neutral German framing. */
  kicker?: string;
  /** testid hook */
  testId?: string;
}

/**
 * Compact strip of externally-published benchmarks. Visually muted (no
 * Kupfer accent) so readers distinguish external citations from our own
 * Kupfer-coded numbers. Fires one analytics event per item when the
 * strip scrolls into view.
 */
export function ExternalBenchmarkStrip({
  items,
  kicker = "Was unabhängige Studien dazu sagen",
  testId,
}: ExternalBenchmarkStripProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (typeof window === "undefined") return;
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            for (const item of items) {
              try {
                trackExternalBenchmarkVisible(item.id);
              } catch {
                // ignore analytics failure
              }
            }
            io.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [items]);

  return (
    <div
      ref={ref}
      data-testid={testId}
      className="border-t border-border/60 bg-card/30 py-6"
    >
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
        {kicker}
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {items.map((item, i) => (
          <m.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.5,
              delay: 0.08 * i,
              ease: EASE_OUT_EXPO,
            }}
            className={
              i < items.length - 1
                ? "js-reveal sm:border-r sm:border-border/40 sm:pr-6"
                : "js-reveal"
            }
          >
            <p className="font-mono text-2xl font-bold text-foreground">
              {item.value}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.plain}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {item.publisher} · {item.year}
              {item.sampleSize ? ` · ${item.sampleSize}` : ""}
            </p>
          </m.div>
        ))}
      </div>
    </div>
  );
}
