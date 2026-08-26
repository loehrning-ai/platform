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
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.kicker}
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end lg:gap-10">
            <h1 className="max-w-4xl text-3xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              {copy.heading}{" "}
              <span className="text-brand-orange">{copy.headingAccent}</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.introduction(catalogBooks.length)}
            </p>
          </div>
        </div>
      </section>

      <section
        className="py-8 sm:py-10"
        aria-labelledby="book-collection-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
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

          <div className="border-t border-border">
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
                  className="grid min-w-0 gap-5 border-b border-border py-6 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-7 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-9"
                >
                  <div className="flex min-w-0 flex-col items-start">
                    <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                      {copy.publicationNumber(index + 1)}
                    </span>
                    <button
                      type="button"
                      data-book-preview-id={book.id}
                      aria-haspopup="dialog"
                      aria-controls={`book-teaser-${book.id}`}
                      className="mt-3 flex min-h-11 max-w-full flex-col items-start gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
                      aria-label={copy.coverPreviewAria(display.title)}
                    >
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
                        sizes="(max-width: 767px) 128px, 176px"
                        className="h-auto w-32 max-w-full border border-border bg-card md:w-40 lg:w-44"
                      />
                      <span
                        aria-hidden="true"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        {copy.previewLabel}
                      </span>
                    </button>
                  </div>

                  <div className="min-w-0">
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
                      <span className="w-fit border-l-[3px] border-brand-orange pl-3 text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                        {display.statusLabel}
                      </span>
                    </div>

                    <div className="mt-5 border-l-[3px] border-brand-orange pl-4">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
                        {copy.contents}
                      </p>
                      <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-3">
                        {display.highlights.map((highlight) => (
                          <li
                            key={highlight}
                            className="text-sm leading-relaxed text-foreground"
                          >
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

                    <details className="group mt-3 border-t border-border">
                      <summary
                        aria-label={`${copy.detailsLabel}: ${display.title}`}
                        className="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-sm font-semibold text-foreground marker:content-none"
                      >
                        <span>{copy.detailsLabel}</span>
                        <span
                          aria-hidden="true"
                          className="ml-auto font-mono text-base text-brand-orange group-open:hidden"
                        >
                          +
                        </span>
                        <span
                          aria-hidden="true"
                          className="ml-auto hidden font-mono text-base text-brand-orange group-open:inline"
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

          <p className="mt-4 max-w-4xl text-xs leading-relaxed text-muted-foreground">
            {copy.sourceNote}
          </p>
        </div>
      </section>

      <BookPreviewController locale={locale} />
    </>
  );
}
