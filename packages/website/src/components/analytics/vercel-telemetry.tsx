"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { sanitizeTelemetryUrl } from "@/lib/analytics/url-policy";

/**
 * Applies the telemetry URL policy to every pageview, custom event and
 * web-vital sample before either SDK sends it. An event whose URL cannot be
 * sanitised is not sent at all.
 */
export function withSanitizedTelemetryUrl<T extends { readonly url: string }>(
  event: T,
): T | null {
  const url = sanitizeTelemetryUrl(event.url);
  return url === null ? null : { ...event, url };
}

/** Vercel Web Analytics and Speed Insights, mounted only behind the layout gate. */
export function VercelTelemetry() {
  return (
    <>
      <Analytics beforeSend={withSanitizedTelemetryUrl} />
      <SpeedInsights beforeSend={withSanitizedTelemetryUrl} />
    </>
  );
}
