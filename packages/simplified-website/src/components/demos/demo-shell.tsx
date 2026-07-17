"use client";

import { useEffect, useRef } from "react";
import type { Demo } from "@/lib/demos";
import { getDemoComponent } from "./demo-component-registry";
import { trackDemoOpen } from "@/lib/analytics";
import { EngagementTracker } from "./engagement-tracker";

/**
 * DemoShell — hosts the interactive demo component inside detail page,
 * fires the `deeplink` analytics event on mount when no source is passed.
 */
export function DemoShell({ demo, source }: { demo: Demo; source?: string }) {
  const Comp = getDemoComponent(demo.slug);
  const trackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const origin = (source ?? "deeplink") as
      | "gallery"
      | "deeplink"
      | "product-page"
      | "homepage"
      | "share"
      | "nav";
    const trackingKey = `${demo.slug}:${origin}`;
    if (trackedKeyRef.current === trackingKey) return;
    trackedKeyRef.current = trackingKey;
    trackDemoOpen(demo.slug, origin);
  }, [demo.slug, source]);

  return (
    <div
      className={`border-2 ${demo.dark ? "border-foreground bg-foreground" : "border-foreground bg-background"} p-6 shadow-[6px_6px_0_0_var(--color-brand-orange)]`}
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
