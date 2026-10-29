import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";
import type { Book } from "@/lib/books";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type {
  LoadedChapter,
  ChapterNeighbours,
  BookChapterMeta,
} from "@/lib/book-reader-content";
import { ReaderFocusBar } from "@/components/learning/reader-focus-bar";
import { hasDirectives } from "@/lib/book-directives";
import {
  renderChapterMarkdownHtml,
  renderChapterSegments,
  type ChapterSegment,
} from "./chapter-markdown";
import { isInsightBook } from "@/lib/book-experience";
import { ChapterBand } from "./chapter-band";
import { ChapterList } from "./chapter-list";
import { ChapterPauseSwitch } from "./chapter-pause-switch";
import { ChapterReaderClient, ChapterTocLinks } from "./chapter-reader-client";
import { InsightFocusBar } from "./insight-focus-bar";

interface ChapterReaderProps {
  readonly book: Book;
  readonly chapter: LoadedChapter;
  readonly neighbours: ChapterNeighbours;
  readonly allChapters: readonly BookChapterMeta[];
  readonly locale: Locale;
  readonly bookTitle: string;
  readonly relatedResourceLabel: string;
  /**
   * The chapter cut at its figure lines (see renderChapterSegments). Omit it
   * and the reader cuts the chapter itself when it holds a figure line.
   */
  readonly segments?: readonly ChapterSegment[];
  /** The figure for each directive segment, same index as `segments`. Built by the page so the islands load only on chapters that use them. */
  readonly figureBlocks?: readonly (ReactNode | null)[];
}

/**
 * Prose colours are bound to the theme CSS variables, NOT the fixed
 * `prose-invert` (which forced light text and produced a 1.3:1
 * light-on-light body on the default Kalkweiss page - release hardening). The
 * vars flip with `prefers-color-scheme`, so body text is the
 * AAA-tuned muted-foreground (#4f4640 ~7:1 on light) in light mode
 * and the light token in dark mode. Tailwind darkMode is "class"
 * here, so `dark:prose-invert` would never fire under the media-query
 * theme; the var binding is the theme-aware fix.
 */
const PROSE_CLASS =
  "prose prose-stone min-w-0 [overflow-wrap:anywhere] [--tw-prose-body:var(--color-muted-foreground)] [--tw-prose-headings:var(--color-foreground)] [--tw-prose-bold:var(--color-foreground)] [--tw-prose-quotes:var(--color-foreground)] [--tw-prose-bullets:var(--color-muted-foreground)] [--tw-prose-counters:var(--color-muted-foreground)] [--tw-prose-captions:var(--color-muted-foreground)] prose-headings:break-words prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:break-words prose-a:text-brand-orange prose-a:no-underline prose-a:py-[0.85rem] hover:prose-a:underline [&_:is(h2,h3,h4)>a]:block [&_:is(h2,h3,h4)>a]:min-h-11 [&_:is(h2,h3,h4)>a]:py-2 [&_:is(h2,h3,h4)>a]:text-foreground prose-code:break-words prose-code:rounded prose-code:bg-card/60 prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-pre:max-w-full prose-pre:overflow-x-auto prose-pre:border prose-pre:border-hairline prose-pre:bg-inset prose-pre:text-foreground prose-table:text-sm";

const READER_COPY = {
  de: {
    breadcrumbAria: "Brotkrümelnavigation",
    books: "Bücher",
    chapterPosition: (chapter: number, total: number) =>
      `Kapitel ${chapter} / ${total}`,
    readingTime: (minutes: number) =>
      `Lesezeit: ca. ${minutes} ${minutes === 1 ? "Minute" : "Minuten"}`,
    chapterNavigationAria: "Kapitelnavigation",
    previousShort: "Zurück",
    contents: "Inhaltsverzeichnis",
    keyboardHint: "Pfeiltasten links/rechts",
    nextChapter: (title: string) => `Nächstes Kapitel: ${title}`,
    nextShort: "Weiter",
    chapterOverview: "Kapitelübersicht",
    relatedCourse: (label: string) => `Zurück zum Kurs: ${label}`,
    tocRegion: "Kapitelinhalt",
    tocHeading: "In diesem Kapitel",
    pdfAvailable:
      "Maßgeblich ist der Reader; nach der Anmeldung lädst du das PDF auf der Buchübersicht herunter.",
    pdfUnavailable:
      "Für dieses Buch gibt es derzeit kein PDF.",
    allChapters: "Alle Kapitel",
    // Reader bar below lg. The visible strip shows the bare fraction; this is
    // the sentence assistive technology reads instead.
    barPosition: (chapter: number, total: number) =>
      `Kapitel ${chapter} von ${total}`,
    overviewShort: "Übersicht",
  },
  en: {
    breadcrumbAria: "Breadcrumb",
    books: "Books",
    chapterPosition: (chapter: number, total: number) =>
      `Chapter ${chapter} of ${total}`,
    readingTime: (minutes: number) =>
      `Reading time: approx. ${minutes} ${minutes === 1 ? "minute" : "minutes"}`,
    chapterNavigationAria: "Chapter navigation",
    previousShort: "Previous",
    contents: "Contents",
    keyboardHint: "Left/right arrow keys",
    nextChapter: (title: string) => `Next chapter: ${title}`,
    nextShort: "Next",
    chapterOverview: "Chapter overview",
    relatedCourse: (label: string) => `Back to the course: ${label}`,
    tocRegion: "Chapter contents",
    tocHeading: "In this chapter",
    pdfAvailable:
      "The reader is the maintained edition; after signing in, download the German PDF from the book overview.",
    pdfUnavailable:
      "No PDF is currently available for this book.",
    allChapters: "All chapters",
    barPosition: (chapter: number, total: number) =>
      `Chapter ${chapter} of ${total}`,
    overviewShort: "Overview",
  },
} as const;

/** Moves the first hero stage or explorer (and its built figure) to the front of the chapter. Other figures keep their place. */
function hoistFirstStage(
  segments: readonly ChapterSegment[],
  blocks: readonly (ReactNode | null)[] | undefined,
): { readonly segments: readonly ChapterSegment[]; readonly blocks: readonly (ReactNode | null)[] | undefined } {
  const at = segments.findIndex((segment) => segment.kind === "directive" && (segment.directive.name === "stage" || segment.directive.name === "explorer"));
  if (at <= 0) return { segments, blocks };
  const order = [at, ...segments.map((_, i) => i).filter((i) => i !== at)];
  return {
    segments: order.map((i) => segments[i] as ChapterSegment),
    blocks: blocks ? order.map((i) => blocks[i] ?? null) : undefined,
  };
}

/**
 * Server Component shell for the book chapter reader. The markdown body
 * renders to escaped HTML on the server; only the interactive behavior ships
 * as hostless or plain-data client islands. The shell, opaque Markdown
 * article, navigation, and no-JS TOC stay server-owned so React does not walk
 * streamed Markdown descendants during hydration.
 */
export function ChapterReader({
  book,
  chapter,
  neighbours,
  allChapters,
  locale,
  bookTitle,
  relatedResourceLabel,
  segments: givenSegments,
  figureBlocks,
}: ChapterReaderProps) {
  const copy = READER_COPY[locale];
  const chapterIndex = allChapters.findIndex(
    (candidate) => candidate.slug === chapter.meta.slug,
  );
  const chapterNumber = chapterIndex + 1;
  const insight = isInsightBook(book.id);
  const cut =
    givenSegments ??
    (hasDirectives(chapter.rawMarkdown)
      ? renderChapterSegments({ rawMarkdown: chapter.rawMarkdown, locale })
      : null);
  // Insight chapters open with the stage (or the explorer): the first one moves ahead of the text that introduces it,
  // so the first screen after the band is the data, not a paragraph (the intro reads right below it).
  const hoisted = insight && cut ? hoistFirstStage(cut, figureBlocks) : null;
  const segments = hoisted ? hoisted.segments : cut;
  const blocks = hoisted ? hoisted.blocks : figureBlocks;
  const hasFigures = Boolean(segments?.some((segment) => segment.kind === "directive"));
  const hasStage = Boolean(segments?.some((segment) => segment.kind === "directive" && segment.directive.name === "stage"));
  // A chapter with figures is a column of 68ch text runs and figures that break out to 1120px.
  // The article stays the one landmark; each text run is an opaque payload, each figure an island.
  const content =
    hasFigures && segments ? (
      <article
        aria-label={chapter.meta.title}
        data-book-figures="true"
        className="min-w-0"
      >
        {segments.map((segment, index) =>
          segment.kind === "html" ? (
            <div
              key={index}
              className={`${PROSE_CLASS} mx-auto max-w-[68ch]`}
              dangerouslySetInnerHTML={{ __html: segment.html }}
            />
          ) : (
            <div
              key={index}
              data-book-figure={segment.directive.name}
              className="mx-auto my-8 w-full min-w-0 max-w-[1120px] first:mt-0 sm:my-10 sm:first:mt-0"
            >
              {blocks?.[index] ?? null}
            </div>
          ),
        )}
      </article>
    ) : (
      <article
        aria-label={chapter.meta.title}
        className={`${PROSE_CLASS} max-w-[70ch]${insight ? " mx-auto" : ""}`}
        dangerouslySetInnerHTML={{
          __html: renderChapterMarkdownHtml({
            rawMarkdown: chapter.rawMarkdown,
            locale,
          }),
        }}
      />
    );

  const bookHref = localizeHref(`/buecher/${book.id}`, locale);
  const nextChapterHref = neighbours.next
    ? localizeHref(`/buecher/${book.id}/${neighbours.next.slug}`, locale)
    : null;

  const breadcrumb = (
    <nav
      aria-label={copy.breadcrumbAria}
      className="no-print mb-4 flex min-w-0 flex-wrap items-center gap-x-2 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground"
    >
      <Link
        href={localizeHref("/buecher", locale)}
        className="inline-flex min-h-11 items-center break-words hover:text-brand-orange"
      >
        {copy.books}
      </Link>
      <span aria-hidden="true">/</span>
      <Link
        href={bookHref}
        className="inline-flex min-h-11 min-w-0 items-center break-words hover:text-brand-orange"
      >
        {bookTitle}
      </Link>
      <span aria-hidden="true">/</span>
      <span className="min-w-0 break-words text-foreground">{chapter.meta.title}</span>
    </nav>
  );

  // Insight chapters, sm and up: one short line in Figtree, the way back to the book. On phones the band's caps line is that link.
  const insightTopRow = (
    <div className="no-print mx-auto hidden max-w-[75rem] items-center justify-between gap-3 px-4 sm:flex sm:px-6">
      <nav aria-label={copy.breadcrumbAria} className="min-w-0">
        <Link
          href={bookHref}
          className="inline-flex min-h-12 min-w-12 max-w-full items-center gap-1.5 text-[0.9375rem] font-semibold text-foreground underline-offset-4 hover:text-brand-orange hover:underline"
        >
          <ArrowLeft size={16} aria-hidden="true" className="shrink-0" />
          <span className="truncate">{bookTitle}</span>
        </Link>
      </nav>
    </div>
  );

  const chapterNavigation = (
    <nav
      aria-label={copy.chapterNavigationAria}
      className="no-print mt-10 grid min-w-0 grid-cols-2 items-center gap-3 border-t border-border pt-5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
    >
      {neighbours.prev ? (
        <Link
          href={localizeHref(`/buecher/${book.id}/${neighbours.prev.slug}`, locale)}
          className="flex min-h-11 min-w-0 max-w-full items-center justify-self-start border border-border/50 bg-card/20 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange sm:px-4"
          aria-label={`${copy.previousShort}: ${neighbours.prev.title}`}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span className="hidden min-w-0 break-words md:block">{neighbours.prev.title}</span>
          <span className="md:hidden">{copy.previousShort}</span>
        </Link>
      ) : (
        <Link
          href={bookHref}
          className="flex min-h-11 min-w-0 max-w-full items-center justify-self-start text-sm text-muted-foreground hover:text-brand-orange"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span className="break-words">{copy.contents}</span>
        </Link>
      )}

      <span className="hidden font-mono text-xs text-muted-foreground sm:block" aria-hidden="true">
        ← → {copy.keyboardHint}
      </span>

      {neighbours.next && nextChapterHref ? (
        <Link
          href={nextChapterHref}
          className="flex min-h-11 min-w-0 max-w-full items-center justify-self-end border border-border/50 bg-card/20 px-3 py-2 text-right text-sm font-semibold text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange sm:px-4"
          aria-label={`${copy.nextShort}: ${neighbours.next.title}`}
        >
          <span className="hidden min-w-0 break-words md:block">{neighbours.next.title}</span>
          <span className="md:hidden">{copy.nextShort}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      ) : (
        <Link
          href={bookHref}
          className="flex min-h-11 min-w-0 max-w-full items-center justify-self-end text-right text-sm text-muted-foreground hover:text-brand-orange"
        >
          <span className="break-words">{copy.chapterOverview}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );

  const relatedCourse = (
    <div className="no-print mt-5 flex justify-center border-t border-border pt-3">
      <Link
        href={localizeHref(book.relatedResourceHref, locale)}
        className="inline-flex min-h-11 items-center text-center text-sm text-muted-foreground underline-offset-4 hover:text-brand-orange hover:underline"
      >
        {copy.relatedCourse(relatedResourceLabel)}
      </Link>
    </div>
  );

  // The compact reader bar below lg: position and the next chapter. The contents are a visible
  // list on the page (insight books) or the sidebar (lg), never a sheet that opens and closes.
  const focusBar = (
    <ReaderFocusBar
      position={`${chapterNumber} / ${allChapters.length}`}
      positionLabel={copy.barPosition(chapterNumber, allChapters.length)}
      action={
        neighbours.next && nextChapterHref
          ? {
              kind: "link",
              label: copy.nextShort,
              href: nextChapterHref,
              ariaLabel: `${copy.nextShort}: ${neighbours.next.title}`,
            }
          : {
              kind: "link",
              label: copy.overviewShort,
              href: bookHref,
              ariaLabel: copy.chapterOverview,
            }
      }
    />
  );

  const insightFocusBar = (
    <InsightFocusBar
      locale={locale}
      chapterNumber={chapterNumber}
      chapterTotal={allChapters.length}
      next={
        neighbours.next && nextChapterHref
          ? { href: nextChapterHref, ariaLabel: `${copy.nextChapter(neighbours.next.title)}`, isOverview: false }
          : { href: bookHref, ariaLabel: copy.chapterOverview, isOverview: true }
      }
    />
  );

  // Keep the only reader runtime boundary after all server-owned markup.
  // A hostless client boundary before the grid could advance React's
  // hydration cursor into the grid during concurrent streamed retries.
  const runtime = (
    <ChapterReaderClient
      bookId={book.id}
      chapterSlug={chapter.meta.slug}
      neighbours={neighbours}
      locale={locale}
    />
  );

  // Insight chapter (docs/experience-system.md, "Book motion exception"): band, pinned hero
  // stage, short text, "Was du tun kannst", visible source line, visible chapter list.
  if (insight) {
    return (
      <div data-reader="focus" data-insight-chapter="" className="cs-chapter min-w-0 pb-12">
        {insightTopRow}
        <ChapterBand
          number={chapterNumber}
          total={allChapters.length}
          title={chapter.meta.title}
          band={chapter.meta.band}
          locale={locale}
          headingId="chapter-title"
          backHref={bookHref}
          bookTitle={bookTitle}
          pause={hasStage ? <ChapterPauseSwitch locale={locale} id="chapter-pause" /> : null}
        />
        <div className={`mx-auto min-w-0 max-w-[1424px] px-4 sm:px-6 ${hasStage ? "pt-0 sm:pt-2" : "pt-10 sm:pt-12"}`}>
          {content}
          <div className="mx-auto max-w-[68ch]">
            {chapterNavigation}
            <ChapterList bookId={book.id} chapters={allChapters} currentSlug={chapter.meta.slug} locale={locale} />
            {relatedCourse}
          </div>
        </div>
        {insightFocusBar}
        {runtime}
      </div>
    );
  }

  // Reader focus mode (docs/experience-system.md, "Reader focus mode"): the
  // attribute sits on the wrapper this route owns inside <main>, rendered on
  // the server, so the mobile tab bar is absent from the first paint and
  // nothing toggles after hydration.
  return (
    <div
      data-reader="focus"
      className={`mx-auto min-w-0 px-4 pb-12 pt-5 sm:px-6 sm:pt-7 ${hasFigures ? "max-w-[1424px]" : "max-w-6xl"}`}
    >
      {breadcrumb}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_224px]">
        <div className="min-w-0">
          <header className={`mb-6 border-l-[3px] border-brand-orange pl-4 ${hasFigures ? "mx-auto max-w-[68ch]" : ""}`}>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
              {copy.chapterPosition(chapterNumber, allChapters.length)}
            </p>
            <h1 className="mt-2 break-words text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
              {chapter.meta.title}
            </h1>
            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span className="break-words">{copy.readingTime(chapter.readingTimeMinutes)}</span>
              </span>
              <span className="hidden sm:block" aria-hidden="true">
                ·
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {bookTitle}
              </span>
            </div>
          </header>

          {content}
          {chapterNavigation}
          <ChapterList bookId={book.id} chapters={allChapters} currentSlug={chapter.meta.slug} locale={locale} />
          {relatedCourse}
        </div>

        <div className="no-print hidden lg:block">
          <div role="complementary" aria-label={copy.tocRegion} className="sticky top-24">
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
              {copy.tocHeading}
            </p>
            <nav aria-label={copy.tocRegion}>
              <ChapterTocLinks headings={chapter.headings} />
            </nav>

            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {book.pdfPath ? copy.pdfAvailable : copy.pdfUnavailable}
              </p>
              <Link
                href={bookHref}
                className="mt-2 inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground underline-offset-4 hover:text-brand-orange"
              >
                {copy.allChapters}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {focusBar}
      {runtime}
    </div>
  );
}
