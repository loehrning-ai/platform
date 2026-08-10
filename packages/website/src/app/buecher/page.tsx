import type { Metadata } from "next";
import { cache } from "react";
import { BuecherContent } from "./buecher-content";
import { BOOK_PAGE_COPY, getBookDisplay } from "./book-copy";
import { JsonLd, ORG_ID, PERSON_ID, SITE_URL } from "@/lib/seo/json-ld";
import { books, type Book } from "@/lib/books";
import {
  loadBookManifest,
  type BookManifest,
} from "@/lib/book-reader-content";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { MotionProvider } from "@/components/motion-provider";

const CATALOG_PATH = "/buecher";

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
        } catch {
          return null;
        }
      }),
    );
    return entries.filter(
      (entry): entry is LocalizedCatalogEntry => entry !== null,
    );
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

  return (
    <>
      <JsonLd data={graph} id="buecher-jsonld" />
      <MotionProvider>
        <BuecherContent
          accountEnabled={accountEnabled}
          locale={locale}
          catalogBooks={localizedCatalog.map(({ book }) => book)}
        />
      </MotionProvider>
    </>
  );
}
