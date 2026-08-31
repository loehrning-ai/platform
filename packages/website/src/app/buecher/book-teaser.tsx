"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { BookOpen, X } from "lucide-react";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";
import { BrandButton } from "@/components/ui/brand-button";
import { getBookById, getBookPreviewPages } from "@/lib/books";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { BOOK_PAGE_COPY, getBookDisplay } from "./book-copy";

const PREVIEW_TRANSFORMS = [
  "sm:translate-y-4 sm:-rotate-2",
  "sm:-translate-y-1",
  "sm:translate-y-5 sm:rotate-2",
] as const;

export function BookTeaser({
  bookId,
  locale,
  onClose,
}: {
  readonly bookId: string;
  readonly locale: Locale;
  readonly onClose: () => void;
}) {
  const book = getBookById(bookId);
  const closeRef = useRef<HTMLButtonElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(true, onClose);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!book) return null;
  const copy = BOOK_PAGE_COPY[locale].teaser;
  const display = getBookDisplay(book, locale);

  return (
    <div
      id={`book-teaser-${book.id}`}
      ref={trapRef}
      className="fixed inset-0 z-[100] flex items-center justify-center overscroll-contain p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={copy.dialogLabel(display.title)}
    >
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-foreground/65 backdrop-blur-sm"
      />

      <div className="relative z-10 flex max-h-[92svh] w-full min-w-0 max-w-6xl flex-col overflow-hidden overscroll-contain bg-paper shadow-card ring-1 ring-foreground/40">
        <div className="relative flex min-w-0 items-start justify-between gap-4 overflow-hidden border-b border-foreground/20 bg-brand-peach/60 px-4 py-4 sm:px-6">
          <span
            className="pointer-events-none absolute -bottom-8 right-20 h-16 w-36 -rotate-6 bg-brand-acid/75"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="mb-1 break-words font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
              {copy.kicker(book.chapters)}
            </p>
            <h2 className="break-words text-xl font-bold tracking-[-0.03em]">
              {display.title}
            </h2>
            <p className="mt-1 break-words text-sm italic text-muted-foreground">
              {display.subtitle}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="relative inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center bg-paper text-muted-foreground ring-1 ring-foreground/30 transition-colors hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain bg-paper px-4 py-6 sm:px-8 sm:py-8">
          <div
            className="grid grid-flow-col auto-cols-[76%] gap-4 overflow-x-auto px-2 pb-5 pt-2 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-3 sm:overflow-visible sm:px-5 sm:pb-8"
            data-image-showcase
            data-testid="book-preview-showcase"
          >
            {getBookPreviewPages(book).map((src, index) => (
              <div
                key={src}
                className={`relative min-w-0 border border-foreground bg-background p-1 ${PREVIEW_TRANSFORMS[index % PREVIEW_TRANSFORMS.length]}`}
              >
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center border border-foreground bg-background font-mono text-xs font-bold text-brand-orange">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Image
                  src={src}
                  alt={copy.pageAlt(display.title, index + 1)}
                  width={778}
                  height={1100}
                  loading="lazy"
                  sizes="(max-width: 640px) 76vw, 280px"
                  className="h-auto w-full bg-background"
                />
              </div>
            ))}
          </div>
          <p className="mx-auto mt-3 max-w-2xl border-l-[3px] border-foreground bg-brand-acid/35 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {display.description}
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="break-words font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
            {copy.materialNote}
          </span>
          <BrandButton href={localizeHref(book.readerHref, locale)} size="sm">
            <BookOpen size={14} aria-hidden="true" />
            {copy.openOverview}
          </BrandButton>
        </div>
      </div>
    </div>
  );
}
