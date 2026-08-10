import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";
import type { Book } from "@/lib/books";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type {
  LoadedChapter,
  ChapterNeighbours,
  BookChapterMeta,
} from "@/lib/book-reader-content";
import { renderChapterMarkdownHtml } from "./chapter-markdown";
import {
  ChapterReaderClient,
  ChapterTocLinks,
} from "./chapter-reader-client";

interface ChapterReaderProps {
  readonly book: Book;
  readonly chapter: LoadedChapter;
  readonly neighbours: ChapterNeighbours;
  readonly allChapters: readonly BookChapterMeta[];
  readonly locale: Locale;
  readonly bookTitle: string;
  readonly relatedResourceLabel: string;
}

const READER_COPY = {
  de: {
    breadcrumbAria: "Brotkrümelnavigation",
    books: "Bücher",
    chapterPosition: (chapter: number, total: number) =>
      `Kapitel ${chapter} / ${total}`,
    readingTime: (minutes: number) =>
      `Lesezeit: ca. ${minutes} ${minutes === 1 ? "Minute" : "Minuten"}`,
    chapterNavigationAria: "Kapitelnavigation",
    previousChapter: (title: string) => `Vorheriges Kapitel: ${title}`,
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
      "Der Reader ist die verlässliche Lesefassung. Angemeldete Nutzer finden den PDF-Download auf der Buchübersicht.",
    pdfUnavailable:
      "Der Reader ist die verlässliche Lesefassung. Für dieses Buch gibt es derzeit keine PDF-Fassung.",
    allChapters: "Alle Kapitel",
  },
  en: {
    breadcrumbAria: "Breadcrumb",
    books: "Books",
    chapterPosition: (chapter: number, total: number) =>
      `Chapter ${chapter} of ${total}`,
    readingTime: (minutes: number) =>
      `Reading time: approx. ${minutes} ${minutes === 1 ? "minute" : "minutes"}`,
    chapterNavigationAria: "Chapter navigation",
    previousChapter: (title: string) => `Previous chapter: ${title}`,
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
      "The reader is the maintained reading edition. Signed-in users can find the German PDF on the book overview.",
    pdfUnavailable:
      "The reader is the maintained reading edition. No PDF edition is currently available for this book.",
    allChapters: "All chapters",
  },
} as const;

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
}: ChapterReaderProps) {
  const copy = READER_COPY[locale];
  const chapterIndex = allChapters.findIndex(
    (candidate) => candidate.slug === chapter.meta.slug,
  );
  const chapterNumber = chapterIndex + 1;
  const chapterHtml = renderChapterMarkdownHtml({
    rawMarkdown: chapter.rawMarkdown,
    locale,
  });
  const content = (
    <article
      aria-label={chapter.meta.title}
      // Prose colours are bound to the theme CSS variables, NOT the fixed
      // `prose-invert` (which forced light text and produced a 1.3:1
      // light-on-light body on the default Kalkweiss page - release hardening). The
      // vars flip with `prefers-color-scheme`, so body text is the
      // AAA-tuned muted-foreground (#4f4640 ~7:1 on light) in light mode
      // and the light token in dark mode. Tailwind darkMode is "class"
      // here, so `dark:prose-invert` would never fire under the media-query
      // theme; the var binding is the theme-aware fix.
      className="prose prose-stone min-w-0 max-w-[70ch] [overflow-wrap:anywhere] [--tw-prose-body:var(--color-muted-foreground)] [--tw-prose-headings:var(--color-foreground)] [--tw-prose-bold:var(--color-foreground)] [--tw-prose-quotes:var(--color-foreground)] [--tw-prose-bullets:var(--color-muted-foreground)] [--tw-prose-counters:var(--color-muted-foreground)] [--tw-prose-captions:var(--color-muted-foreground)] prose-headings:break-words prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:break-words prose-a:text-brand-orange prose-a:no-underline hover:prose-a:underline prose-code:break-words prose-code:rounded prose-code:bg-card/60 prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-pre:max-w-full prose-pre:overflow-x-auto prose-pre:bg-stone-900 prose-table:text-sm"
      dangerouslySetInnerHTML={{ __html: chapterHtml }}
    />
  );

  return (
    <div className="mx-auto min-w-0 max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pb-28 sm:pt-16">
      <nav
        aria-label={copy.breadcrumbAria}
        className="no-print mb-8 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
      >
        <Link
          href={localizeHref("/buecher", locale)}
          className="break-words hover:text-brand-orange"
        >
          {copy.books}
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={localizeHref(`/buecher/${book.id}`, locale)}
          className="min-w-0 break-words hover:text-brand-orange"
        >
          {bookTitle}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="min-w-0 break-words text-foreground">
          {chapter.meta.title}
        </span>
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <header className="mb-8">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              {copy.chapterPosition(chapterNumber, allChapters.length)}
            </p>
            <h1 className="mt-2 break-words text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
              {chapter.meta.title}
            </h1>
            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] text-muted-foreground">
              <span className="flex min-w-0 items-center gap-1.5">
                <Clock size={11} aria-hidden="true" />
                <span className="break-words">
                  {copy.readingTime(chapter.readingTimeMinutes)}
                </span>
              </span>
              <span className="hidden sm:block" aria-hidden="true">
                ·
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <BookOpen size={11} aria-hidden="true" />
                {bookTitle}
              </span>
            </div>
          </header>

          {content}

          <nav
            aria-label={copy.chapterNavigationAria}
            className="no-print mt-12 grid min-w-0 grid-cols-2 items-center gap-3 border-t border-border pt-6 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
          >
            {neighbours.prev ? (
              <Link
                href={localizeHref(
                  `/buecher/${book.id}/${neighbours.prev.slug}`,
                  locale,
                )}
                className="flex min-h-11 min-w-0 max-w-full items-center justify-self-start border border-border/50 bg-card/20 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange sm:px-4"
                aria-label={copy.previousChapter(neighbours.prev.title)}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                <span className="hidden min-w-0 break-words md:block">
                  {neighbours.prev.title}
                </span>
                <span className="md:hidden">{copy.previousShort}</span>
              </Link>
            ) : (
              <Link
                href={localizeHref(`/buecher/${book.id}`, locale)}
                className="flex min-h-11 min-w-0 max-w-full items-center justify-self-start text-sm text-muted-foreground hover:text-brand-orange"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                <span className="break-words">{copy.contents}</span>
              </Link>
            )}

            <span
              className="hidden font-mono text-[10px] text-muted-foreground sm:block"
              aria-hidden="true"
            >
              ← → {copy.keyboardHint}
            </span>

            {neighbours.next ? (
              <Link
                href={localizeHref(
                  `/buecher/${book.id}/${neighbours.next.slug}`,
                  locale,
                )}
                className="flex min-h-11 min-w-0 max-w-full items-center justify-self-end border border-border/50 bg-card/20 px-3 py-2 text-right text-sm font-semibold text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange sm:px-4"
                aria-label={copy.nextChapter(neighbours.next.title)}
              >
                <span className="hidden min-w-0 break-words md:block">
                  {neighbours.next.title}
                </span>
                <span className="md:hidden">{copy.nextShort}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ) : (
              <Link
                href={localizeHref(`/buecher/${book.id}`, locale)}
                className="flex min-h-11 min-w-0 max-w-full items-center justify-self-end text-right text-sm text-muted-foreground hover:text-brand-orange"
              >
                <span className="break-words">{copy.chapterOverview}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </nav>

          <div className="mt-6 text-center">
            <Link
              href={localizeHref(book.relatedResourceHref, locale)}
              className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:text-brand-orange hover:underline"
            >
              {copy.relatedCourse(relatedResourceLabel)}
            </Link>
          </div>
        </div>

        <div className="no-print hidden lg:block">
          <div
            role="complementary"
            aria-label={copy.tocRegion}
            className="sticky top-24"
          >
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {copy.tocHeading}
            </p>
            <nav aria-label={copy.tocRegion}>
              <ChapterTocLinks headings={chapter.headings} />
            </nav>

            <div className="mt-6 border-t border-border pt-4">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {book.pdfPath ? copy.pdfAvailable : copy.pdfUnavailable}
              </p>
              <Link
                href={localizeHref(`/buecher/${book.id}`, locale)}
                className="mt-2 inline-flex font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground underline-offset-4 hover:text-brand-orange"
              >
                {copy.allChapters}
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Keep the only reader runtime boundary after all server-owned markup.
          A hostless client boundary before the grid could advance React's
          hydration cursor into the grid during concurrent streamed retries. */}
      <ChapterReaderClient
        bookId={book.id}
        chapterSlug={chapter.meta.slug}
        neighbours={neighbours}
        locale={locale}
      />
    </div>
  );
}
