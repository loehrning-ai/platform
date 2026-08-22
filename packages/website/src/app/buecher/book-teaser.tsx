"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { BookOpen, X } from "lucide-react";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";
import { BrandButton } from "@/components/ui/brand-button";
import { getBookById, getBookPreviewPages } from "@/lib/books";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { BOOK_PAGE_COPY, getBookDisplay } from "./book-copy";

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

      <div className="relative z-10 flex max-h-[92svh] w-full min-w-0 max-w-4xl flex-col overflow-hidden overscroll-contain rounded-2xl border border-border bg-background shadow-card-hover">
        <div className="flex min-w-0 items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="overline mb-1 break-words">
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
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain bg-card/30 px-4 py-6 sm:px-6">
          <div className="flex gap-4 overflow-x-auto pb-3 sm:justify-center">
            {getBookPreviewPages(book).map((src, index) => (
              <Image
                key={src}
                src={src}
                alt={copy.pageAlt(display.title, index + 1)}
                width={778}
                height={1100}
                loading="lazy"
                sizes="(max-width: 640px) 190px, 240px"
                className="h-auto w-[190px] shrink-0 rounded-lg border border-border bg-background shadow-card sm:w-[240px]"
              />
            ))}
          </div>
          <p className="mx-auto mt-5 max-w-2xl break-words text-center text-sm leading-relaxed text-muted-foreground">
            {display.description}
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="break-words font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
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
