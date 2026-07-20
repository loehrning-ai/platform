/** Canonical data-freshness constants for educational content.
 *  Import from here instead of methodology-copy when you need dates only.
 *
 *  LAST_UPDATED is derived from SITE_CONTENT_DATE (content-freshness.ts),
 *  the single shared freshness source, so the footer and the machine
 *  surfaces (sitemap, llms.txt, knowledge-graph) cannot disagree.
 */
import { SITE_CONTENT_DATE } from "./content-freshness";

export const STAND_DATE = "Q3 2026";
export const LAST_UPDATED = SITE_CONTENT_DATE;
export const CONTENT_VERSION = "v1.1";
