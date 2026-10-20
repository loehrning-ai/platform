import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CapsLine, PlakatBand, PosterNumeral } from "@/components/plakat";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
import type { ChapterBand as ChapterBandData } from "@/lib/book-reader-content";
import type { Locale } from "@/lib/i18n/locale";

/**
 * The band of an insight chapter: the book's one poster scene (`plakat-lemons`,
 * Ultramarin ground, Butter ink, Mennige mid), the chapter number and its hero
 * number in the caps line, the chapter title as the poster headline and the
 * finding as one line. No Druckschwarz ground anywhere on the page; the stage
 * below never borrows the band's colours.
 *
 * The numeral art is decorative (aria-hidden) and only on wide screens; the caps
 * line names the chapter and never a bare figure (the stage's numeral carries the
 * number, with its claim). A long numeral ("35 bis 49") has no art.
 * On a phone the band is the one chrome row above the data: the caps line is the
 * way back to the book (arrow, "Kapitel 6 von 9"), the chapter pause switch sits
 * at its right, and the title follows. The stage right below carries the numeral
 * and the claim, so the first screen shows the data and the claim is not said twice.
 */

const COPY = {
  de: { chapter: (n: number, total: number) => `Kapitel ${n} von ${total}`, back: (chapter: string, book: string) => `${chapter}, zurück zum Buch: ${book}` },
  en: { chapter: (n: number, total: number) => `Chapter ${n} of ${total}`, back: (chapter: string, book: string) => `${chapter}, back to the book: ${book}` },
} as const;

const ART_MAX_CHARS = 5;

export function ChapterBand({
  number,
  total,
  title,
  band,
  locale,
  headingId,
  backHref,
  bookTitle,
  pause,
}: {
  readonly number: number;
  readonly total: number;
  readonly title: string;
  readonly band?: ChapterBandData;
  readonly locale: Locale;
  readonly headingId: string;
  /** The book page: the caps line links there on phones (wide screens have their own breadcrumb row). */
  readonly backHref?: string;
  readonly bookTitle?: string;
  /** The chapter pause switch, placed at the band's top right. */
  readonly pause?: ReactNode;
}) {
  const caps = COPY[locale].chapter(number, total);
  const art = band && band.numeral.length <= ART_MAX_CHARS ? band.numeral : null;
  return (
    <PlakatBand
      plakat="lemons"
      labelledBy={headingId}
      contentClassName="max-sm:pt-4 lg:py-10"
      art={art ? <PosterNumeral value={art} plakat="lemons" format="band" fit /> : undefined}
    >
      {pause}
      {backHref ? (
        <Link
          href={backHref}
          aria-label={COPY[locale].back(caps, bookTitle ?? "")}
          data-chapter-back=""
          className="-mt-1 mb-1 flex min-h-12 items-center gap-2 pr-28 text-scene-ink sm:hidden"
        >
          <ArrowLeft size={18} aria-hidden="true" className="shrink-0" />
          <CapsLine as="span">{caps}</CapsLine>
        </Link>
      ) : null}
      <CapsLine className={backHref ? "max-sm:hidden" : undefined}>{caps}</CapsLine>
      <h1
        id={headingId}
        className="poster-title mt-2 max-w-[16ch] max-sm:text-[2.25rem] text-scene-ink sm:mt-4"
        style={posterTitleFallbackStyle(title)}
      >
        {title}
      </h1>
      {band ? <p className="mt-4 hidden max-w-[40ch] text-body text-scene-ink text-pretty sm:mt-5 sm:block">{band.claim}</p> : null}
    </PlakatBand>
  );
}
