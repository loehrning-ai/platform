"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { Locale } from "@/lib/i18n/locale";

interface BookTeaserProps {
  readonly bookId: string;
  readonly locale: Locale;
  readonly onClose: () => void;
}

type BookTeaserModule = typeof import("./book-teaser");

let teaserModulePromise: Promise<BookTeaserModule> | null = null;

function loadBookTeaser(): Promise<BookTeaserModule> {
  if (!teaserModulePromise) {
    teaserModulePromise = import("./book-teaser").catch((error: unknown) => {
      teaserModulePromise = null;
      throw error;
    });
  }
  return teaserModulePromise;
}

function previewIdFromEvent(event: Event): string | null {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  return (
    target.closest<HTMLElement>("[data-book-preview-id]")?.dataset
      .bookPreviewId ?? null
  );
}

/**
 * One tiny delegated client island for the catalog. The static catalog and its
 * LCP text stay server-owned; teaser imagery, focus management, and modal code
 * are fetched only after pointer/focus intent or activation.
 */
export function BookPreviewController({ locale }: { readonly locale: Locale }) {
  const [active, setActive] = useState<{
    readonly bookId: string;
    readonly Teaser: ComponentType<BookTeaserProps>;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const preload = (event: Event) => {
      if (!previewIdFromEvent(event)) return;
      void loadBookTeaser().catch(() => undefined);
    };

    const open = (event: Event) => {
      const bookId = previewIdFromEvent(event);
      if (!bookId) return;
      void loadBookTeaser()
        .then(({ BookTeaser }) => {
          if (mounted) setActive({ bookId, Teaser: BookTeaser });
        })
        .catch(() => undefined);
    };

    document.addEventListener("pointerover", preload, { passive: true });
    document.addEventListener("focusin", preload);
    document.addEventListener("click", open);

    return () => {
      mounted = false;
      document.removeEventListener("pointerover", preload);
      document.removeEventListener("focusin", preload);
      document.removeEventListener("click", open);
    };
  }, []);

  if (!active) return null;
  const { bookId, Teaser } = active;
  return (
    <Teaser bookId={bookId} locale={locale} onClose={() => setActive(null)} />
  );
}
