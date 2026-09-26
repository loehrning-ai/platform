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
import { Pictogram } from "@/components/werk";

const DEMO_OPEN_SOURCE_SET = new Set<string>(DEMO_OPEN_SOURCES);

function parseDemoOpenSource(
  value: string | null | undefined,
): DemoOpenSource | null {
  return value && DEMO_OPEN_SOURCE_SET.has(value)
    ? (value as DemoOpenSource)
    : null;
}

/**
 * DemoShell hosts the interactive demo component inside detail page,
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
  const shellCopy = DEMOS_PAGE_COPY[locale].shell;

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

  // Light engines sit on a raised Bogen sheet with a 1px ink frame. A dark
  // engine (a terminal, a node canvas) scopes the graphit tokens to its own
  // frame only; the page band around it stays paper.
  return (
    <div
      className={
        demo.dark
          ? "dark-section min-w-0 overflow-hidden border border-border"
          : "min-w-0 overflow-hidden border border-foreground bg-card"
      }
      data-demo-shell
    >
      <div className="flex min-h-11 flex-wrap items-center gap-2 border-b border-hairline px-4 py-2 text-label text-muted-foreground">
        <Pictogram name="demo" className="size-4" />
        {shellCopy.instrument}
      </div>
      <div className="relative p-2 sm:p-3 lg:p-4">
        <DemoLocaleProvider locale={locale}>
          {Comp ? (
            <Comp />
          ) : (
            <div
              role="status"
              aria-live="polite"
              className="py-8 text-center text-body text-muted-foreground"
            >
              {shellCopy.loading}
            </div>
          )}
          <EngagementTracker slug={demo.slug} />
        </DemoLocaleProvider>
      </div>
    </div>
  );
}
