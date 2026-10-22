import type { Metadata } from "next";
import localFont from "next/font/local";
import { cache } from "react";
import {
  BuecherContent,
  type ShelfEntry,
  type ShelfHeadline,
} from "./buecher-content";
import { BOOK_PAGE_COPY, getBookDisplay } from "./book-copy";
import { JsonLd, ORG_ID, PERSON_ID, SITE_URL } from "@/lib/seo/json-ld";
import { books, type Book } from "@/lib/books";
import {
  getBookChapterListResolved,
  loadBookManifest,
  resolveLanding,
  type BookManifest,
} from "@/lib/book-reader-content";
import { loadBookFigures } from "@/lib/book-figures";
import { isInsightBook } from "@/lib/book-experience";
import { quantityFor, resolveToken } from "@/lib/figures";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";

const CATALOG_PATH = "/buecher";

// The catalog headings use the site's Figtree Bold file with `swap`, so the
// hero's `ch` width (the advance of `0`) never settles on the fallback face.
// The static Figtree instance is about 16 kB, so no separate route subset is
// kept next to it.
const catalogDisplayFont = localFont({
  src: "../../../public/fonts/figtree-bold-v1.woff2",
  weight: "700",
  style: "normal",
  display: "swap",
  preload: true,
});

interface LocalizedCatalogEntry {
  readonly book: Book;
  readonly manifest: BookManifest;
}

/** Missing locale bundles are excluded; a different language is never used. */
const loadLocalizedCatalog = cache(
  async (locale: Locale): Promise<readonly LocalizedCatalogEntry[]> => {
    const entries = await Promise.all(
      books.map(async (book) => {
        try {
          return {
            book,
            manifest: await loadBookManifest(book.id, locale),
          };
        } catch (error) {
          console.error(`[buecher] book "${book.id}" failed to load (${locale})`, error);
          return null;
        }
      }),
    );
    return entries.filter(
      (entry): entry is LocalizedCatalogEntry => entry !== null,
    );
  },
);

/**
 * The landing's headline (value, share, claim) from the figure JSON, the same
 * calls as the insight branch of [slug]/page.tsx. A book without an insight
 * landing, a headline figure or a claim gets none: its tile shows the field
 * only and its hook falls back to the subtitle.
 */
async function loadShelfHeadline(
  book: Book,
  manifest: BookManifest,
  locale: Locale,
): Promise<ShelfHeadline | null> {
  if (!isInsightBook(book.id)) return null;
  try {
    const landing = await resolveLanding(book.id, manifest, locale);
    const ref = /^([a-z0-9][a-z0-9_-]*)\.([A-Za-z0-9_]+)$/i.exec(
      landing.headlineRef,
    );
    if (!ref || !landing.headlineTail) return null;
    const figures = await loadBookFigures(book.id);
    const spec = figures.lookup((ref[1] as string).toLowerCase());
    if (!spec) return null;
    const key = ref[2] as string;
    const quantity = quantityFor(spec, key);
    if (!quantity) return null;
    return {
      // The token resolver, so the value reads as the chapter numerals of the
      // same locale do ("3,8 %" in German, "3.8%" in English).
      value: resolveToken(spec, key, "value", undefined, locale),
      share: quantity.value / 100,
      tail: landing.headlineTail,
    };
  } catch (error) {
    console.error(`[buecher] headline of book "${book.id}" failed to load (${locale})`, error);
    return null;
  }
}

/** One shelf row: the manifest title, the resolved chapter list and the headline. */
const loadShelf = cache(
  async (locale: Locale): Promise<readonly ShelfEntry[]> => {
    const catalog = await loadLocalizedCatalog(locale);
    const entries = await Promise.all(
      catalog.map(async ({ book, manifest }): Promise<ShelfEntry | null> => {
        try {
          const [chapters, headline] = await Promise.all([
            getBookChapterListResolved(book.id, locale),
            loadShelfHeadline(book, manifest, locale),
          ]);
          return {
            book,
            display: { ...getBookDisplay(book, locale), title: manifest.title },
            chapters,
            headline,
          };
        } catch {
          return null;
        }
      }),
    );
    return entries.filter((entry): entry is ShelfEntry => entry !== null);
  },
);

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const localizedCatalog = await loadLocalizedCatalog(locale);
  const copy = BOOK_PAGE_COPY[locale];
  const localizedPath = localizeHref(CATALOG_PATH, locale);
  const alternates = buildLocaleAlternates(
    CATALOG_PATH,
    contentLocalesForPath(CATALOG_PATH),
  );

  return {
    title: copy.metadata.title,
    description: copy.metadata.description(localizedCatalog.length),
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title: copy.metadata.openGraphTitle(localizedCatalog.length),
      description: copy.metadata.openGraphDescription,
      url: `${SITE_URL}${localizedPath}`,
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metadata.openGraphTitle(localizedCatalog.length),
      description: copy.metadata.openGraphDescription,
    },
  };
}

export default async function BuecherPage() {
  const locale = await getRequestLocale();
  const localizedCatalog = await loadLocalizedCatalog(locale);
  const copy = BOOK_PAGE_COPY[locale];
  const localizedPath = localizeHref(CATALOG_PATH, locale);
  const localizedBooks = localizedCatalog.map(({ book, manifest }) => ({
    book,
    manifest,
    display: getBookDisplay(book, locale),
  }));
  const graph = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}${localizedPath}#collection`,
        name: copy.schema.collectionName,
        description: copy.schema.collectionDescription,
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
        url: `${SITE_URL}${localizedPath}`,
        publisher: { "@id": ORG_ID },
        breadcrumb: { "@id": `${SITE_URL}${localizedPath}#breadcrumb` },
        hasPart: localizedBooks.map(({ book }) => ({
          "@id": `${SITE_URL}${localizeHref(book.readerHref, locale)}#book`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}${localizedPath}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: copy.schema.home,
            item: `${SITE_URL}${localizeHref("/", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.schema.books,
            item: `${SITE_URL}${localizedPath}`,
          },
        ],
      },
      ...localizedBooks.map(({ book, display, manifest }) => ({
        "@type": "Book",
        "@id": `${SITE_URL}${localizeHref(book.readerHref, locale)}#book`,
        name: manifest.title,
        alternateName:
          locale === "de" ? book.subtitle : [book.title, display.subtitle],
        description: display.description,
        author: { "@id": PERSON_ID },
        publisher: { "@id": ORG_ID },
        bookFormat: "https://schema.org/EBook",
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
        isAccessibleForFree: true,
        numberOfPages: book.pageCount,
        educationalLevel: "Beginner",
        learningResourceType: copy.schema.freeReadingEdition,
        url: `${SITE_URL}${localizeHref(book.readerHref, locale)}`,
      })),
    ],
  };
  const { account: accountEnabled } = getRuntimeFeatures();
  const entries = await loadShelf(locale);

  return (
    <>
      <JsonLd data={graph} id="buecher-jsonld" />
      <BuecherContent
        accountEnabled={accountEnabled}
        locale={locale}
        entries={entries}
        headingFontClassName={catalogDisplayFont.className}
      />
    </>
  );
}
