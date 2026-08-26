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
import { DemoLocaleProvider } from "./demo-locale";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import type { Locale } from "@/lib/i18n/locale";

const DEMO_OPEN_SOURCE_SET = new Set<string>(DEMO_OPEN_SOURCES);

function parseDemoOpenSource(
  value: string | null | undefined,
): DemoOpenSource | null {
  return value && DEMO_OPEN_SOURCE_SET.has(value)
    ? (value as DemoOpenSource)
    : null;
}

/**
 * DemoShell — hosts the interactive demo component inside detail page,
 * and derives the optional analytics source in the browser. Keeping query-string
 * access out of the server page preserves static metadata in the initial HTML.
 */
export function DemoShell({
  demo,
  locale = "de",
}: {
  demo: Demo;
  locale?: Locale;
}) {
  const Comp = getDemoComponent(demo.slug);
  const trackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const querySource = new URLSearchParams(window.location.search).get(
      "source",
    );
    const origin = parseDemoOpenSource(querySource) ?? "deeplink";
    const trackingKey = `${demo.slug}:${origin}`;
    if (trackedKeyRef.current === trackingKey) return;
    trackedKeyRef.current = trackingKey;
    trackDemoOpen(demo.slug, origin);
  }, [demo.slug]);

  return (
    <div
      className={`min-w-0 overflow-hidden border border-t-[3px] border-t-brand-orange ${demo.dark ? "dark-section border-border" : "border-border bg-background"} p-2 sm:p-3 lg:p-4`}
    >
      <DemoLocaleProvider locale={locale}>
        {Comp ? (
          <Comp />
        ) : (
          <div
            role="status"
            aria-live="polite"
            className="py-8 text-center text-sm text-muted-foreground"
          >
            {DEMOS_PAGE_COPY[locale].shell.loading}
          </div>
        )}
        <EngagementTracker slug={demo.slug} />
      </DemoLocaleProvider>
    </div>
  );
}
