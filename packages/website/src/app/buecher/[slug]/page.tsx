export const runtime = "nodejs";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChevronRight, Lock } from "lucide-react";
import { books, getBookById, getBookCover } from "@/lib/books";
import {
  getBookChapterList,
  loadBookManifest,
} from "@/lib/book-reader-content";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd, ORG_ID, PERSON_ID, SITE_URL } from "@/lib/seo/json-ld";
import { BOOK_PAGE_COPY, getBookDisplay } from "../book-copy";

interface Params {
  readonly params: Promise<{ readonly slug: string }>;
}

export function generateStaticParams() {
  return books.map((book) => ({ slug: book.id }));
}

// The catalog is a fixed, curated list. Held and unknown slugs must not become
// dynamic public pages.
export const dynamicParams = false;

function formatReviewDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const book = getBookById(slug);
  if (!book) {
    return {
      title: locale === "de" ? "Buch nicht gefunden" : "Book not found",
      robots: { index: false, follow: false },
    };
  }

  let manifest;
  try {
    manifest = await loadBookManifest(slug, locale);
  } catch {
    return {
      title: locale === "de" ? "Buch nicht gefunden" : "Book not found",
      robots: { index: false, follow: false },
    };
  }

  const copy = BOOK_PAGE_COPY[locale];
  const display = getBookDisplay(book, locale);
  const localizedPath = localizeHref(book.readerHref, locale);
  const alternates = buildLocaleAlternates(
    book.readerHref,
    contentLocalesForPath(book.readerHref),
  );
  const title = `${manifest.title} · ${copy.metadata.detailTitleSuffix}`;
  const description = copy.metadata.detailDescription(display);

  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title: manifest.title,
      description,
      url: `${SITE_URL}${localizedPath}`,
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
      type: "book",
    },
    twitter: {
      card: "summary_large_image",
      title: display.title,
      description,
    },
  };
}

export default async function BookOverviewPage({ params }: Params) {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const book = getBookById(slug);
  if (!book) notFound();

  const [manifest, chapters] = await Promise.all([
    loadBookManifest(slug, locale),
    getBookChapterList(slug, locale),
  ]).catch(() => notFound());

  const { account: accountEnabled } = getRuntimeFeatures();
  const copy = BOOK_PAGE_COPY[locale];
  const display = {
    ...getBookDisplay(book, locale),
    title: manifest.title,
    adaptationNote: manifest.adaptationNote ?? "",
  };
  const catalogHref = localizeHref("/buecher", locale);
  const detailHref = localizeHref(book.readerHref, locale);
  const relatedHref = localizeHref(book.relatedResourceHref, locale);
  const pdfLoginHref = book.pdfPath
    ? localizeHref(`/login?next=${encodeURIComponent(book.pdfPath)}`, locale)
    : null;
  const languageTag = locale === "de" ? "de-DE" : "en-GB";
  const graph = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}${detailHref}#breadcrumb`,
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
            item: `${SITE_URL}${catalogHref}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: display.title,
            item: `${SITE_URL}${detailHref}`,
          },
        ],
      },
      {
        "@type": "Book",
        "@id": `${SITE_URL}${detailHref}#book`,
        name: manifest.title,
        alternateName:
          locale === "de" ? book.subtitle : [book.title, display.subtitle],
        description: display.description,
        author: { "@id": PERSON_ID },
        publisher: { "@id": ORG_ID },
        bookFormat: "https://schema.org/EBook",
        inLanguage: languageTag,
        isAccessibleForFree: true,
        numberOfPages: book.pageCount,
        url: `${SITE_URL}${detailHref}`,
        mainEntityOfPage: `${SITE_URL}${detailHref}`,
        breadcrumb: { "@id": `${SITE_URL}${detailHref}#breadcrumb` },
        hasPart: chapters.map((chapter, index) => ({
          "@type": "Chapter",
          position: index + 1,
          name: chapter.title,
          inLanguage: languageTag,
          url: `${SITE_URL}${localizeHref(`/buecher/${book.id}/${chapter.slug}`, locale)}`,
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={graph} id="book-detail-jsonld" />

      <aside
        className="border-b border-border bg-card/45"
        aria-label={copy.detail.context}
      >
        <div className="mx-auto flex max-w-7xl min-w-0 flex-col gap-1 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:gap-3">
          <span className="break-words font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-brand-orange">
            {copy.detail.context}
          </span>
          <span
            className="hidden text-muted-foreground lg:inline"
            aria-hidden="true"
          >
            ·
          </span>
          <span className="min-w-0 break-words text-sm text-muted-foreground">
            {copy.detail.contextBody}
          </span>
        </div>
      </aside>

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:pb-28">
        <header className="grid min-w-0 gap-8 border-b border-border pb-12 lg:grid-cols-[minmax(13rem,0.62fr)_minmax(0,1.8fr)] lg:gap-14 lg:pb-16">
          <div className="relative flex min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-[linear-gradient(145deg,var(--color-card-hover),var(--color-background))] p-6 sm:p-8">
            <Image
              src={getBookCover(book)}
              alt={copy.detail.coverAlt(display.title)}
              width={778}
              height={1100}
              priority
              sizes="(max-width: 640px) 230px, (max-width: 1024px) 280px, 300px"
              className="h-auto w-[230px] max-w-full rounded-lg border border-border bg-card shadow-card sm:w-[280px] lg:w-[300px]"
            />
          </div>

          <div className="min-w-0 lg:self-center">
            <p className="break-words font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-orange">
              {copy.detail.kicker}
            </p>
            <h1 className="mt-5 max-w-4xl break-words text-4xl font-bold leading-[0.96] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
              {display.title}
            </h1>
            <p className="mt-4 break-words text-lg italic text-muted-foreground sm:text-xl">
              {display.subtitle}
            </p>
            <p className="mt-6 max-w-3xl break-words text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {display.description}
            </p>

            <dl className="mt-8 grid min-w-0 grid-cols-2 border-l border-t border-border lg:grid-cols-4">
              {[
                [copy.detail.format, display.resourceType],
                [
                  copy.detail.materialLanguage,
                  copy.detail.materialLanguageValue,
                ],
                [
                  copy.detail.extent,
                  `${copy.detail.chapterCount(chapters.length)} · ${copy.detail.readingTime(book.readingTimeMinutes)}`,
                ],
                [
                  copy.detail.access,
                  `${copy.detail.freeAccess} · ${copy.detail.lastReviewed(formatReviewDate(book.lastReviewed, locale))}`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 border-b border-r border-border p-3 sm:p-4"
                >
                  <dt className="break-words font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="mt-2 break-words text-xs font-semibold leading-snug text-foreground sm:text-sm">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {pdfLoginHref &&
              (accountEnabled ? (
                <Link
                  href={pdfLoginHref}
                  className="mt-6 inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
                >
                  <Lock size={14} aria-hidden="true" className="shrink-0" />
                  <span className="min-w-0 break-words">
                    {copy.detail.pdfAfterLogin}
                  </span>
                </Link>
              ) : (
                <span className="mt-6 inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-sm text-muted-foreground">
                  <Lock size={14} aria-hidden="true" className="shrink-0" />
                  <span className="min-w-0 break-words">
                    {copy.detail.pdfUnavailable}
                  </span>
                </span>
              ))}
            <p className="mt-3 break-words text-xs text-muted-foreground">
              {copy.detail.onlineAccessNote}
            </p>
          </div>
        </header>

        {display.adaptationNote && (
          <aside className="mt-8 grid min-w-0 gap-2 border-l-4 border-brand-orange bg-card/50 px-4 py-4 text-sm sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-4 sm:px-5">
            <strong className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brand-orange">
              {copy.detail.adaptationLabel}
            </strong>
            <p className="min-w-0 break-words leading-relaxed text-muted-foreground">
              {display.adaptationNote}
            </p>
          </aside>
        )}

        <nav aria-label={copy.detail.contentsAria} className="mt-12 sm:mt-16">
          <div className="grid min-w-0 gap-3 border-b border-border pb-5 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,0.75fr)] sm:items-end sm:gap-8">
            <h2 className="break-words text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              {copy.detail.contentsHeading}
            </h2>
            <p className="min-w-0 break-words text-sm leading-relaxed text-muted-foreground sm:text-right">
              {copy.detail.contentsIntro}
            </p>
          </div>
          <ol className="mt-5 grid min-w-0 gap-3 lg:grid-cols-2">
            {chapters.map((chapter, index) => (
              <li key={chapter.slug} className="min-w-0">
                <Link
                  href={localizeHref(
                    `/buecher/${slug}/${chapter.slug}`,
                    locale,
                  )}
                  hrefLang={locale}
                  lang={locale}
                  aria-label={copy.detail.chapterAria(chapter.title)}
                  className="group grid min-h-20 min-w-0 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-[background-color,border-color,box-shadow] hover:border-brand-orange hover:bg-card-hover hover:shadow-card-hover sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:gap-4"
                >
                  <span className="font-mono text-[11px] font-bold text-brand-orange">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-semibold leading-snug text-foreground group-hover:text-brand-orange">
                      {chapter.title}
                    </span>
                    <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {copy.detail.chapterLanguage}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {chapter.readingTimeMinutes ? (
                      <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                        {copy.detail.minutesShort(chapter.readingTimeMinutes)}
                      </span>
                    ) : null}
                    <ChevronRight
                      size={16}
                      aria-hidden="true"
                      className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-orange"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <section className="mt-12 grid min-w-0 gap-6 border-t border-border pt-8 sm:mt-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
              {copy.detail.companionPrefix}
            </p>
            <Link
              href={relatedHref}
              className="mt-2 inline-flex min-h-11 max-w-full items-center break-words text-xl font-bold tracking-[-0.02em] text-brand-orange underline-offset-4 hover:underline"
            >
              {display.relatedResourceLabel}
            </Link>
          </div>
          <Link
            href={catalogHref}
            className="inline-flex min-h-11 w-fit max-w-full items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
          >
            <BookOpen size={14} aria-hidden="true" />
            {copy.detail.backToCatalog}
          </Link>
        </section>
      </div>
    </>
  );
}
