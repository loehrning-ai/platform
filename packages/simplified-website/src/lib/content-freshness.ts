/**
 * Single shared freshness source for the machine-readable surfaces.
 *
 * SITE_CONTENT_DATE is the date (UTC, format YYYY-MM-DD) of the last
 * substantial content change on the site. Every machine freshness surface
 * derives its date from this one constant so the surfaces cannot disagree:
 *
 *   - src/app/sitemap.ts                          lastmod of static pages
 *   - src/app/llms.txt/route.ts                   Veröffentlichungsdatum line
 *   - src/app/api/knowledge-graph.json/route.ts   generatedAt
 *
 * The blog manifest (src/lib/blog-metadata.ts) is the fourth machine
 * surface. Its per-post dateModified values stay honest and are NOT
 * overwritten by this constant; instead the divergence guard in
 * scripts/content-lint.mjs fails when any post dateModified is newer than
 * SITE_CONTENT_DATE, which ties the manifest to the same source in code.
 *
 * Bump rule: set the value to today (YYYY-MM-DD) in the same commit as any
 * substantial content change (new or rewritten page, new blog post, blog
 * post update, catalog change). Minor edits (typos, code comments, styling)
 * do not need a bump. scripts/content-lint.mjs fails when a surface
 * hardcodes its own date and warns when a surface file changes in the
 * working tree without this file changing.
 *
 * Keep this module dependency-light: no imports. llms.txt is entity-driven
 * and must not gain a dependency on the crawl contract through this file.
 */
export const SITE_CONTENT_DATE = "2026-07-16";
