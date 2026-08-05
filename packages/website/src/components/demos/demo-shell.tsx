"use client";

import { useEffect, useRef } from "react";
import type { Demo } from "@/lib/demos";
import { getDemoComponent } from "./demo-component-registry";
import {
  DEMO_OPEN_SOURCES,
  trackDemoOpen,
  type DemoOpenSource,
} from "@/lib/analytics";
import { EngagementTracker } from "./engagement-tracker";

const DEMO_OPEN_SOURCE_SET = new Set<string>(DEMO_OPEN_SOURCES);

function parseDemoOpenSource(value: string | null | undefined): DemoOpenSource | null {
  return value && DEMO_OPEN_SOURCE_SET.has(value)
    ? (value as DemoOpenSource)
    : null;
}

/**
 * DemoShell — hosts the interactive demo component inside detail page,
 * and derives the optional analytics source in the browser. Keeping query-string
 * access out of the server page preserves static metadata in the initial HTML.
 */
export function DemoShell({ demo }: { demo: Demo }) {
  const Comp = getDemoComponent(demo.slug);
  const trackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const querySource = new URLSearchParams(window.location.search).get("source");
    const origin =
      parseDemoOpenSource(querySource) ??
      "deeplink";
    const trackingKey = `${demo.slug}:${origin}`;
    if (trackedKeyRef.current === trackingKey) return;
    trackedKeyRef.current = trackingKey;
    trackDemoOpen(demo.slug, origin);
  }, [demo.slug]);

  return (
    <div
      className={`border-2 ${demo.dark ? "dark-section border-border" : "border-foreground bg-background"} p-6 shadow-[6px_6px_0_0_var(--color-brand-orange)]`}
    >
      {Comp ? (
        <Comp />
      ) : (
        <div
          role="status"
          aria-live="polite"
          className="py-8 text-center text-sm text-muted-foreground"
        >
          Praxisbeispiel wird geladen…
        </div>
      )}
      <EngagementTracker slug={demo.slug} />
    </div>
  );
}
