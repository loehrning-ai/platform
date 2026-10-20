import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { CapsLine, PlakatBand } from "@/components/plakat";
import { formatDecimal, formatValue, quantityFor, type FigureSpec } from "@/lib/figures";
import type { Book } from "@/lib/books";
import type { BookChapterMeta, ResolvedLanding } from "@/lib/book-reader-content";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
import type { LocalizedBookDisplay } from "@/app/buecher/book-copy";
import { LANDING_COPY } from "./book-landing-copy";
import { ChapterList } from "./chapter-list";
import { CoverPoster } from "./reel/cover-poster";
import { CoverReel } from "./reel/cover-reel";
import "./book-landing.css";

/**
 * The cover page of an insight book (INSIGHT-SPEC 3.1): the poster band
 * (`plakat-lemons`), then the stage on paper: the 30 second reel as the one
 * moving region (poster first), card A "Kapitel 1 lesen" (outlined), card B
 * "PDF laden" (filled), a small link to the explorer; then the visible
 * explainer, the three facts and the chapter list. Nothing collapses.
 *
 * Server component. The numeral and the share come from the headline figure
 * JSON (landing.headlineRef), the facts and the explainer from the manifest
 * with their number tokens resolved.
 */

interface BookLandingProps {
  readonly book: Book;
  readonly display: LocalizedBookDisplay;
  readonly chapters: readonly BookChapterMeta[];
  readonly landing: ResolvedLanding;
  /** The figure the cover share comes from; the cover has no field without it. */
  readonly headline: FigureSpec | undefined;
  readonly locale: Locale;
  /** Where the PDF button goes (login with next=), or null when accounts are off. */
  readonly pdfHref: string | null;
  /**
   * The reel itself, when a finished player is available (the reel agent's ReelPlayer): it replaces the
   * built-in poster slot and brings its own numeral, poster, switch and film. Without it the cover shows
   * the field poster and the numeral with the lazy engine seam of reel/cover-reel.tsx.
   */
  readonly reel?: React.ReactNode;
  readonly children?: React.ReactNode;
}

export function BookLanding({ book, display, chapters, landing, headline, locale, pdfHref, reel, children }: BookLandingProps) {
  const copy = LANDING_COPY[locale];
  const ref = /^([a-z0-9][a-z0-9_-]*)\.([A-Za-z0-9_]+)$/i.exec(landing.headlineRef);
  const quantity = headline && ref ? quantityFor(headline, ref[2] as string) : undefined;
  const first = chapters[0];
  const explorer = chapters.find((c) => c.slug === landing.explorerChapter);
  const share = quantity ? quantity.value / 100 : null;
  const value = quantity ? formatValue(quantity.fmt, quantity.value) : null;
  const squares = share === null ? 0 : Math.floor(share * 1000 + 1e-9);
  const n = quantity ? (quantity.n ?? headline?.n) : undefined;
  const tail = landing.headlineTail ?? copy.defaultTail;

  return (
    <>
      <PlakatBand plakat="lemons" labelledBy="book-title" className="bl-band" contentClassName="max-sm:pt-4 lg:py-12">
        <CapsLine>{copy.caps(display.edition, book.author)}</CapsLine>
        <h1 id="book-title" className="poster-title mt-2 max-w-[16ch] max-sm:text-[2.25rem] text-scene-ink sm:mt-4" style={posterTitleFallbackStyle(display.title)}>
          {display.title}
        </h1>
        <p className="mt-4 hidden max-w-[40ch] text-body text-scene-ink text-pretty sm:mt-5 sm:block">{display.subtitle}</p>
      </PlakatBand>

      <section aria-label={copy.stageAria} className="bl-stage" data-book-stage="" data-reel={reel ? "external" : undefined}>
        {reel ? <div className="bl-reel">{reel}</div> : null}
        {!reel && share !== null && value ? (
          <CoverReel
            locale={locale}
            poster={<CoverPoster share={share} label={copy.posterLabel(squares, `${value} ${tail}`)} />}
            unit={n !== undefined ? copy.unitLine(formatDecimal(n, 0)) : undefined}
            copy={
              <>
                <p className="bl-numeral" data-book-numeral="">
                  {value}
                </p>
                <p className="bl-claim">{tail}</p>
              </>
            }
          />
        ) : null}
        {!reel && (n !== undefined || landing.sourceLine) ? (
          <div className="bl-notes">
            {n !== undefined && !(share !== null && value) ? <p className="bl-unit">{copy.unitLine(formatDecimal(n, 0))}</p> : null}
            {landing.sourceLine ? (
              <p className="bl-unit" data-book-source="">
                {landing.sourceLine}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="bl-actions">
          {first ? (
            <Link href={localizeHref(`/buecher/${book.id}/${first.slug}`, locale)} className="bl-card bl-card--outline" data-book-start="">
              <span>{copy.readChapter(1)}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ) : null}
          {pdfHref ? (
            <Link href={pdfHref} className="bl-card bl-card--filled" data-book-pdf="">
              <span>{copy.pdf(book.pageCount)}</span>
              <Download size={18} aria-hidden="true" />
            </Link>
          ) : (
            <p className="bl-card-note">{copy.pdfUnavailable}</p>
          )}
        </div>
        {explorer ? (
          <Link href={`${localizeHref(`/buecher/${book.id}/${explorer.slug}`, locale)}#wo-stehe-ich`} className="bl-link" data-book-explorer="">
            {copy.explorer}
          </Link>
        ) : null}
      </section>

      <div className="bl-body">
        {landing.explainer ? (
          <section aria-labelledby="book-explainer" className="bl-explainer">
            <h2 id="book-explainer" className="bl-h2">
              {landing.explainer.heading}
            </h2>
            <p className="bl-text">{landing.explainer.text}</p>
          </section>
        ) : null}
        {landing.facts.length > 0 ? (
          <dl className="bl-facts" aria-label={copy.factsAria}>
            {landing.facts.map((fact) => (
              <div key={fact.label} className="bl-fact">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {children}
        <ChapterList bookId={book.id} chapters={chapters} locale={locale} showNumerals />
      </div>
    </>
  );
}
