import type { MetadataRoute } from "next";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { BLOG_POSTS } from "@/lib/blog-metadata";
import { books } from "@/lib/books";
import { getBookChapterList } from "@/lib/book-reader-content";
import { demos } from "@/lib/demos";
import { getWorkshopSlugs } from "@/lib/workshops";
import { CRAWL_CONTRACT, getCrawlRoute, SITE_ORIGIN } from "@/lib/crawl/contract";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import { OPEN_SOURCE_ARTIFACTS } from "@/lib/open-source/artifacts";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { localizeHref } from "@/lib/i18n/locale";

// Shared frozen content date keeps <lastmod> stable across requests so
// Google actually trusts it, and keeps sitemap, llms.txt, and
// knowledge-graph freshness in lockstep. Bump rule: see the header of
// src/lib/content-freshness.ts (public-content contract).
const BUILD_DATE = new Date(SITE_CONTENT_DATE);

const SITE = SITE_ORIGIN;

type Frequency = "daily" | "weekly" | "monthly" | "yearly";

type Entry = {
  url: string;
  lastModified: Date;
  changeFrequency: Frequency;
  priority: number;
};

function makeEntry(path: string, priority: number, changeFrequency: Frequency, lastMod = BUILD_DATE): Entry {
  return {
    url: `${SITE}${path}`,
    lastModified: lastMod,
    changeFrequency,
    priority,
  };
}

/**
 * Emit an English URL only when the exact public route has reviewed content
 * parity. Both sitemap records carry the same reciprocal language map, while
 * German-only pages remain single entries without an unsupported hreflang.
 */
function expandLocalizedEntries(entries: readonly Entry[]): MetadataRoute.Sitemap {
  return entries.flatMap((entry) => {
    const pathname = new URL(entry.url).pathname;
    if (!contentLocalesForPath(pathname).includes("en")) return [entry];

    const germanUrl = entry.url;
    const englishUrl = `${SITE}${localizeHref(pathname, "en")}`;
    const alternates = {
      languages: {
        de: germanUrl,
        en: englishUrl,
        "x-default": germanUrl,
      },
    };

    return [
      { ...entry, alternates },
      { ...entry, url: englishUrl, alternates },
    ];
  });
}

// Dynamic ":"-patterns are included by explicit contract flag (public-content governance
// stage 3): each enumeration below only emits URLs when its pattern carries
// includeInSitemap: true, so exclusion stays a deliberate contract decision
// instead of a silent filter.
function contractIncludesPattern(pattern: string): boolean {
  return CRAWL_CONTRACT.some((entry) => entry.pattern === pattern && entry.includeInSitemap);
}

// Blog posts are now driven entirely by the manifest in src/lib/blog-metadata.ts.
// This eliminates date drift between sitemap, JSON-LD, and llms.txt.
// The filesystem scan is kept only as a safety check — if a post directory
// exists that is not in the manifest, it is excluded from the sitemap
// (because it likely lacks correct metadata).
function discoverBlogPosts(): { slug: string; date: string }[] {
  // Build manifest-driven list from canonical source
  const manifestPosts = BLOG_POSTS.map((post) => ({
    slug: post.slug,
    date: post.dateModified,
  }));

  try {
    // Sanity check: warn if a blog dir exists that is not in the manifest.
    const blogDir = join(process.cwd(), "src", "app", "blog");
    const entries = readdirSync(blogDir, { withFileTypes: true });
    const fsDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => !name.startsWith("_") && !name.startsWith("[") && !name.startsWith("."));

    const manifestSlugs = new Set(manifestPosts.map((p) => p.slug));
    for (const dir of fsDirs) {
      if (!manifestSlugs.has(dir)) {
        // Dir exists but is not in manifest — skip (redirects are handled in next.config.ts)
        console.warn(`[sitemap] Blog dir "${dir}" has no manifest entry — excluded from sitemap.`);
      }
    }
  } catch {
    // Non-FS environment (tests, edge, etc.) — manifest is the source of truth.
  }

  return manifestPosts;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicPages: Entry[] = CRAWL_CONTRACT
    .filter((entry) => entry.includeInSitemap && !entry.pattern.includes(":"))
    .map((entry) =>
      makeEntry(
        entry.pattern === "/" ? "" : entry.pattern,
        entry.priority ?? 0.6,
        entry.changeFrequency ?? "monthly",
      ),
    );

  // Catalog detail pages and published book chapters are public-indexable with
  // page-level metadata, so every known canonical slug belongs in the sitemap.
  const bookEntries: Entry[] = contractIncludesPattern("/buecher/:slug")
    ? books.map((book) => makeEntry(`/buecher/${book.id}`, 0.65, "monthly"))
    : [];

  const bookChapterEntries: Entry[] = contractIncludesPattern(
    "/buecher/:slug/:chapter",
  )
    ? (
        await Promise.all(
          books.map(async (book) => {
            const chapters = await getBookChapterList(book.id, "de");
            return chapters.map((chapter) =>
              makeEntry(
                `/buecher/${book.id}/${chapter.slug}`,
                0.6,
                "monthly",
                new Date(book.lastReviewed),
              ),
            );
          }),
        )
      ).flat()
    : [];

  const demoEntries: Entry[] = contractIncludesPattern("/demos/:slug")
    ? demos.map((demo) => makeEntry(`/demos/${demo.slug}`, 0.6, "monthly"))
    : [];

  const workshopEntries: Entry[] = contractIncludesPattern("/workshops/:slug")
    ? getWorkshopSlugs().map((slug) => makeEntry(`/workshops/${slug}`, 0.6, "monthly"))
    : [];

  const blogPosts: Entry[] = contractIncludesPattern("/blog/:slug")
    ? discoverBlogPosts().map(({ slug, date }) => ({
        url: `${SITE}/blog/${slug}`,
        lastModified: new Date(date),
        changeFrequency: "monthly" as const,
        priority: 0.65,
      }))
    : [];

  const openSourceArtifactEntries: Entry[] = OPEN_SOURCE_ARTIFACTS
    .filter((artifact) => getCrawlRoute(artifact.href).includeInSitemap)
    .map((artifact) => makeEntry(artifact.href, 0.6, "monthly"));

  return expandLocalizedEntries([
    ...publicPages,
    ...bookEntries,
    ...bookChapterEntries,
    ...demoEntries,
    ...workshopEntries,
    ...blogPosts,
    ...openSourceArtifactEntries,
  ]);
}
