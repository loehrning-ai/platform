import Image from "next/image";
import Link from "next/link";
import { BookOpen, Eye, Lock } from "lucide-react";
import { books, getBookCover, type Book } from "@/lib/books";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { BOOK_PAGE_COPY, getBookDisplay } from "./book-copy";
import { BookPreviewController } from "./book-preview-controller";

const PRIMARY_BUTTON_CLASS =
  "inline-flex max-w-full select-none items-center justify-center gap-1.5 whitespace-normal rounded-lg bg-brand-orange px-5 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white shadow-card transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0 active:shadow-tile sm:whitespace-nowrap";

const PRIMARY_BUTTON_LARGE_CLASS =
  "inline-flex max-w-full select-none items-center justify-center gap-2.5 whitespace-normal rounded-lg bg-brand-orange px-9 py-4.5 text-center text-base font-bold uppercase tracking-wide text-white shadow-card transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0 active:shadow-tile sm:whitespace-nowrap";

const PREVIEW_BUTTON_CLASS =
  "inline-flex max-w-full select-none items-center justify-center gap-1.5 whitespace-normal rounded-lg border border-border bg-card px-5 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-foreground shadow-card transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-card-hover active:translate-y-0 active:shadow-tile sm:whitespace-nowrap";

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
      <section className="border-b border-border/70 py-16 sm:py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-8">
            <p className="overline mb-5 break-words">{copy.kicker}</p>
            <h1 className="max-w-4xl break-words text-4xl font-bold leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              {copy.heading}{" "}
              <span className="text-brand-orange">{copy.headingAccent}</span>
            </h1>
            <p className="mt-6 max-w-3xl break-words text-base leading-relaxed text-muted-foreground sm:text-lg">
              {copy.introduction(catalogBooks.length)}
            </p>
          </div>

          <aside
            aria-label={copy.ledgerLabel}
            className="min-w-0 border-y border-border lg:col-span-4 lg:self-end"
          >
            {copy.ledgerFacts.map((fact, index) => (
              <div
                key={fact.label}
                className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-4 py-4 ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                <span className="min-w-0 break-words font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {fact.label}
                </span>
                <span className="min-w-0 break-words text-right text-sm font-semibold text-foreground">
                  {fact.value}
                </span>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section
        className="py-14 sm:py-20 lg:py-24"
        aria-labelledby="book-collection-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <header className="mb-8 grid gap-3 border-b border-border pb-6 sm:grid-cols-[minmax(0,1fr)_minmax(16rem,0.6fr)] sm:items-end sm:gap-8">
            <div className="min-w-0">
              <p className="overline mb-3">{copy.collectionLabel}</p>
              <h2
                id="book-collection-heading"
                className="break-words text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
              >
                {copy.collectionHeading}
              </h2>
            </div>
            <p className="min-w-0 break-words text-sm leading-relaxed text-muted-foreground sm:text-right">
              {copy.collectionDescription}
            </p>
          </header>

          <div className="space-y-10">
            {localizedBooks.map(({ book, display }, index) => {
              const detailHref = localizeHref(book.readerHref, locale);
              const relatedHref = localizeHref(
                book.relatedResourceHref,
                locale,
              );
              const pdfLoginHref = book.pdfPath
                ? localizeHref(
                    `/login?next=${encodeURIComponent(book.pdfPath)}`,
                    locale,
                  )
                : null;

              return (
                <article
                  key={book.id}
                  id={book.id}
                  data-testid="book-card"
                  className="grid min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1.72fr)]"
                >
                  <div className="relative flex min-w-0 flex-col items-center justify-between overflow-hidden border-b border-border bg-[linear-gradient(145deg,var(--color-card-hover),var(--color-background))] p-6 sm:p-8 lg:border-b-0 lg:border-r">
                    <span className="self-start font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                      {copy.publicationNumber(index + 1)}
                    </span>
                    <button
                      type="button"
                      data-book-preview-id={book.id}
                      aria-haspopup="dialog"
                      aria-controls={`book-teaser-${book.id}`}
                      className="group/cover my-6 block max-w-full"
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
                        sizes="(max-width: 640px) 208px, (max-width: 1024px) 240px, 260px"
                        className="h-auto w-52 max-w-full rounded-lg border border-border bg-card shadow-card transition-[transform,box-shadow] duration-200 group-hover/cover:-translate-y-1 group-hover/cover:shadow-card-hover sm:w-60 lg:w-[260px]"
                      />
                    </button>
                    <span className="inline-flex items-center gap-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground transition-colors group-hover/cover:text-brand-orange">
                      <Eye size={13} aria-hidden="true" />
                      {copy.previewLabel}
                    </span>
                  </div>

                  <div className="min-w-0 p-5 sm:p-8 lg:p-10">
                    <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          {display.edition} · {book.author}
                        </p>
                        <h3 className="mt-3 break-words text-3xl font-bold leading-none tracking-[-0.04em] sm:text-4xl">
                          {display.title}
                        </h3>
                        <p className="mt-3 break-words text-base italic text-muted-foreground">
                          {display.subtitle}
                        </p>
                      </div>
                      <span className="w-fit shrink-0 rounded-full border border-brand-orange/30 bg-kupfer-mist px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                        {display.statusLabel}
                      </span>
                    </div>

                    <dl className="mt-7 grid min-w-0 grid-cols-1 border-l border-t border-border sm:grid-cols-2">
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
                        <div
                          key={label}
                          className="min-w-0 border-b border-r border-border p-4"
                        >
                          <dt className="break-words font-mono text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                            {label}
                          </dt>
                          <dd className="mt-2 break-words text-sm font-semibold leading-snug text-foreground">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <p className="mt-7 max-w-3xl break-words text-[15px] leading-relaxed text-muted-foreground">
                      {display.description}
                    </p>

                    <div className="mt-7 border-t border-border pt-5">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-foreground">
                        {copy.contents}
                      </p>
                      <ol className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
                        {display.highlights.map((highlight, highlightIndex) => (
                          <li
                            key={highlight}
                            className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] gap-2 text-sm leading-relaxed text-muted-foreground"
                          >
                            <span className="font-mono text-[10px] font-bold text-brand-orange">
                              {String(highlightIndex + 1).padStart(2, "0")}
                            </span>
                            <span className="min-w-0 break-words">
                              {highlight}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="mt-8 flex min-w-0 flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap sm:items-center">
                      <Link href={detailHref} className={PRIMARY_BUTTON_CLASS}>
                        <BookOpen size={14} aria-hidden="true" />
                        {copy.openOverview}
                      </Link>
                      <button
                        type="button"
                        data-book-preview-id={book.id}
                        aria-haspopup="dialog"
                        aria-controls={`book-teaser-${book.id}`}
                        className={PREVIEW_BUTTON_CLASS}
                      >
                        <Eye size={14} aria-hidden="true" />
                        {copy.openPreview}
                      </button>
                      {pdfLoginHref &&
                        (accountEnabled ? (
                          <Link
                            href={pdfLoginHref}
                            className="inline-flex min-h-11 max-w-full items-center gap-1.5 break-words font-mono text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground transition-colors hover:text-brand-orange"
                          >
                            <Lock
                              size={12}
                              aria-hidden="true"
                              className="shrink-0"
                            />
                            {copy.pdfAfterLogin}
                          </Link>
                        ) : (
                          <span className="inline-flex min-h-11 max-w-full items-center gap-1.5 break-words font-mono text-[10px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
                            <Lock
                              size={12}
                              aria-hidden="true"
                              className="shrink-0"
                            />
                            {copy.pdfUnavailable}
                          </span>
                        ))}
                    </div>

                    <Link
                      href={relatedHref}
                      className="mt-5 inline-flex min-h-11 max-w-full items-center break-words font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-brand-orange underline-offset-4 hover:underline"
                    >
                      {display.relatedResourceLabel}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid min-w-0 gap-3 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8">
            <p className="min-w-0 break-words">{copy.sourceNote}</p>
            <p className="min-w-0 break-words sm:max-w-xs sm:text-right">
              {copy.pdfAvailability(accountEnabled)}{" "}
              {copy.reviewed(
                formatReviewDate(
                  catalogBooks[0]?.lastReviewed ?? "2026-08-09",
                  locale,
                ),
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/35 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.5fr)_auto] lg:items-end">
          <div className="min-w-0">
            <p className="overline mb-4">{copy.bridgeKicker}</p>
            <h2 className="max-w-4xl break-words text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              {copy.bridgeHeading}
            </h2>
            <p className="mt-4 max-w-3xl break-words leading-relaxed text-muted-foreground">
              {copy.bridgeBody}
            </p>
          </div>
          <Link
            href={localizeHref("/kurse", locale)}
            className={PRIMARY_BUTTON_LARGE_CLASS}
          >
            {copy.viewCourses}
          </Link>
        </div>
      </section>

      <BookPreviewController locale={locale} />
    </>
  );
}
