import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Eye, Lock } from "lucide-react";
import { books, getBookCover, type Book } from "@/lib/books";
import { HighlightedText } from "@/components/ui/highlighted-text";
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

const BOOK_WASHES = [
  "bg-brand-peach/55",
  "bg-brand-sky/55",
  "bg-brand-pink/50",
] as const;

const BOOK_BACKING_SHEETS = [
  "bg-brand-acid/70",
  "bg-brand-pink/65",
  "bg-brand-teal/45",
] as const;

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
  headingFontClassName = "",
}: {
  readonly accountEnabled: boolean;
  readonly locale: Locale;
  readonly catalogBooks?: readonly Book[];
  readonly headingFontClassName?: string;
}) {
  const copy = BOOK_PAGE_COPY[locale].catalog;
  const localizedBooks = catalogBooks.map((book) => ({
    book,
    display: getBookDisplay(book, locale),
  }));

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border bg-paper py-10 sm:py-14">
        <span
          className="pointer-events-none absolute -left-12 top-16 h-24 w-72 -rotate-3 bg-brand-acid/70"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -right-16 bottom-8 h-28 w-80 rotate-6 bg-brand-peach/55"
          aria-hidden="true"
        />
        <div
          className="relative mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:items-start lg:gap-10"
          data-book-editorial-spread
        >
          <header className="relative min-w-0 py-3 lg:col-span-8 lg:py-8">
            <p className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              <span
                className="h-3 w-3 bg-brand-cobalt"
                aria-hidden="true"
              />
              {copy.kicker}
            </p>
            <h1
              className={`${headingFontClassName} relative mt-5 max-w-[14ch] text-[clamp(2.65rem,6vw,5.75rem)] font-bold leading-[0.9] tracking-[-0.06em] text-foreground`}
            >
              {copy.heading}{" "}
              <HighlightedText colorVar="--color-brand-acid">
                {copy.headingAccent}
              </HighlightedText>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {copy.introduction(catalogBooks.length)}
            </p>
          </header>

          <aside className="relative min-w-0 pb-3 pr-3 lg:col-span-4 lg:mt-16 lg:rotate-1">
            <span
              className="absolute inset-0 translate-x-3 translate-y-3 bg-brand-pink/70"
              aria-hidden="true"
            />
            <div className="relative border border-foreground/30 bg-paper p-5 shadow-card sm:p-6">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
                {copy.collectionHeading}
              </span>
              <div className="mt-7 flex items-end justify-between gap-6 border-b border-foreground pb-4">
                <strong className="text-[clamp(3.5rem,7vw,5.5rem)] font-bold leading-[0.76] tracking-[-0.08em] text-foreground">
                  {String(catalogBooks.length).padStart(2, "0")}
                </strong>
                <span
                  className="mb-1 h-7 w-7 bg-brand-acid"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {copy.collectionDescription}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section
        className="bg-background py-10 sm:py-12"
        aria-labelledby="book-collection-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mb-8 grid gap-3 border-b border-border pb-4 sm:grid-cols-[minmax(12rem,0.48fr)_minmax(0,1fr)] sm:items-end sm:gap-8">
            <h2
              id="book-collection-heading"
              className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl"
            >
              {copy.collectionHeading}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:justify-self-end sm:text-right">
              {copy.collectionDescription}
            </p>
          </header>

          <div className="grid gap-10 sm:gap-12">
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
                  className="group relative isolate grid min-w-0 bg-paper shadow-card ring-1 ring-foreground/20 md:grid-cols-[minmax(16rem,0.44fr)_minmax(0,1fr)]"
                  data-preview-shelf
                >
                  <span
                    className={`absolute inset-0 -z-10 translate-x-2 translate-y-2 ${BOOK_BACKING_SHEETS[index % BOOK_BACKING_SHEETS.length]}`}
                    aria-hidden="true"
                  />
                  <div
                    className={`relative flex min-w-0 items-center justify-center overflow-hidden border-b border-foreground/20 p-5 md:border-b-0 md:border-r sm:p-7 ${BOOK_WASHES[index % BOOK_WASHES.length]}`}
                  >
                    <span className="absolute left-4 top-4 z-20 bg-paper px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.12em] text-foreground ring-1 ring-foreground/30">
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
                        className="absolute inset-x-6 bottom-7 top-9 translate-x-4 translate-y-4 bg-brand-acid/70 ring-1 ring-foreground/20"
                        aria-hidden="true"
                      />
                      <span
                        className="absolute inset-x-6 bottom-7 top-9 translate-x-2 translate-y-2 bg-paper ring-1 ring-foreground/40"
                        aria-hidden="true"
                      />
                      <Image
                        src={getBookCover(book)}
                        alt={copy.coverAlt(display.title)}
                        width={778}
                        height={1100}
                        loading="lazy"
                        quality={70}
                        sizes="(max-width: 639px) 192px, (max-width: 767px) 224px, 256px"
                        className="relative h-auto w-48 max-w-full bg-paper shadow-card ring-1 ring-foreground/40 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:-rotate-1 motion-reduce:transition-none sm:w-56 md:w-full"
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

                  <div className="min-w-0 bg-paper p-5 sm:p-7">
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
                      <span className="w-fit bg-brand-acid/75 px-2 py-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground">
                        {display.statusLabel}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
                        {copy.contents}
                      </p>
                      <ol className="mt-3 divide-y divide-border border-y border-border">
                        {display.highlights.map((highlight, highlightIndex) => (
                          <li
                            key={highlight}
                            className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3 py-3 text-sm leading-relaxed text-foreground"
                          >
                            <span className="font-mono text-xs font-bold text-brand-orange">
                              {String(highlightIndex + 1).padStart(2, "0")}
                            </span>
                            {highlight}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <dl className="mt-5 flex min-w-0 flex-wrap gap-x-6 gap-y-4 border-y border-border py-4">
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
                      ].map(([label, value]) => (
                        <div key={label} className="min-w-[8rem] flex-1">
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

          <p className="mt-10 max-w-4xl border-l-[3px] border-foreground bg-brand-acid/35 px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:ml-auto">
            {copy.sourceNote}
          </p>
        </div>
      </section>

      <BookPreviewController locale={locale} />
    </>
  );
}
