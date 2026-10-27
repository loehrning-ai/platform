export const runtime = "nodejs";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { books, getBookById } from "@/lib/books";
import {
  getBookChapterList,
  loadBookChapter,
  loadBookManifest,
  getChapterNeighbours,
} from "@/lib/book-reader-content";
import { ChapterReader } from "@/components/book-reader/chapter-reader";
import { renderChapterSegments } from "@/components/book-reader/chapter-markdown";
import { DirectiveError, hasDirectives } from "@/lib/book-directives";
import { FigureLoadError } from "@/lib/book-figures";
import { TokenError } from "@/lib/figures";
import { OpenWithYourAiRegion } from "@/components/course/open-with-your-ai-region";
import { isInsightBook } from "@/lib/book-experience";
import { ResourceContextBanner } from "@/components/learning/resource-context-banner";
import { bookUri } from "@/lib/mcp/uris";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { SITE_URL } from "@/lib/seo/json-ld";
import { defaultSocialImage } from "@/lib/seo/page-metadata";
import { getBookDisplay } from "../../book-copy";

interface Params {
  readonly params: Promise<{
    readonly slug: string;
    readonly chapter: string;
  }>;
}

/** Pre-build all slug + chapter combinations at build time. */
export async function generateStaticParams() {
  const results: { slug: string; chapter: string }[] = [];
  for (const book of books) {
    try {
      const chapters = await getBookChapterList(book.id, "de");
      for (const ch of chapters) {
        results.push({ slug: book.id, chapter: ch.slug });
      }
    } catch {
      // If manifest doesn't exist yet, skip (shouldn't happen in production)
    }
  }
  return results;
}

// Fixed, curated slug+chapter pairs — a combination outside
// generateStaticParams must hard-404, not fall through to a dynamically
// rendered notFound() page that some hosts cache/serve with status 200.
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const [{ slug, chapter }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  const book = getBookById(slug);
  if (!book) {
    return {
      title: locale === "de" ? "Kapitel nicht gefunden" : "Chapter not found",
      robots: { index: false, follow: false },
    };
  }

  try {
    const [loaded, manifest] = await Promise.all([
      loadBookChapter(slug, chapter, locale),
      loadBookManifest(slug, locale),
    ]);
    const display = getBookDisplay(book, locale);
    const canonicalPath = `/buecher/${slug}/${chapter}`;
    const localizedPath = localizeHref(canonicalPath, locale);
    const alternates = buildLocaleAlternates(
      canonicalPath,
      contentLocalesForPath(canonicalPath),
    );
    const title = `${loaded.meta.title} · ${manifest.title}`;
    const description =
      loaded.meta.description ??
      (locale === "de"
        ? `${display.subtitle}. Kapitel der offenen HTML-Lesefassung.`
        : `${display.subtitle}. Chapter from the open English HTML reading edition.`);

    return {
      title,
      description,
      robots: { index: true, follow: true },
      alternates: { ...alternates, canonical: localizedPath },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}${localizedPath}`,
        locale: locale === "de" ? "de_DE" : "en_GB",
        alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
        type: "article",
        images: [defaultSocialImage(locale)],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [defaultSocialImage(locale)],
      },
    };
  } catch {
    return {
      title: locale === "de" ? "Kapitel nicht gefunden" : "Chapter not found",
      robots: { index: false, follow: false },
    };
  }
}

export default async function ChapterPage({ params }: Params) {
  const [{ slug, chapter }, locale] = await Promise.all([
    params,
    getRequestLocale(),
  ]);
  const book = getBookById(slug);
  if (!book) notFound();

  const readerContent = await Promise.all([
      loadBookChapter(slug, chapter, locale),
      getChapterNeighbours(slug, chapter, locale),
      getBookChapterList(slug, locale),
    ]).catch((error: unknown) => {
      // A broken token, directive or figure file is an authoring error: fail the build, never a quiet 404.
      if (
        error instanceof TokenError ||
        error instanceof FigureLoadError ||
        error instanceof DirectiveError
      ) {
        throw error;
      }
      return notFound();
    });

  const [loaded, neighbours, allChapters] = readerContent;
  const display = getBookDisplay(book, locale);

  // Figures: cut the chapter at its figure lines and build the islands. The
  // builders (and with them every island chunk) are imported only here, so a
  // chapter without figures ships none of that code.
  const segments = hasDirectives(loaded.rawMarkdown)
    ? renderChapterSegments({ rawMarkdown: loaded.rawMarkdown, locale })
    : undefined;
  const figureBlocks = segments?.some((segment) => segment.kind === "directive")
    ? await (await import("@/components/book-reader/figures/build-blocks")).buildChapterFigureBlocks(book.id, locale, segments)
    : undefined;

  return (
    <>
      {/* An insight book is a data book: no course-funnel banner above it. */}
      {locale === "de" && !isInsightBook(book.id) ? (
        <ResourceContextBanner nodeId={`book:${book.id}`} />
      ) : null}
      <ChapterReader
        book={book}
        chapter={loaded}
        neighbours={neighbours}
        allChapters={allChapters}
        locale={locale}
        bookTitle={display.title}
        relatedResourceLabel={display.relatedResourceLabel}
        segments={segments}
        figureBlocks={figureBlocks}
      />
      <OpenWithYourAiRegion
        kind="chapter"
        contextTitle={`${display.title}: ${loaded.meta.title}`}
        resources={[
          {
            uri: bookUri(book.id, loaded.meta.slug, locale),
            title: loaded.meta.title,
          },
        ]}
        locale={locale}
      />
    </>
  );
}
