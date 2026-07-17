"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";
import { ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";
import type { Book } from "@/lib/books";
import type {
  LoadedChapter,
  ChapterNeighbours,
  BookChapterMeta,
  TocHeading,
} from "@/lib/book-reader-content";
import { CalloutRenderer } from "./callout-renderer";
import {
  isInsideHorizontalScrollRegion,
  isInteractiveShortcutTarget,
} from "@/lib/a11y/keyboard-shortcuts";

interface ChapterReaderProps {
  readonly book: Book;
  readonly chapter: LoadedChapter;
  readonly neighbours: ChapterNeighbours;
  readonly allChapters: readonly BookChapterMeta[];
}

/** localStorage-backed scroll position. */
const PROGRESS_KEY = (slug: string, chapter: string) =>
  `reader:progress:${slug}:${chapter}`;

function saveProgress(bookSlug: string, chapterSlug: string) {
  try {
    const scrollPct =
      document.documentElement.scrollTop /
      (document.documentElement.scrollHeight -
        document.documentElement.clientHeight);
    if (Number.isFinite(scrollPct)) {
      localStorage.setItem(
        PROGRESS_KEY(bookSlug, chapterSlug),
        JSON.stringify({ scrollPct, lastRead: Date.now() })
      );
    }
  } catch {
    // localStorage may be blocked in private mode
  }
}

function restoreProgress(bookSlug: string, chapterSlug: string) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(bookSlug, chapterSlug));
    if (!raw) return;
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

export function ChapterReader({
  book,
  chapter,
  neighbours,
  allChapters,
}: ChapterReaderProps) {
  const router = useRouter();
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeHeading = useTocSpy(chapter.headings);

  // Restore scroll on mount. A fragment deep-link takes precedence over the
  // stored reading position: the browser's native anchor scroll happens
  // against the pre-hydration layout and drifts once fonts/prose settle
  // (visible on WebKit/iOS, regression coverage mobile finding), so we re-scroll
  // to the anchor explicitly after mount.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    restoreProgress(book.id, chapter.meta.slug);
  }, [book.id, chapter.meta.slug]);

  // Save scroll position on scroll (debounced 500ms)
  const handleScroll = useCallback(() => {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      saveProgress(book.id, chapter.meta.slug);
    }, 500);
  }, [book.id, chapter.meta.slug]);

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

  const chapterIndex = allChapters.findIndex((c) => c.slug === chapter.meta.slug);
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
        <span className="text-foreground">{chapter.meta.title}</span>
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
              {chapter.meta.title}
            </h1>
            <div className="mt-3 flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock size={11} aria-hidden="true" />
                Lesezeit: ca. {chapter.readingTimeMinutes}{" "}
                {chapter.readingTimeMinutes === 1 ? "Minute" : "Minuten"}
              </span>
              <span className="hidden sm:block" aria-hidden="true">·</span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <BookOpen size={11} aria-hidden="true" />
                {book.title}
              </span>
            </div>
          </header>

          {/* Chapter content */}
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
            className="prose prose-stone max-w-[70ch] [--tw-prose-body:var(--color-muted-foreground)] [--tw-prose-headings:var(--color-foreground)] [--tw-prose-bold:var(--color-foreground)] [--tw-prose-quotes:var(--color-foreground)] [--tw-prose-bullets:var(--color-muted-foreground)] [--tw-prose-counters:var(--color-muted-foreground)] [--tw-prose-captions:var(--color-muted-foreground)] prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-brand-orange prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-card/60 prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-pre:bg-stone-900 prose-table:text-sm"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSlug, [rehypeAutolink, { behavior: "wrap" }]]}
              components={{
                blockquote: ({ children }) => (
                  <CalloutRenderer>{children}</CalloutRenderer>
                ),
                // GitHub-Flavored-Markdown renders "- [ ]" lines as disabled
                // checkbox inputs. They are decorative (the list text carries
                // the meaning) and unlabeled, which axe/Lighthouse flag as a
                // "label" violation. Hide them from assistive tech (release hardening).
                input: ({ type, ...rest }) =>
                  type === "checkbox" ? (
                    <input
                      type="checkbox"
                      {...rest}
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                  ) : (
                    <input type={type} {...rest} />
                  ),
                // Book tables are wider than a phone viewport; without a
                // scroll container they clip past 390px (regression coverage
                // mobile finding). The wrapper keeps the page itself free of
                // horizontal overflow while the table scrolls in place. It is
                // keyboard-focusable with an accessible name so keyboard users
                // can scroll it (WCAG scrollable-region-focusable, release hardening).
                table: ({ children }) => (
                  <div
                    className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange"
                    data-horizontal-scroll
                    tabIndex={0}
                    role="group"
                    aria-label="Tabelle, horizontal scrollbar"
                  >
                    <table>{children}</table>
                  </div>
                ),
              }}
            >
              {chapter.rawMarkdown}
            </ReactMarkdown>
          </article>

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
                {chapter.headings.map((heading) => (
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
                Kein PDF-Download. Der Reader ist die verlässliche Lesefassung.
              </p>
              <Link
                href={`/buecher/${book.id}`}
                className="mt-2 inline-flex font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground underline-offset-4 hover:text-brand-orange hover:underline"
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
