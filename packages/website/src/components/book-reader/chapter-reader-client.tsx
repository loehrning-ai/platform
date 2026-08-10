"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { ChapterNeighbours, TocHeading } from "@/lib/book-reader-content";
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
  readonly bookId: string;
  readonly chapterSlug: string;
  readonly neighbours: ChapterNeighbours;
  readonly locale: Locale;
}

interface ChapterTocLinksProps {
  readonly headings: TocHeading[];
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
    const raw = getOwnedLocalLearningItem(PROGRESS_KEY(bookSlug, chapterSlug));
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

/** TOC scroll-spy for the isolated, plain-data TOC list island. */
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
      { rootMargin: "-20% 0px -35% 0px" },
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
  bookId,
  chapterSlug,
  neighbours,
  locale,
}: ChapterReaderClientProps) {
  const router = useRouter();
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ownerGenerationRef = useRef(getLearningOwnerContext().generation);
  const runtimeMarkerRef = useRef<HTMLSpanElement>(null);
  const readiness = `${bookId}:${chapterSlug}`;

  // Restore scroll on mount. A fragment deep-link takes precedence over the
  // stored reading position: the browser's native anchor scroll happens
  // against the pre-hydration layout and drifts once fonts/prose settle
  // (visible on WebKit/iOS, regression coverage mobile finding), so we re-scroll
  // to the anchor explicitly after mount.
  useEffect(() => {
    ownerGenerationRef.current = getLearningOwnerContext().generation;
    restoreFragmentOrProgress(bookId, chapterSlug);
    return subscribeLearningOwner((owner) => {
      clearTimeout(scrollTimer.current);
      ownerGenerationRef.current = owner.generation;
      restoreFragmentOrProgress(bookId, chapterSlug);
    });
  }, [bookId, chapterSlug]);

  // Save scroll position on scroll (debounced 500ms)
  const handleScroll = useCallback(() => {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      saveProgress(bookId, chapterSlug, ownerGenerationRef.current);
    }, 500);
  }, [bookId, chapterSlug]);

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
        router.push(
          localizeHref(`/buecher/${bookId}/${neighbours.prev.slug}`, locale),
        );
      } else if (e.key === "ArrowRight" && neighbours.next) {
        e.preventDefault();
        router.push(
          localizeHref(`/buecher/${bookId}/${neighbours.next.slug}`, locale),
        );
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [bookId, locale, neighbours, router]);

  useEffect(() => {
    const marker = runtimeMarkerRef.current;
    if (!marker) return;

    marker.dataset.bookReaderReady = readiness;
    return () => {
      if (marker.dataset.bookReaderReady === readiness) {
        delete marker.dataset.bookReaderReady;
      }
    };
  }, [readiness]);

  return (
    <span
      ref={runtimeMarkerRef}
      data-book-reader-runtime={readiness}
      hidden
      aria-hidden="true"
    />
  );
}

export function ChapterTocLinks({ headings }: ChapterTocLinksProps) {
  const activeHeading = useTocSpy(headings);

  return (
    <ul className="space-y-1.5">
      {headings.map((heading) => {
        const active = activeHeading === heading.id;
        return (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={active ? "location" : undefined}
              className={`flex min-h-[24px] min-w-0 items-center break-words text-[13px] leading-snug underline-offset-4 transition-colors hover:text-brand-orange hover:underline ${
                heading.level === 3 ? "pl-3" : ""
              } ${
                active
                  ? "font-semibold text-brand-orange"
                  : "text-muted-foreground"
              }`}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
