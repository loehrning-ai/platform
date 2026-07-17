export const runtime = "nodejs";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { books, getBookById } from "@/lib/books";
import { getBookChapterList, loadBookManifest } from "@/lib/book-reader-content";
import { ResourceContextBanner } from "@/components/learning/resource-context-banner";
import { BookOpen, Clock, ChevronRight } from "lucide-react";

interface Params {
  readonly params: Promise<{ readonly slug: string }>;
}

export function generateStaticParams() {
  return books.map((book) => ({ slug: book.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const book = getBookById(slug);
  if (!book) return {};
  return {
    title: `${book.title} | Lernbuch`,
    description: `${book.subtitle}. Kostenlos online lesen, kein Login nötig.`,
    robots: { index: true, follow: true },
    alternates: { canonical: book.readerHref },
  };
}

export default async function BookOverviewPage({ params }: Params) {
  const { slug } = await params;
  const book = getBookById(slug);
  if (!book) notFound();

  let chapters;
  try {
    chapters = await getBookChapterList(slug);
  } catch {
    notFound();
  }

  let manifest;
  try {
    manifest = await loadBookManifest(slug);
  } catch {
    manifest = null;
  }

  return (
    <>
      <ResourceContextBanner nodeId={`book:${book.id}`} />

      <div className="mx-auto max-w-5xl px-6 pb-28 pt-20">
        {/* Book header */}
        <div className="h-[3px] w-28 bg-brand-orange" />
        <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          Lernbuch · kostenlos · kein Login nötig
        </p>

        <div className="mt-5">
          <h1 className="text-4xl font-bold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-5xl">
            {book.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground italic">{book.subtitle}</p>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {book.description}
          </p>

          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <BookOpen size={11} aria-hidden="true" />
              <dt className="sr-only">Kapitel</dt>
              <dd>{chapters.length} Kapitel</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} aria-hidden="true" />
              <dt className="sr-only">Lesezeit</dt>
              <dd>ca. {book.readingTimeMinutes} Min.</dd>
            </div>
            <div>
              <dt className="sr-only">Stand</dt>
              <dd>Stand {book.lastReviewed}</dd>
            </div>
            <div>
              <dt className="sr-only">Sprache</dt>
              <dd>Deutsch</dd>
            </div>
          </dl>

          {/* Kein PDF note */}
          <p className="mt-3 text-xs text-muted-foreground">
            Kein PDF-Download. Kostenlos online lesen, in der jeweils aktuellen Fassung.
          </p>
        </div>

        {/* Adaptation note (from manifest) */}
        {manifest?.adaptationNote && (
          <div className="mt-8 border-l-4 border-stone-500 bg-stone-900/40 px-4 py-3 text-sm text-foreground/80">
            <strong className="font-semibold text-foreground">Hinweis:</strong>{" "}
            {manifest.adaptationNote}
          </div>
        )}

        {/* Chapter list */}
        <nav aria-label="Inhaltsverzeichnis" className="mt-10">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Inhaltsverzeichnis
          </h2>
          <ol className="space-y-2">
            {chapters.map((chapter, idx) => (
              <li key={chapter.slug}>
                <Link
                  href={`/buecher/${slug}/${chapter.slug}`}
                  className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-card transition-[background-color,border-color,box-shadow] hover:border-brand-orange hover:bg-card-hover hover:shadow-card-hover"
                >
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-foreground group-hover:text-brand-orange">
                    {chapter.title}
                  </span>
                  {chapter.readingTimeMinutes && (
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {chapter.readingTimeMinutes} Min.
                    </span>
                  )}
                  <ChevronRight
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-orange"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        {/* Related course link */}
        <div className="mt-10 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            Dieses Buch begleitet den Kurs:{" "}
            <Link
              href={book.relatedResourceHref}
              className="font-semibold text-brand-orange underline-offset-4 hover:underline"
            >
              {book.relatedResourceLabel}
            </Link>
          </p>
          <Link
            href="/buecher"
            className="mt-4 inline-flex font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground underline-offset-4 hover:text-brand-orange hover:underline"
          >
            Zur Buchübersicht
          </Link>
        </div>
      </div>
    </>
  );
}
