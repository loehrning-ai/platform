/**
 * Lightweight analytics dispatcher.
 *
 * Analytics provider: Vercel Web Analytics + Speed Insights only (cookieless,
 * no persistent user identifiers, session hash discarded after 24h, country-level
 * geolocation only). No Plausible, no PostHog, no other analytics provider.
 *
 * Custom event helpers below are DEV-ONLY by design: they fire via
 * console.debug in development so events stay observable while building,
 * and are deliberate no-ops in production. There is intentionally no custom
 * event transport — wiring one would change the site's privacy posture and
 * requires a deliberate decision (and privacy-notice update) first.
 *
 * Safe to call from server components (no-ops on SSR).
 */

type TrackProps = Record<string, string | number | boolean | undefined>;

export function track(event: string, props?: TrackProps): void {
  if (typeof window === "undefined") return;

  // Dev-only observability; production dispatches nowhere (see header).
  if (process.env.NODE_ENV !== "development") return;
  // eslint-disable-next-line no-console
  console.debug("[analytics]", event, props);
}

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

/** Fired on any CTA click within a demo detail or tile. */
export function trackDemoCta(slug: string, target: DemoCtaTarget): void {
  track("demo_cta_clicked", { slug, target });
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
