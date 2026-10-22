import { Fragment, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import type { Book } from "@/lib/books";
import type { BookChapterMeta } from "@/lib/book-reader-content";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
import type { PlakatKey } from "@/lib/plakat/palettes";
import { MIN_CELL } from "@/lib/explorer/model";
import { CapsLine, PlakatBand, PosterNumeral } from "@/components/plakat";
import { ChapterList } from "@/components/book-reader/chapter-list";
import { BookCoverTile } from "@/components/book-reader/reel/book-cover-tile";
import {
  BOOK_PAGE_COPY,
  getCompanionCourse,
  type LocalizedBookDisplay,
} from "./book-copy";
import "@/components/book-reader/book-landing.css";

/**
 * /buecher, the shelf version of the book landing: the same Lemons band, the
 * landing's cards (`.bl-card`) and its chapter list, with each book laid out
 * as a workshop hub row (a poster tile beside meta, title and hook). Chapter 1
 * and every other chapter are one tap away. Nothing collapses, nothing moves
 * except the tile's lift on hover or focus.
 */

/** The books scene: the landing's band (Ultramarin and Butter). */
const BOOKS_PLAKAT: PlakatKey = "lemons";

/**
 * The landing's card tokens live on `.bl-stage`; the shelf sets the same
 * four on each row, so `.bl-card` and `.bl-link` keep their exact colours
 * without the stage's phone layout rules.
 */
const CARD_TOKENS = {
  "--bl-ink": "var(--color-foreground, #121212)",
  "--bl-paper": "var(--color-background, #f3f0e9)",
  "--bl-accent": "var(--color-brand-orange, #b73a15)",
  "--bl-muted": "var(--color-muted-foreground, #4f4640)",
} as CSSProperties;

/** The landing's headline figure, resolved from the figure JSON. */
export interface ShelfHeadline {
  /** Printed value with its unit ("3,8 %"). */
  readonly value: string;
  /** The share as a fraction of the base (0.038). */
  readonly share: number;
  /** The claim after the value, from the manifest. */
  readonly tail: string;
}

export interface ShelfEntry {
  readonly book: Book;
  /** Display copy, with the title from the locale's manifest. */
  readonly display: LocalizedBookDisplay;
  readonly chapters: readonly BookChapterMeta[];
  readonly headline: ShelfHeadline | null;
}

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
  entries,
  headingFontClassName = "",
}: {
  readonly accountEnabled: boolean;
  readonly locale: Locale;
  readonly entries: readonly ShelfEntry[];
  readonly headingFontClassName?: string;
}) {
  const copy = BOOK_PAGE_COPY[locale].catalog;
  const minutes = entries.reduce(
    (sum, { book }) => sum + book.readingTimeMinutes,
    0,
  );

  return (
    <>
      <PlakatBand
        plakat={BOOKS_PLAKAT}
        labelledBy="buecher-heading"
        contentClassName="lg:py-14"
        art={
          minutes > 0 ? (
            <PosterNumeral value={minutes} fit plakat={BOOKS_PLAKAT} />
          ) : undefined
        }
      >
        <CapsLine>{copy.caps(entries.length, minutes)}</CapsLine>
        <h1
          id="buecher-heading"
          className={`${headingFontClassName} poster-title mt-2 max-w-[16ch] text-scene-ink sm:mt-4`}
          style={posterTitleFallbackStyle(copy.heading)}
        >
          {copy.heading}
        </h1>
        <p className="mt-3 max-w-[44ch] text-body text-scene-ink text-pretty sm:mt-5">
          {copy.lede}
        </p>
      </PlakatBand>

      <div className="mx-auto max-w-[75rem] px-4 pb-12 pt-6 sm:px-6 sm:pb-20 md:pt-12 lg:pt-16">
        {entries.map((entry) => (
          <ShelfRow
            key={entry.book.id}
            entry={entry}
            locale={locale}
            accountEnabled={accountEnabled}
          />
        ))}
      </div>
    </>
  );
}

function ShelfRow({
  entry,
  locale,
  accountEnabled,
}: {
  readonly entry: ShelfEntry;
  readonly locale: Locale;
  readonly accountEnabled: boolean;
}) {
  const copy = BOOK_PAGE_COPY[locale].catalog;
  const { book, display, chapters, headline } = entry;
  const headingId = `book-${book.id}-heading`;
  const landingHref = localizeHref(book.readerHref, locale);
  const relatedHref = localizeHref(book.relatedResourceHref, locale);
  const first = chapters[0];
  const pdfLoginHref =
    accountEnabled && book.pdfPath
      ? `${localizeHref("/login", locale)}?next=${encodeURIComponent(book.pdfPath)}`
      : null;
  const hook = headline ? `${headline.value} ${headline.tail}` : display.subtitle;

  // Hub-row geometry (WorkshopRow): a 104px tile beside the text on a phone,
  // 14rem from md, 18rem from lg. The cards span the row on a phone and sit
  // in the text column from md, two side by side, right under the hook (the
  // tile's extra height goes to the second row, not between hook and cards).
  return (
    <article
      id={book.id}
      data-testid="book-card"
      aria-labelledby={headingId}
      className="group min-w-0 scroll-mt-24 [&+&]:mt-16"
      style={CARD_TOKENS}
    >
      <div className="grid min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-5 md:grid-cols-[14rem_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-10 md:gap-y-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="min-w-0 transition-transform duration-300 ease-out motion-reduce:transition-none md:row-span-2 [@media(hover:hover)]:group-hover:-translate-y-1 group-has-[a:focus-visible]:-translate-y-1">
          <BookCoverTile
            value={headline?.value ?? null}
            share={headline?.share ?? null}
          />
        </div>

        <div className="min-w-0">
          <p
            data-book-meta=""
            className="text-caption text-muted-foreground tabular-nums md:text-sm"
          >
            {/* Each part stays whole, its separator on the line before. */}
            {copy
              .rowMeta(display.edition, chapters.length, book.readingTimeMinutes)
              .split(" · ")
              .map((part, position, parts) => (
                <Fragment key={part}>
                  <span className="whitespace-nowrap">
                    {part}
                    {position < parts.length - 1 ? " ·" : ""}
                  </span>
                  {position < parts.length - 1 ? " " : null}
                </Fragment>
              ))}
          </p>
          <h2
            id={headingId}
            className="mt-1 text-[1.0625rem] font-bold leading-[1.2] tracking-[-0.01em] text-foreground text-balance md:mt-2 md:text-[1.75rem]"
          >
            <Link
              href={landingHref}
              className="decoration-2 underline-offset-4 outline-none hover:underline hover:decoration-brand-orange focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              {display.title}
            </Link>
          </h2>
          <p className="mt-1 hidden max-w-[48ch] text-body text-muted-foreground text-pretty md:block">
            {display.subtitle}
          </p>
          <p
            data-book-hook=""
            className="mt-2 max-w-[28ch] text-[0.9375rem] font-semibold leading-snug text-foreground text-pretty md:mt-6 md:text-[1.625rem] md:font-bold md:leading-[1.12] md:tracking-[-0.015em]"
          >
            {hook}
          </p>
        </div>

        <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2">
          <div className="grid gap-3 sm:grid-cols-2 md:max-w-[40rem]">
            {first ? (
              <Link
                href={localizeHref(`/buecher/${book.id}/${first.slug}`, locale)}
                aria-label={`${copy.readChapter(1)}: ${display.title}`}
                className="bl-card bl-card--filled"
                data-book-start=""
              >
                <span>{copy.readChapter(1)}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ) : null}
            <Link
              href={landingHref}
              aria-label={`${copy.openBook}: ${display.title}`}
              className="bl-card bl-card--outline"
              data-book-open=""
            >
              <span>{copy.openBook}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          {pdfLoginHref ? (
            <Link
              href={pdfLoginHref}
              aria-label={`${copy.pdfAfterLogin(book.pageCount)}: ${display.title}`}
              className="bl-link mt-2 gap-2"
              data-book-pdf=""
            >
              <Download size={16} aria-hidden="true" />
              {copy.pdfAfterLogin(book.pageCount)}
            </Link>
          ) : null}
        </div>
      </div>

      <ChapterList
        bookId={book.id}
        chapters={chapters}
        locale={locale}
        showNumerals
      />

      <p
        data-book-provenance=""
        className="mt-6 max-w-[72ch] text-caption text-muted-foreground text-pretty"
      >
        {book.author} · {copy.reviewed(formatReviewDate(book.lastReviewed, locale))}
        {display.adaptationNote ? ` · ${copy.aggregates(MIN_CELL)}` : null}
        {" · "}
        {copy.companion}:{" "}
        <Link
          href={relatedHref}
          className="font-semibold text-foreground underline decoration-1 underline-offset-4 outline-none hover:bg-brand-orange hover:text-background hover:no-underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-orange active:bg-foreground active:text-background"
        >
          {getCompanionCourse(book, locale)}
        </Link>
      </p>
    </article>
  );
}
