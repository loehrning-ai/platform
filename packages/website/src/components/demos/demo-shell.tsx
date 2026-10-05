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
import { EvidenceBadge } from "./evidence-badge";
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

  // Every engine, the console-like ones (a log, a node canvas) included, sits
  // on the same raised Bogen sheet with a 1px ink frame. There is no graphit
  // frame any more: the site has no black grounds.
  //
  // Below sm the frame flattens by one level so the engine's own boxes are
  // the first box: the sheet keeps only its top ink rule (the notes section's
  // 2px Kopflinie closes it, so a bottom rule would double) and uses the full
  // column.
  return (
    <div
      className="min-w-0 overflow-hidden border border-foreground bg-card max-sm:border-x-0 max-sm:border-b-0 max-sm:bg-transparent"
      data-demo-shell
    >
      {/* One header row: the instrument label on the left, the evidence
          line (mode, actions, "Was heißt das?") on the right. When opened,
          the explanation wraps onto its own full-width row below. Below sm
          the evidence line alone fills the row, so it fits one line. */}
      <div
        className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 border-b border-hairline px-4 max-sm:px-0"
        data-demo-shell-header
      >
        <span className="inline-flex min-h-11 items-center gap-2 text-label text-muted-foreground max-sm:hidden">
          <Pictogram name="demo" className="size-4" />
          {shellCopy.instrument}
        </span>
        <EvidenceBadge
          evidenceMode={demo.evidenceMode}
          externalActionMode={demo.externalActionMode}
          locale={locale}
        />
      </div>
      <div className="relative px-0 py-3 sm:p-3 lg:p-4">
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
