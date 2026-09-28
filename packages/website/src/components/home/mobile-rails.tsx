import Link from "next/link";
import { getBookDisplay } from "@/app/buecher/book-copy";
import { HOME_COPY } from "@/components/home/home-copy";
import { books } from "@/lib/books";
import { getDemosForLocale } from "@/lib/demos-localization";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { RailList } from "./rail-list";

/**
 * Two horizontal rails the companion home shows below `lg` instead of a third
 * and fourth stack of full-width cards: the applied examples, and the learning
 * books. Desktop never sees this section (`lg:hidden`); the reviewed wide
 * layout keeps its own sections above the breakpoint.
 *
 * Why rails: a phone stack spends one full screen per card and answers one
 * question per screen. A rail spends one screen on a whole subject and lets a
 * thumb compare items, which is the decision a learner actually makes here.
 *
 * Each rail carries `content-visibility: auto` with a matching intrinsic
 * height, so a rail that is off-screen costs no layout or paint while the
 * document height stays the same whether it is rendered or skipped.
 *
 * A rail lists items, never the subject's own landing page, and it replaces
 * the subject's row in the Ressourcen board on a phone: while a rail is shown
 * the board hides that row below lg (workflow.tsx), so every destination has
 * one path per layout. The shell is one document with two layouts, so the
 * rail never closes with its own "all" tile either: see the "content is not
 * duplicated into a second DOM tree" rule in docs/experience-system.md.
 *
 * A rail of one is no rail: the books rail renders only while more than one
 * book is publicly routed (BOOK_RAIL_SHOWN); until then the board's
 * Lernbücher row is the phone's path to the book.
 *
 * The tiles are the paper home's pastel cards. The section ships no client
 * JavaScript beyond the rail's focus helper and requests no image.
 */

/** How many applied examples the rail carries. */
const RAIL_DEMO_COUNT = 6;

/** The books rail needs at least two titles; one book is the board's row. */
export const BOOK_RAIL_SHOWN = books.length > 1;

const RAIL_CLASS =
  "-mx-6 mt-3 flex snap-x snap-mandatory list-none gap-3 overflow-x-auto overscroll-x-contain scroll-px-6 px-6 pb-2 [contain-intrinsic-height:auto_6.25rem] [content-visibility:auto]";

const DEMO_TONES = [
  "bg-brand-sky/50",
  "bg-brand-acid/48",
  "bg-brand-peach/45",
  "bg-brand-pink/42",
  "bg-brand-teal/15",
  "bg-brand-sky/38",
] as const;

const BOOK_TONES = ["bg-brand-peach/50", "bg-brand-sky/45"] as const;

/* The pastel card: rounded, tinted, a soft shadow; hover and focus change
   the edge only, the ring in cobalt. */
const TILE_CLASS =
  "group flex h-full min-h-[6.25rem] flex-col justify-between gap-2 rounded-2xl border border-foreground/10 p-3 shadow-card outline-none transition-[border-color,box-shadow] duration-200 hover:border-brand-cobalt/45 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-brand-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none";

/* A book's edition: data in Kupfer, set in sentence case. */
const LABEL_CLASS =
  "min-w-0 text-sm font-semibold leading-tight text-brand-orange tabular-nums [overflow-wrap:anywhere]";

const HEADING_CLASS =
  "text-2xl font-bold tracking-[-0.03em] text-foreground";

export function MobileRails({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].companion;
  const demos = getDemosForLocale(locale).slice(0, RAIL_DEMO_COUNT);

  return (
    <section
      className="border-b border-border/60 bg-background/65 py-6 lg:hidden"
      data-testid="companion-rails"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <h2 className={HEADING_CLASS}>{copy.demosTitle}</h2>
        <RailList aria-label={copy.demosRailLabel} className={RAIL_CLASS}>
          {demos.map((demo, index) => (
            <li
              key={demo.slug}
              className="w-[min(15rem,78vw)] shrink-0 snap-start"
            >
              <Link
                href={localizeHref(`/demos/${demo.slug}`, locale)}
                prefetch={false}
                data-home-rail-tile="demo"
                className={`${TILE_CLASS} ${DEMO_TONES[index % DEMO_TONES.length]}`}
              >
                <span
                  aria-hidden="true"
                  className="block size-5 rotate-12 rounded-md border border-foreground/15 bg-paper/70"
                />
                <span className="min-w-0">
                  <span className="block text-base font-bold leading-snug text-foreground">
                    {demo.title}
                  </span>
                  <span className="mt-1 block text-caption leading-snug text-muted-foreground">
                    {demo.titleKicker}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </RailList>
      </div>

      {BOOK_RAIL_SHOWN ? (
        <div className="mx-auto mt-6 w-full max-w-6xl px-6">
          <h2 className={HEADING_CLASS}>{copy.booksTitle}</h2>
          {/* One tile per publicly routed title. Titles on editorial hold
              are unroutable and must not appear, so this list is driven by
              `books`, never by `allBooks`. */}
          <RailList aria-label={copy.booksRailLabel} className={RAIL_CLASS}>
            {books.map((book, index) => {
              const display = getBookDisplay(book, locale);
              return (
                <li
                  key={book.id}
                  className="w-[min(18rem,78vw)] shrink-0 snap-start"
                >
                  <Link
                    href={localizeHref(book.readerHref, locale)}
                    prefetch={false}
                    data-home-rail-tile="book"
                    className={`${TILE_CLASS} ${BOOK_TONES[index % BOOK_TONES.length]}`}
                  >
                    <span className={LABEL_CLASS}>{display.edition}</span>
                    <span className="min-w-0">
                      <span className="block text-base font-bold leading-snug text-foreground">
                        {display.title}
                      </span>
                      <span className="mt-1 block text-caption leading-snug text-muted-foreground">
                        {copy.bookMeta(book.chapters, book.readingTimeMinutes)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </RailList>
        </div>
      ) : null}
    </section>
  );
}
