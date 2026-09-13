/**
 * Product analytics entry point.
 *
 * Provider: Vercel Web Analytics + Speed Insights only (cookieless, no
 * persistent user identifiers, country-level geolocation only). No other
 * analytics provider is used.
 *
 * Custom events: the platform sends a closed set of app-authored usage events
 * on the Vercel Web Analytics transport. The decision, the event names and
 * every value an event may carry live in src/lib/analytics/registry.ts; the
 * privacy notice describes them in section 5. In production track() hands the
 * event to src/lib/analytics/dispatch.ts, which drops any event name, key or
 * value the registry does not declare. The transport exists only when the
 * telemetry gate in the root layout mounts Vercel Web Analytics; without it the
 * dispatch is a no-op. In development events are logged via console.debug
 * instead and never dispatched.
 *
 * Safe to call from server components (no-ops on SSR).
 */
import { dispatchTrackedEvent } from "@/lib/analytics/dispatch";

type TrackProps = Record<string, string | number | boolean | undefined>;

export function track(event: string, props?: TrackProps): void {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, props);
    return;
  }
  if (process.env.NODE_ENV !== "production") return;
  dispatchTrackedEvent(event, props);
}

/*
 * RETAINED BUT UNREGISTERED. trackTermOpened, trackExternalBenchmarkVisible,
 * trackDemoOpen, trackDemoFilter, trackDemoEngagedSeconds and
 * trackDemoEmptyState keep their signatures, bodies and call sites, but their
 * event names are not in the registry, so the dispatcher drops them and they
 * never leave the browser in production. They stay observable in development.
 * Why they are not registered: glossary ids are auto-slugged from German
 * labels, dwell seconds is a number, and the filter and empty-state events
 * carry three properties, above the two-property cap.
 */

/** Fired once per <Term> instance when the user opens its definition popover. */
export function trackTermOpened(termId: string): void {
  track("term_opened", { term_id: termId });
}

/** Fired when an <ExternalBenchmarkStrip> becomes visible on screen. */
export function trackExternalBenchmarkVisible(benchmarkId: string): void {
  track("external_benchmark_visible", { benchmark_id: benchmarkId });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Demos gallery (demo analytics)                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export const DEMO_OPEN_SOURCES = [
  "gallery",
  "deeplink",
  "share",
  "next-demo",
] as const;

export type DemoOpenSource = (typeof DEMO_OPEN_SOURCES)[number];

export type DemoCtaTarget =
  | "kurs"
  | "lektion"
  | "next-demo"
  | "pdf-download"
  | "copy-link"
  | "back-to-gallery";

/** Fired when a demo tile opens (gallery) or a detail page mounts (deeplink). */
export function trackDemoOpen(slug: string, source: DemoOpenSource): void {
  track("demo_opened", { slug, source });
}

/** Fired on any CTA click within a demo detail or tile. Registered event. */
export function trackDemoCta(slug: string, target: DemoCtaTarget): void {
  track("demo_cta_clicked", { subject: slug, facet: target });
}

/** Fired whenever the gallery filter state changes. */
export function trackDemoFilter(
  category: string,
  level: string,
  industry: string,
): void {
  track("demo_filter_applied", { category, level, industry });
}

/**
 * Fires at 10, 20, 30, 60 seconds of continuous visibility on a single demo.
 * Signals engagement depth — did the viewer actually watch the autoplay loop?
 */
export function trackDemoEngagedSeconds(slug: string, seconds: number): void {
  track("demo_engaged_seconds", { slug, seconds });
}

/** Fired when the empty-state is rendered after a zero-match filter. */
export function trackDemoEmptyState(
  category: string,
  level: string,
  industry: string,
): void {
  track("demo_empty_state_shown", { category, level, industry });
}
