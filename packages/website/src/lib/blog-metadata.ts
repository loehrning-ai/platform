/**
 * Canonical blog-metadata manifest.
 *
 * Single source of truth consumed by:
 *   - src/app/sitemap.ts      (slug + dateModified)
 *   - src/app/blog/page.tsx   (reviewed German and English display copy)
 *   - per-post BlogPosting JSON-LD (datePublished + dateModified)
 *   - per-post OpenGraph article:published_time / article:modified_time
 *   - src/app/llms.txt/route.ts (localized titles + slug)
 *
 * Add every new post here BEFORE creating the route directory.
 * Retire posts by removing the entry (add a next.config.ts redirect first).
 *
 * Freshness link (public-content contract): per-post dates stay honest and are
 * NOT overwritten by the shared site date. The divergence guard in
 * scripts/content-lint.mjs fails when any dateModified here is newer than
 * SITE_CONTENT_DATE in src/lib/content-freshness.ts, so bump that constant
 * in the same commit as any post update.
 */

export interface BlogPost {
  readonly slug: string;
  readonly titleDe: string;
  readonly titleEn: string;
  readonly summary: string;
  readonly summaryEn: string;
  readonly datePublished: string; // ISO 8601 YYYY-MM-DD
  readonly dateModified: string; // ISO 8601 YYYY-MM-DD
  readonly tags: readonly string[];
  readonly tagsEn: readonly string[];
  readonly readingTimeMin: number;
  /** Nº label shown in OG images and index (Nº 01, Nº 02, …). */
  readonly postNumber: number;
}

export const BLOG_POSTS: readonly BlogPost[] = [
  {
    slug: "eu-ai-act-grundlagen",
    titleDe: "Der EU AI Act: was er bedeutet, wenn du keine Juristin bist",
    titleEn: "The EU AI Act: what it means if you are not a lawyer",
    summary:
      "Was der EU AI Act regelt, was schon gilt und was ab 2. August 2026 dazukommt, nach dem Stand zum AI Omnibus (Juli 2026).",
    summaryEn:
      "What the EU AI Act regulates, what already applies and what changes on 2 August 2026, as of the AI Omnibus (July 2026).",
    datePublished: "2026-07-16",
    dateModified: "2026-07-28",
    tags: ["EU AI Act", "Rechtliche Grundlagen"],
    tagsEn: ["EU AI Act", "Legal foundations"],
    readingTimeMin: 11,
    postNumber: 1,
  },
  {
    slug: "ki-in-der-ausbildung",
    titleDe: "KI in der Ausbildung: Fragen für JAV und Betriebsrat",
    titleEn:
      "AI in apprenticeships: questions for youth representatives and works councils",
    summary:
      "Was JAV und Betriebsrat tun können, wenn KI in die Ausbildung kommt, was für Berichtsheft und Prüfung gilt und welche Fragen vor dem Start geklärt sein sollten. Mit Fragenliste zum Drucken unter CC BY 4.0 und Primärquellen.",
    summaryEn:
      "What youth representatives and works councils can do when AI enters apprenticeship training, what applies to the training record and exams, and which questions to settle before launch. With a printable question list under CC BY 4.0 and primary sources.",
    datePublished: "2026-09-27",
    dateModified: "2026-09-27",
    tags: ["KI in der Ausbildung", "Mitbestimmung"],
    tagsEn: ["AI in apprenticeships", "Co-determination"],
    // German page: about 3,800 rendered words with the sheet, 16.5 minutes
    // at 230 words per minute (smoke.test.tsx checks the band).
    readingTimeMin: 17,
    postNumber: 2,
  },
];

/** Most recent dateModified across all posts, for "Zuletzt aktualisiert" display. */
export const BLOG_LAST_MODIFIED: string = BLOG_POSTS.reduce(
  (latest, post) => (post.dateModified > latest ? post.dateModified : latest),
  "2000-01-01",
);

/**
 * Two-digit Nº label ("01", "02", …) for a post slug, from the manifest.
 * Used by per-post opengraph-image.tsx and hero bylines so the numbers
 * cannot drift from the manifest. Throws on an unknown slug so a renamed
 * or retired post fails loudly at build/test time instead of rendering
 * a stale number.
 */
export function getPostNumberLabel(slug: string): string {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) {
    throw new Error(`getPostNumberLabel: unknown blog slug "${slug}"`);
  }
  return String(post.postNumber).padStart(2, "0");
}
