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

  return (
    <div
      className={`min-w-0 overflow-hidden border border-foreground/60 ${demo.dark ? "dark-section border-border" : "border-border bg-background"}`}
      data-demo-shell
    >
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-current/20 px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em]">
        <span
          className={`inline-flex items-center gap-2 ${demo.dark ? "text-kupfer-light" : "text-brand-orange"}`}
        >
          <span
            className="h-2 w-2 border border-current bg-current"
            aria-hidden="true"
          />
          {shellCopy.instrument}
        </span>
        <span
          className={demo.dark ? "text-background/65" : "text-muted-foreground"}
        >
          {shellCopy.sandbox}
        </span>
      </div>
      <div className="relative p-2 sm:p-3 lg:p-4">
        <div
          className="pointer-events-none absolute right-3 top-3 h-5 w-[2px] bg-brand-orange/70"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-3 top-3 h-[2px] w-5 bg-brand-orange/70"
          aria-hidden="true"
        />
        <DemoLocaleProvider locale={locale}>
          {Comp ? (
            <Comp />
          ) : (
            <div
              role="status"
              aria-live="polite"
              className="py-8 text-center text-sm text-muted-foreground"
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
