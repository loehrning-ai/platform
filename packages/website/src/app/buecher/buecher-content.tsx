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
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";

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
      {/* Phone-first geometry throughout this catalog: base values are the
          compact companion values (tighter bands, a smaller display size, the
          cover shelf trimmed), and every `sm:`/`md:`/`lg:` variant restores the
          reviewed desktop layout unchanged. */}
      <section className="border-b border-border bg-paper py-6 sm:py-14">
        <div
          className="mx-auto grid max-w-6xl gap-5 px-4 sm:gap-8 sm:px-6 lg:grid-cols-12 lg:items-end lg:gap-10"
          data-book-editorial-spread
        >
          <header className="@container min-w-0 lg:col-span-8">
            <p className="text-label text-muted-foreground">{copy.kicker}</p>
            {/* The site's one display step for top-level H1s (SPEC §4):
                the poster title on paper, fit to its longest word, as /kurse. */}
            <h1
              className={`${headingFontClassName} poster-title mt-3 max-w-[16ch] text-foreground sm:mt-4`}
              style={posterTitleFallbackStyle(`${copy.heading} ${copy.headingAccent}`)}
            >
              {copy.heading} {copy.headingAccent}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-body text-muted-foreground sm:mt-6">
              {copy.introduction(catalogBooks.length)}
            </p>
          </header>

          <aside className="min-w-0 border-t-2 border-foreground pt-3 lg:col-span-4">
            <span className="text-label text-muted-foreground">
              {copy.collectionCountLabel}
            </span>
            <strong className="mt-2 block text-num-lg font-bold text-foreground">
              {String(catalogBooks.length).padStart(2, "0")}
            </strong>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {copy.collectionDescription}
            </p>
          </aside>
        </div>
      </section>

      <section
        className="bg-background py-6 sm:py-12"
        aria-labelledby="book-collection-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <header className="mb-5 grid gap-3 border-b border-border pb-4 sm:mb-8 sm:grid-cols-[minmax(12rem,0.48fr)_minmax(0,1fr)] sm:items-end sm:gap-8">
            <h2
              id="book-collection-heading"
              className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl"
            >
              {copy.collectionHeading}
            </h2>
          </header>

          <div className="grid gap-6 sm:gap-12">
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
                  className="group grid min-w-0 border border-border bg-paper md:grid-cols-[minmax(16rem,0.44fr)_minmax(0,1fr)]"
                  data-preview-shelf
                >
                  <div
                    className="relative flex min-w-0 items-center justify-center overflow-hidden border-b border-border bg-background p-4 md:border-b-0 md:border-r sm:p-7"
                  >
                    <span className="absolute left-4 top-4 z-20 text-label text-muted-foreground">
                      {copy.publicationNumber(index + 1)}
                    </span>
                    <button
                      type="button"
                      data-book-preview-id={book.id}
                      aria-haspopup="dialog"
                      aria-controls={`book-teaser-${book.id}`}
                      className="relative flex min-h-11 w-full max-w-[17rem] flex-col items-center gap-3 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-orange sm:py-8"
                      aria-label={copy.coverPreviewAria(display.title)}
                      data-image-showcase
                    >
                      <Image
                        src={getBookCover(book)}
                        alt={copy.coverAlt(display.title)}
                        width={778}
                        height={1100}
                        loading="lazy"
                        quality={70}
                        sizes="(max-width: 639px) 144px, (max-width: 767px) 224px, 256px"
                        className="relative h-auto w-36 max-w-full bg-paper ring-1 ring-foreground/20 transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none sm:w-56 md:w-full"
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

                  {/* A flex column so the phone can put the decision (open the
                      book) directly under the title, ahead of the contents and
                      facts, through `order` alone. Block and flex-column lay
                      these full-width children out identically, so from md the
                      reviewed reading order returns with no other change. The
                      lists in between hold no controls, so focus order still
                      follows what is on screen. */}
                  <div className="flex min-w-0 flex-col bg-paper p-4 sm:p-7">
                    <div className="order-first flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6 md:order-none">
                      <div className="min-w-0">
                        <p className="text-label text-muted-foreground">
                          {copy.byAuthor(book.author)} · {display.edition}
                        </p>
                        <h3 className="mt-2 break-words text-xl font-bold leading-tight tracking-[-0.035em] sm:text-3xl">
                          {display.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {display.subtitle}
                        </p>
                      </div>
                      <span className="w-fit border border-foreground px-2 py-1 text-label text-foreground">
                        {display.statusLabel}
                      </span>
                    </div>

                    <div className="mt-4 sm:mt-5">
                      <p className="text-label text-muted-foreground">
                        {copy.contents}
                      </p>
                      <ol className="mt-3 divide-y divide-border border-y border-border">
                        {display.highlights.map((highlight, highlightIndex) => (
                          <li
                            key={highlight}
                            className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3 py-3 text-sm leading-relaxed text-foreground"
                          >
                            <span className="text-sm font-bold tabular-nums text-muted-foreground">
                              {String(highlightIndex + 1).padStart(2, "0")}
                            </span>
                            {highlight}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <dl className="mt-4 flex min-w-0 flex-wrap gap-x-6 gap-y-4 border-y border-border py-4 sm:mt-5">
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

                    <div className="-order-1 mt-4 flex min-w-0 flex-col gap-3 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center md:order-none">
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
                      )}
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
        </div>
      </section>

      <BookPreviewController locale={locale} />
    </>
  );
}
