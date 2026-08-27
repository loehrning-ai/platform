import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Eye, Lock } from "lucide-react";
import { books, getBookCover, type Book } from "@/lib/books";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import {
  BOOK_PAGE_COPY,
  getBookDisplay,
  getBookSourceInputs,
} from "./book-copy";
import { BookPreviewController } from "./book-preview-controller";

const PRIMARY_READER_CLASS =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-2 border-2 border-foreground bg-brand-orange px-4 py-2 text-center text-sm font-bold text-white transition-colors hover:bg-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange";

const SECONDARY_LINK_CLASS =
  "inline-flex min-h-11 max-w-full items-center gap-2 py-2 text-sm font-semibold text-brand-orange underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange";

function formatReviewDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function BuecherContent({
  accountEnabled,
  locale,
  catalogBooks = books,
}: {
  readonly accountEnabled: boolean;
  readonly locale: Locale;
  readonly catalogBooks?: readonly Book[];
}) {
  const copy = BOOK_PAGE_COPY[locale].catalog;
  const localizedBooks = catalogBooks.map((book) => ({
    book,
    display: getBookDisplay(book, locale),
  }));

  return (
    <>
      <section className="border-b border-border py-8 sm:py-10">
        <div
          className="mx-auto grid max-w-6xl gap-3 px-4 sm:px-6 lg:grid-cols-12"
          data-book-bento
        >
          <div className="dark-section relative min-w-0 overflow-hidden border border-foreground bg-background p-5 text-foreground sm:p-7 lg:col-span-8">
            <span
              className="absolute right-[-2.5rem] top-[-2.5rem] h-28 w-28 rotate-45 border border-border"
              aria-hidden="true"
            />
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              {copy.kicker}
            </p>
            <h1 className="relative mt-5 max-w-[14ch] text-[clamp(2.45rem,5vw,4.75rem)] font-bold leading-[0.94] tracking-[-0.05em]">
              {copy.heading}{" "}
              <span className="text-brand-orange">{copy.headingAccent}</span>
            </h1>
          </div>

          <div className="relative flex min-w-0 flex-col justify-between overflow-hidden border border-foreground bg-card p-5 sm:p-6 lg:col-span-4">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              {copy.collectionHeading}
            </span>
            <strong className="mt-10 block text-[clamp(4.5rem,9vw,7.5rem)] font-bold leading-[0.72] tracking-[-0.08em] text-foreground">
              {String(catalogBooks.length).padStart(2, "0")}
            </strong>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.introduction(catalogBooks.length)}
            </p>
            <span
              className="absolute bottom-[-2rem] right-[-2rem] h-20 w-20 rotate-12 border border-brand-orange/40"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      <section
        className="py-8 sm:py-10"
        aria-labelledby="book-collection-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mb-5 flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <h2
              id="book-collection-heading"
              className="text-xl font-bold tracking-[-0.025em] sm:text-2xl"
            >
              {copy.collectionHeading}
            </h2>
            <p className="text-sm text-muted-foreground">
              {copy.collectionDescription}
            </p>
          </header>

          <div className="grid gap-5">
            {localizedBooks.map(({ book, display }, index) => {
              const detailHref = localizeHref(book.readerHref, locale);
              const relatedHref = localizeHref(
                book.relatedResourceHref,
                locale,
              );
              const pdfLoginHref = book.pdfPath
                ? `${localizeHref("/login", locale)}?next=${encodeURIComponent(book.pdfPath)}`
                : null;

              return (
                <article
                  key={book.id}
                  id={book.id}
                  data-testid="book-card"
                  className="group relative grid min-w-0 overflow-hidden border border-foreground bg-background md:grid-cols-[minmax(15rem,0.42fr)_minmax(0,1fr)]"
                  data-preview-shelf
                >
                  <div className="relative flex min-w-0 items-center justify-center overflow-hidden border-b border-border bg-card p-5 md:border-b-0 md:border-r sm:p-7">
                    <span className="absolute left-4 top-4 z-20 border border-foreground bg-background px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                      {copy.publicationNumber(index + 1)}
                    </span>
                    <button
                      type="button"
                      data-book-preview-id={book.id}
                      aria-haspopup="dialog"
                      aria-controls={`book-teaser-${book.id}`}
                      className="relative flex min-h-11 w-full max-w-[17rem] flex-col items-center gap-3 py-8 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange"
                      aria-label={copy.coverPreviewAria(display.title)}
                      data-image-showcase
                    >
                      <span
                        className="absolute inset-x-6 bottom-7 top-9 translate-x-4 translate-y-4 border border-border bg-background"
                        aria-hidden="true"
                      />
                      <span
                        className="absolute inset-x-6 bottom-7 top-9 translate-x-2 translate-y-2 border border-foreground bg-background"
                        aria-hidden="true"
                      />
                      <Image
                        src={getBookCover(book)}
                        alt={copy.coverAlt(display.title)}
                        width={778}
                        height={1100}
                        {...(index === 0
                          ? {
                              loading: "eager" as const,
                              fetchPriority: "high" as const,
                            }
                          : { loading: "lazy" as const })}
                        sizes="(max-width: 767px) 224px, 256px"
                        className="relative h-auto w-48 max-w-full border border-foreground bg-background transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:-rotate-1 motion-reduce:transition-none sm:w-56 md:w-full"
                      />
                      <span
                        aria-hidden="true"
                        className="relative inline-flex min-h-11 items-center gap-2 border-b border-foreground px-2 text-xs font-bold text-foreground"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        {copy.previewLabel}
                      </span>
                    </button>
                  </div>

                  <div className="min-w-0 p-5 sm:p-7">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                          {copy.byAuthor(book.author)} · {display.edition}
                        </p>
                        <h3 className="mt-2 break-words text-2xl font-bold leading-tight tracking-[-0.035em] sm:text-3xl">
                          {display.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {display.subtitle}
                        </p>
                      </div>
                      <span className="w-fit border border-brand-orange px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
                        {display.statusLabel}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
                        {copy.contents}
                      </p>
                      <ul className="mt-2 grid gap-px border border-border bg-border sm:grid-cols-3">
                        {display.highlights.map((highlight, highlightIndex) => (
                          <li
                            key={highlight}
                            className="min-w-0 bg-background p-3 text-sm leading-relaxed text-foreground"
                          >
                            <span className="mb-2 block font-mono text-xs font-bold text-brand-orange">
                              {String(highlightIndex + 1).padStart(2, "0")}
                            </span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <dl className="mt-5 grid min-w-0 grid-cols-2 border-y border-border sm:grid-cols-4">
                      {[
                        [copy.facts.audience, display.audience],
                        [
                          copy.facts.extent,
                          copy.chapterCount(book.chapters, book.pageCount),
                        ],
                        [copy.facts.format, display.resourceType],
                        [
                          copy.facts.materialLanguage,
                          copy.materialLanguageValue,
                        ],
                      ].map(([label, value], factIndex) => (
                        <div
                          key={label}
                          className={`min-w-0 py-3 ${
                            factIndex % 2 === 0
                              ? "pr-3"
                              : "border-l border-border pl-3"
                          } ${
                            factIndex > 1
                              ? "border-t border-border sm:border-t-0"
                              : ""
                          } sm:border-l sm:border-border sm:px-3 sm:first:border-l-0 sm:first:pl-0`}
                        >
                          <dt className="text-xs font-semibold text-muted-foreground">
                            {label}
                          </dt>
                          <dd className="mt-1 break-words text-sm font-semibold leading-snug text-foreground">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      {book.publicationStatus === "published" ? (
                        <Link
                          href={detailHref}
                          aria-label={`${copy.openOverview}: ${display.title}`}
                          className={PRIMARY_READER_CLASS}
                        >
                          <BookOpen className="h-4 w-4" aria-hidden="true" />
                          {copy.openOverview}
                        </Link>
                      ) : (
                        <span className="inline-flex min-h-11 items-center py-2 text-sm font-semibold text-muted-foreground">
                          {display.accessLabel}
                        </span>
                      )}

                      {pdfLoginHref && accountEnabled ? (
                        <Link
                          href={pdfLoginHref}
                          aria-label={`${copy.pdfAfterLogin}: ${display.title}`}
                          className={SECONDARY_LINK_CLASS}
                        >
                          <Lock
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          {copy.pdfAfterLogin}
                        </Link>
                      ) : (
                        <span className="inline-flex min-h-11 items-center gap-2 py-2 text-sm text-muted-foreground">
                          <Lock
                            className="h-4 w-4 shrink-0"
                            aria-hidden="true"
                          />
                          {copy.pdfUnavailable}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {copy.reviewed(
                        formatReviewDate(book.lastReviewed, locale),
                      )}{" "}
                      · {copy.editorialOwner(book.sourceOwner)}
                    </p>

                    <details className="group/details mt-3 border-t border-border">
                      <summary
                        aria-label={`${copy.detailsLabel}: ${display.title}`}
                        className="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-sm font-semibold text-foreground marker:content-none"
                      >
                        <span>{copy.detailsLabel}</span>
                        <span
                          aria-hidden="true"
                          className="ml-auto font-mono text-base text-brand-orange group-open/details:hidden"
                        >
                          +
                        </span>
                        <span
                          aria-hidden="true"
                          className="ml-auto hidden font-mono text-base text-brand-orange group-open/details:inline"
                        >
                          −
                        </span>
                      </summary>
                      <div className="grid gap-5 pb-4 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2">
                        <div>
                          <p>{display.description}</p>
                          <p className="mt-3">
                            {copy.nextReview(
                              formatReviewDate(book.nextReview, locale),
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {copy.sourceInputs}
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            {getBookSourceInputs(book, locale).map((source) => (
                              <li key={source}>{source}</li>
                            ))}
                          </ul>
                          <Link
                            href={relatedHref}
                            className={SECONDARY_LINK_CLASS}
                          >
                            {display.relatedResourceLabel}
                            <ArrowUpRight
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </Link>
                        </div>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-5 border-l-[3px] border-brand-orange bg-card px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            {copy.sourceNote}
          </p>
        </div>
      </section>

      <BookPreviewController locale={locale} />
    </>
  );
}
