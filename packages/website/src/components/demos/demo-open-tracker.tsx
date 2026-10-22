"use client";

import { useEffect, useRef } from "react";
import {
  DEMO_OPEN_SOURCES,
  trackDemoOpen,
  type DemoOpenSource,
} from "@/lib/analytics";
import { EngagementTracker } from "./engagement-tracker";

const DEMO_OPEN_SOURCE_SET = new Set<string>(DEMO_OPEN_SOURCES);

function parseDemoOpenSource(value: string | null): DemoOpenSource | null {
  return value && DEMO_OPEN_SOURCE_SET.has(value) ? (value as DemoOpenSource) : null;
}

/**
 * Counts one open of a demo page (with its `?source=` when known) and the
 * seconds it stays on screen. Renders nothing visible; reading the query in
 * the browser keeps the server page static.
 */
export function DemoOpenTracker({ slug }: { readonly slug: string }) {
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    const source =
      parseDemoOpenSource(new URLSearchParams(window.location.search).get("source")) ??
      "deeplink";
    const key = `${slug}:${source}`;
    if (trackedRef.current === key) return;
    trackedRef.current = key;
    trackDemoOpen(slug, source);
  }, [slug]);

  return <EngagementTracker slug={slug} />;
}
