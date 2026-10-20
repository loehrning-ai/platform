import Link from "next/link";
import type { BookChapterMeta } from "@/lib/book-reader-content";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

/**
 * The chapters of the book as a visible list: number, title, one link each.
 * It replaces the contents sheet of the phone reader, which was a collapsible.
 * Server markup, no script; the current chapter is marked with aria-current.
 */

const COPY = {
  de: { heading: "Alle Kapitel", aria: "Alle Kapitel des Buchs" },
  en: { heading: "All chapters", aria: "All chapters of the book" },
} as const;

export function ChapterList({
  bookId,
  chapters,
  currentSlug,
  locale,
  showNumerals = false,
}: {
  readonly bookId: string;
  readonly chapters: readonly BookChapterMeta[];
  readonly currentSlug?: string;
  readonly locale: Locale;
  /** Print each chapter's hero number (band.numeral) at the end of its row. */
  readonly showNumerals?: boolean;
}) {
  const copy = COPY[locale];
  return (
    <nav aria-label={copy.aria} data-chapter-list className="mt-10 border-t-2 border-foreground pt-3">
      <h2 className="text-lg font-bold tracking-tight text-foreground">{copy.heading}</h2>
      <ol className="mt-2 grid min-w-0 sm:grid-cols-2 sm:gap-x-8">
        {chapters.map((chapter, index) => {
          const current = chapter.slug === currentSlug;
          return (
            <li key={chapter.slug} className="min-w-0 border-b border-hairline">
              <Link
                href={localizeHref(`/buecher/${bookId}/${chapter.slug}`, locale)}
                aria-current={current ? "page" : undefined}
                hrefLang={locale}
                lang={locale}
                className={`group grid min-h-11 min-w-0 items-center gap-3 ${showNumerals ? "grid-cols-[2rem_minmax(0,1fr)_auto]" : "grid-cols-[2rem_minmax(0,1fr)]"} py-2 text-foreground outline-none hover:bg-brand-orange hover:text-background focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-orange active:translate-y-px active:bg-foreground active:text-background`}
              >
                <span className="font-bold tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                <span className={`min-w-0 break-words leading-snug ${current ? "font-bold underline decoration-2 underline-offset-4" : "font-medium"}`}>
                  {chapter.title}
                </span>
                {showNumerals && chapter.band ? (
                  <span className="font-bold tabular-nums" data-chapter-numeral="">
                    {chapter.band.numeral}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
