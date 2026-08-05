"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { m } from "framer-motion";
import { BookOpen, Lock, X } from "lucide-react";
import { fadeUp, EASE_OUT_EXPO } from "@/lib/animations";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";
import { BrandButton } from "@/components/ui/brand-button";
import { books, getBookCover, getBookPreviewPages, type Book } from "@/lib/books";

/* ── Teaser modal — preview the real book before downloading ─────────── */
function BookTeaser({ book, onClose }: { book: Book; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  // House focus trap (performance hardening): Tab cycles inside the dialog, Escape
  // closes, and focus returns to the trigger that opened the teaser. The old
  // hand-rolled listener handled Escape only — Tab escaped into the page
  // behind the overlay and focus was dropped on close.
  const trapRef = useFocusTrap<HTMLDivElement>(true, onClose);

  useEffect(() => {
    // The trap focuses the first focusable (the invisible overlay button);
    // move initial focus to the visible X button instead.
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      ref={trapRef}
      className="fixed inset-0 z-[100] flex items-center justify-center overscroll-contain p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Vorschau: ${book.title}`}
    >
      {/* Overlay (click to close) */}
      <button
        type="button"
        aria-label="Vorschau schließen"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-foreground/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <m.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden overscroll-contain rounded-2xl border border-border bg-background shadow-card-hover"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <p className="overline mb-1">Vorschau · {book.chapters} Kapitel</p>
            <h2 className="text-xl font-bold tracking-[-0.03em]">{book.title}</h2>
            <p className="text-sm italic text-muted-foreground">{book.subtitle}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Vorschau schließen"
            className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview pages */}
        <div className="flex-1 overflow-y-auto overscroll-contain bg-card/30 px-6 py-6">
          <div className="flex gap-4 overflow-x-auto pb-2 sm:justify-center">
            {getBookPreviewPages(book).map((src, i) => (
              <Image
                key={src}
                src={src}
                alt={`${book.title}, Seite ${i + 1}`}
                width={778}
                height={1100}
                loading="lazy"
                sizes="(max-width: 640px) 190px, 230px"
                className="h-auto w-[190px] shrink-0 rounded-lg border border-border bg-background shadow-card sm:w-[230px]"
              />
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            {book.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 border-t border-border px-6 py-4 sm:flex-row sm:justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Vorschau · kostenlos · kein Konto nötig
          </span>
          <BrandButton href={book.readerHref} size="sm">
            <BookOpen size={14} aria-hidden="true" />
            Buch lesen
          </BrandButton>
        </div>
      </m.div>
    </div>
  );
}

export function BuecherContent({
  accountEnabled,
}: {
  readonly accountEnabled: boolean;
}) {
  const [active, setActive] = useState<Book | null>(null);
  // Stable identity so the teaser's focus-trap effect never re-runs (and
  // never yanks focus) on a parent re-render.
  const closeTeaser = useCallback(() => setActive(null), []);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border/50 py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <m.p
            initial={false}
            animate={{ opacity: 1 }}
            className="js-reveal overline mb-6"
          >
            Bücher
          </m.p>
          <m.h1
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="js-reveal text-4xl font-bold tracking-[-0.04em] sm:text-5xl"
          >
            {books.length === 1 ? "1 Lesefassung." : `${books.length} Lesefassungen.`}
            <br />
            <span className="text-brand-orange">Kostenlos nutzbar.</span>
          </m.h1>
          <m.p
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="js-reveal mt-6 text-lg text-muted-foreground"
          >
            {books.length === 1
              ? "1 Lernbuch zu KI. Kostenlos online lesbar, keine Registrierung nötig."
              : `${books.length} Lernbücher zu KI. Kostenlos online lesbar, keine Registrierung nötig.`}{" "}
            Jedes Buch vertieft einen Kurs auf dieser Plattform.
          </m.p>
        </div>
      </section>

      {/* Books */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="space-y-8">
            {books.map((book, i) => (
              <m.div
                key={book.id}
                data-testid="book-card"
                {...(i === 0
                  ? { initial: false }
                  : {
                      initial: { opacity: 0, y: 20 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, margin: "-40px" },
                      transition: { delay: i * 0.1, duration: 0.5 },
                    })}
                id={book.id}
                className={[
                  "js-reveal rounded-xl border border-border bg-card p-6 shadow-card sm:p-8",
                  i === 0 && "border-t-[3px] border-t-brand-orange",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
                  {/* Cover — click for the teaser preview */}
                  <button
                    type="button"
                    onClick={() => setActive(book)}
                    className="group/cover block shrink-0"
                    aria-label={`Vorschau von „${book.title}" ansehen`}
                  >
                    {/* The first cover is the above-the-fold LCP candidate on
                        /buecher. Render and request it immediately; later
                        covers keep their lazy-loading behavior. */}
                    <Image
                      src={getBookCover(book)}
                      alt={`Titelseite: ${book.title}`}
                      width={778}
                      height={1100}
                      {...(i === 0
                        ? {
                            loading: "eager" as const,
                            fetchPriority: "high" as const,
                          }
                        : { loading: "lazy" as const })}
                      sizes="(max-width: 640px) 160px, (max-width: 1024px) 176px, 192px"
                      className="mx-auto h-auto w-40 rounded-lg border border-border bg-card shadow-card transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200 group-hover/cover:-translate-y-1 group-hover/cover:shadow-card-hover sm:w-44 lg:w-48"
                    />
                    <span className="mt-3 block text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors group-hover/cover:text-brand-orange">
                      Vorschau ansehen
                    </span>
                  </button>

                  {/* Details */}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold tracking-[-0.03em]">{book.title}</h2>
                    <p className="mt-1 text-sm italic text-muted-foreground">{book.subtitle}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-kupfer-mist px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                        {book.audience}
                      </span>
                      <span className="rounded-full bg-card-hover px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {book.chapters} Kapitel
                      </span>
                      <span className="rounded-full bg-card-hover px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {book.resourceType}
                      </span>
                      <span className="rounded-full bg-card-hover px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {book.accessLabel}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {book.description}
                    </p>

                    <ul className="mt-4 space-y-1.5">
                      {book.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="h-1 w-1 shrink-0 rounded-full bg-brand-orange" />
                          {h}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <BrandButton href={book.readerHref} size="sm">
                        <BookOpen size={14} aria-hidden="true" />
                        Reader öffnen
                      </BrandButton>
                      <BrandButton
                        variant="outline"
                        surface="light"
                        size="sm"
                        onClick={() => setActive(book)}
                      >
                        Vorschau öffnen
                      </BrandButton>
                      {book.pdfPath &&
                        (accountEnabled ? (
                          <Link
                            href={`/login?next=${encodeURIComponent(book.pdfPath)}`}
                            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-brand-orange"
                          >
                            <Lock size={12} aria-hidden="true" />
                            PDF nach Login
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                            <Lock size={12} aria-hidden="true" />
                            PDF-Download nicht verfügbar
                          </span>
                        ))}
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {book.statusLabel}
                      </span>
                    </div>
                    <Link
                      href={book.relatedResourceHref}
                      className="mt-4 inline-flex font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-orange underline-offset-4 hover:underline"
                    >
                      {book.relatedResourceLabel}
                    </Link>
                  </div>
                </div>
              </m.div>
            ))}
          </div>

          <m.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="js-reveal mt-8 text-xs text-muted"
          >
            Die Lesefassungen nutzen Original-Recherche von Tim Löhr
            (2025-2026) als Hintergrundmaterial.{" "}
            {accountEnabled
              ? "PDF-Downloads stehen angemeldeten Nutzern zur Verfügung."
              : "PDF-Downloads sind in dieser Version deaktiviert."}{" "}
            Stand: Q3 2026.
          </m.p>
        </div>
      </section>

      {/* Learning bridge */}
      <section className="relative bg-card/20 py-32">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div
            className="h-[400px] w-[600px] rounded-full"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at center, color-mix(in srgb, var(--color-brand-orange) 8%, transparent) 0%, transparent 70%)",
            }}
          />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="js-reveal"
          >
            <m.h2
              custom={0}
              variants={fadeUp}
              className="js-reveal text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
            >
              Vom Lesen ins Üben.
            </m.h2>
            <m.p
              custom={1}
              variants={fadeUp}
              className="js-reveal mt-4 text-lg text-muted-foreground"
            >
              Die Kurse übersetzen die Themen in Lektionen, Quizfragen,
              Übungen und lokale Fortschrittsstände.
            </m.p>
            <m.div custom={2} variants={fadeUp} className="js-reveal mt-8">
              <BrandButton href="/kurse" size="lg">
                Kurse ansehen
              </BrandButton>
            </m.div>
          </m.div>
        </div>
      </section>

      {/* Teaser modal */}
      {active && <BookTeaser book={active} onClose={closeTeaser} />}
    </>
  );
}
