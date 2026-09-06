/**
 * Shared plumbing for the public machine-readable JSON surfaces.
 *
 * `/api/books.json` was the first of these. `/api/courses.json` and
 * `/api/workshops.json` reuse this envelope so an agent that learned one
 * surface can read the next without new parsing rules: same freshness fields,
 * same absolute URLs, same open CORS and one-hour cache.
 *
 * Freshness comes from SITE_CONTENT_DATE (src/lib/content-freshness.ts), the
 * single shared source every machine surface derives its date from. No file in
 * this directory may hardcode a date or own content of its own.
 */

import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { STAND_DATE } from "@/lib/content-meta";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo/entity";

/**
 * Response headers every public machine surface sends. Open CORS because the
 * payload is the same content the pages already publish; one hour of shared
 * cache because the catalogs only change with a deploy.
 */
export const MACHINE_SURFACE_HEADERS: Readonly<Record<string, string>> = {
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
};

export interface MachineSurfaceEnvelope {
  /** Stable identifier of the payload shape, versioned in its last segment. */
  readonly schema: string;
  /** Human content vintage, e.g. "Q3 2026". */
  readonly stand: string;
  /** ISO date of the last substantial content change (SITE_CONTENT_DATE). */
  readonly last_updated: string;
  /** Number of records in the surface's main collection. */
  readonly count: number;
  /** Absolute URL of this endpoint. */
  readonly page_url: string;
}

/** Schema identifier for a machine surface, e.g. ".../schema/courses/v1". */
export function machineSchemaId(name: string): string {
  return `${SITE_ORIGIN}/schema/${name}/v1`;
}

export function machineSurfaceEnvelope(options: {
  readonly name: string;
  readonly pagePath: string;
  readonly count: number;
}): MachineSurfaceEnvelope {
  return {
    schema: machineSchemaId(options.name),
    stand: STAND_DATE,
    last_updated: SITE_CONTENT_DATE,
    count: options.count,
    page_url: absoluteUrl(options.pagePath),
  };
}

/** Absolute URL of an in-repo path in the requested locale ("/en" prefixed). */
export function absoluteLocalizedUrl(path: string, locale: Locale): string {
  return absoluteUrl(localizeHref(path, locale));
}
