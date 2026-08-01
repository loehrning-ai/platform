"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";
import type { Book } from "@/lib/books";
import type {
  ChapterNeighbours,
  BookChapterMeta,
  TocHeading,
} from "@/lib/book-reader-content";
import {
  isInsideHorizontalScrollRegion,
  isInteractiveShortcutTarget,
} from "@/lib/a11y/keyboard-shortcuts";
import {
  getLearningOwnerContext,
  getOwnedLocalLearningItem,
  setOwnedLocalLearningItem,
  subscribeLearningOwner,
} from "@/lib/progress/browser-learning-storage";

interface ChapterReaderClientProps {
  readonly book: Book;
  readonly chapterMeta: BookChapterMeta;
  readonly headings: TocHeading[];
  readonly readingTimeMinutes: number;
  readonly neighbours: ChapterNeighbours;
  readonly allChapters: readonly BookChapterMeta[];
  /** Chapter body, rendered server-side (react-markdown in RSC). */
  readonly content: ReactNode;
}

/** localStorage-backed scroll position. */
const PROGRESS_KEY = (slug: string, chapter: string) =>
  `reader:progress:${slug}:${chapter}`;

function saveProgress(
  bookSlug: string,
  chapterSlug: string,
  ownerGeneration: number,
) {
  try {
    const scrollPct =
      document.documentElement.scrollTop /
      (document.documentElement.scrollHeight -
        document.documentElement.clientHeight);
    if (Number.isFinite(scrollPct)) {
      setOwnedLocalLearningItem(
        PROGRESS_KEY(bookSlug, chapterSlug),
        JSON.stringify({ scrollPct, lastRead: Date.now() }),
        ownerGeneration,
      );
    }
  } catch {
    // localStorage may be blocked in private mode
  }
}

function restoreProgress(bookSlug: string, chapterSlug: string) {
  try {
    const raw = getOwnedLocalLearningItem(
      PROGRESS_KEY(bookSlug, chapterSlug),
    );
    if (!raw) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const { scrollPct } = JSON.parse(raw) as { scrollPct: number };
    if (scrollPct > 0.02) {
      const target =
        scrollPct *
        (document.documentElement.scrollHeight -
          document.documentElement.clientHeight);
      window.scrollTo({ top: target, behavior: "instant" });
    }
  } catch {
    // ignore
  }
}

/**
 * Restore the current in-page fragment when it resolves to a real element.
 *
 * Fragment navigation takes precedence over stored reader progress not only
 * during the initial mount, but also when the learning-data owner changes
 * after authentication resolution. A malformed percent-encoded fragment must
 * never abort the reader effect; it simply cannot be restored.
 */
function restoreResolvableFragment(): boolean {
  const encodedFragment = window.location.hash.slice(1);
  if (!encodedFragment) return false;

  let fragment: string;
  try {
    fragment = decodeURIComponent(encodedFragment);
  } catch {
    return false;
  }

  const target = document.getElementById(fragment);
  if (!target) return false;

  target.scrollIntoView();
  return true;
}

function restoreFragmentOrProgress(bookSlug: string, chapterSlug: string) {
  if (!restoreResolvableFragment()) {
    restoreProgress(bookSlug, chapterSlug);
  }
}

/** TOC scroll-spy: highlights the active heading in the sidebar. */
function useTocSpy(headings: TocHeading[]): string {
  const [active, setActive] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -35% 0px" }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  return active;
}

export function ChapterReaderClient({
  book,
  chapterMeta,
  headings,
  readingTimeMinutes,
  neighbours,
  allChapters,
  content,
}: ChapterReaderClientProps) {
  const router = useRouter();
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ownerGenerationRef = useRef(
    getLearningOwnerContext().generation,
  );
  const activeHeading = useTocSpy(headings);

  // Restore scroll on mount. A fragment deep-link takes precedence over the
  // stored reading position: the browser's native anchor scroll happens
  // against the pre-hydration layout and drifts once fonts/prose settle
  // (visible on WebKit/iOS, regression coverage mobile finding), so we re-scroll
  // to the anchor explicitly after mount.
  useEffect(() => {
    ownerGenerationRef.current =
      getLearningOwnerContext().generation;
    restoreFragmentOrProgress(book.id, chapterMeta.slug);
    return subscribeLearningOwner((owner) => {
      clearTimeout(scrollTimer.current);
      ownerGenerationRef.current = owner.generation;
      restoreFragmentOrProgress(book.id, chapterMeta.slug);
    });
  }, [book.id, chapterMeta.slug]);

  // Save scroll position on scroll (debounced 500ms)
  const handleScroll = useCallback(() => {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      saveProgress(
        book.id,
        chapterMeta.slug,
        ownerGenerationRef.current,
      );
    }, 500);
  }, [book.id, chapterMeta.slug]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimer.current);
    };
  }, [handleScroll]);

  // Keyboard navigation: ArrowLeft / ArrowRight
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isInteractiveShortcutTarget(e.target)) return;
      if (isInsideHorizontalScrollRegion(e.target)) return;

      if (e.key === "ArrowLeft" && neighbours.prev) {
        e.preventDefault();
        router.push(`/buecher/${book.id}/${neighbours.prev.slug}`);
      } else if (e.key === "ArrowRight" && neighbours.next) {
        e.preventDefault();
        router.push(`/buecher/${book.id}/${neighbours.next.slug}`);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [book.id, neighbours, router]);

  const chapterIndex = allChapters.findIndex((c) => c.slug === chapterMeta.slug);
  const chapterNumber = chapterIndex + 1;

  return (
    <div className="mx-auto max-w-6xl px-6 pb-28 pt-16">
      {/* Print hide: everything except article */}
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="no-print mb-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
      >
        <Link href="/buecher" className="hover:text-brand-orange">
          Bücher
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/buecher/${book.id}`} className="hover:text-brand-orange">
          {book.title}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">{chapterMeta.title}</span>
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
        {/* ── Main content ──────────────────────────────────────── */}
        <div>
          {/* Chapter header */}
          <header className="mb-8">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              Kapitel {chapterNumber} / {allChapters.length}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
              {chapterMeta.title}
            </h1>
            <div className="mt-3 flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock size={11} aria-hidden="true" />
                Lesezeit: ca. {readingTimeMinutes}{" "}
                {readingTimeMinutes === 1 ? "Minute" : "Minuten"}
              </span>
              <span className="hidden sm:block" aria-hidden="true">·</span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <BookOpen size={11} aria-hidden="true" />
                {book.title}
              </span>
            </div>
          </header>

          {/* Chapter content (rendered server-side) */}
          {content}

          {/* Chapter nav: bottom */}
          <nav
            aria-label="Kapitelnavigation"
            className="no-print mt-12 flex items-center justify-between gap-4 border-t border-border pt-6"
          >
            {neighbours.prev ? (
              <Link
                href={`/buecher/${book.id}/${neighbours.prev.slug}`}
                className="flex items-center gap-2 rounded-none border border-border/50 bg-card/20 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
                aria-label={`Vorheriges Kapitel: ${neighbours.prev.title}`}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                <span className="hidden sm:block">{neighbours.prev.title}</span>
                <span className="sm:hidden">Zurück</span>
              </Link>
            ) : (
              <Link
                href={`/buecher/${book.id}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-orange"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Inhaltsverzeichnis
              </Link>
            )}

            {/* Keyboard hint */}
            <span className="hidden font-mono text-[10px] text-muted-foreground sm:block" aria-hidden="true">
              ← → Tastenkürzel
            </span>

            {neighbours.next ? (
              <Link
                href={`/buecher/${book.id}/${neighbours.next.slug}`}
                className="flex items-center gap-2 rounded-none border border-border/50 bg-card/20 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange"
                aria-label={`Nächstes Kapitel: ${neighbours.next.title}`}
              >
                <span className="hidden sm:block">{neighbours.next.title}</span>
                <span className="sm:hidden">Weiter</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ) : (
              <Link
                href={`/buecher/${book.id}`}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-orange"
              >
                Kapitelübersicht
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </nav>

          {/* Back to course */}
          <div className="mt-6 text-center">
            <Link
              href={book.relatedResourceHref}
              className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:text-brand-orange hover:underline"
            >
              Zurück zum Kurs: {book.relatedResourceLabel}
            </Link>
          </div>
        </div>

        {/* ── Sidebar TOC ──────────────────────────────────────── */}
        <div className="no-print hidden lg:block">
          <div
            role="complementary"
            aria-label="Kapitelinhalt"
            className="sticky top-24"
          >
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              In diesem Kapitel
            </p>
            <nav aria-label="Kapitelinhalt">
              <ul className="space-y-1.5">
                {headings.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className={`flex min-h-[24px] items-center text-[13px] leading-snug underline-offset-4 transition-colors hover:text-brand-orange hover:underline ${
                        heading.level === 3 ? "pl-3" : ""
                      } ${
                        activeHeading === heading.id
                          ? "font-semibold text-brand-orange"
                          : "text-muted-foreground"
                      }`}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 border-t border-border pt-4">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {book.pdfPath
                  ? "Der Reader ist die verlässliche Lesefassung. Angemeldete Nutzer finden den PDF-Download auf der Buchübersicht."
                  : "Der Reader ist die verlässliche Lesefassung. Für dieses Buch gibt es derzeit keine PDF-Fassung."}
              </p>
              <Link
                href={`/buecher/${book.id}`}
                className="mt-2 inline-flex font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground underline-offset-4 hover:text-brand-orange"
              >
                Alle Kapitel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
