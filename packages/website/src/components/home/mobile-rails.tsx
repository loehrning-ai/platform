import Link from "next/link";
import { getBookDisplay } from "@/app/buecher/book-copy";
import { HOME_COPY } from "@/components/home/home-copy";
import { books } from "@/lib/books";
import { getDemosForLocale } from "@/lib/demos-localization";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

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
 * It ships zero client JavaScript and requests no image.
 */

/** How many applied examples the rail carries. */
const RAIL_DEMO_COUNT = 6;

/** The books rail needs at least two titles; one book is the board's row. */
export const BOOK_RAIL_SHOWN = books.length > 1;

const RAIL_CLASS =
  "-mx-6 flex snap-x snap-mandatory list-none gap-2 overflow-x-auto overscroll-x-contain scroll-px-6 px-6 pb-1 [contain-intrinsic-height:auto_6.25rem] [content-visibility:auto] md:-mx-12 md:scroll-px-12 md:px-12";

/* Werkzeichnung tile: square, a hairline edge, no fill and no shadow. The
   hover and focus states change tone only. */
const TILE_CLASS =
  "group flex h-full min-h-[6.25rem] flex-col justify-between gap-2 border border-hairline bg-card p-3 outline-none transition-colors duration-150 hover:border-foreground hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none";

/* Sentence-case label: data (a number, an edition) in Schiefer, never a
   mono uppercase eyebrow. */
const LABEL_CLASS =
  "min-w-0 text-sm font-semibold leading-tight tracking-[0.02em] text-muted-foreground tabular-nums [overflow-wrap:anywhere]";

function RailHeading({
  eyebrow,
  title,
}: {
  readonly eyebrow: string;
  readonly title: string;
}) {
  return (
    <header className="mb-3 flex items-baseline justify-between gap-4 border-t-2 border-foreground pt-3">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className={LABEL_CLASS}>{eyebrow}</p>
    </header>
  );
}

export function MobileRails({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].companion;
  const demos = getDemosForLocale(locale).slice(0, RAIL_DEMO_COUNT);

  return (
    <section
      className="bg-background py-5 lg:hidden"
      data-testid="companion-rails"
    >
      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <RailHeading eyebrow={copy.demosEyebrow} title={copy.demosTitle} />
        <ul aria-label={copy.demosRailLabel} className={RAIL_CLASS}>
          {demos.map((demo) => (
            <li
              key={demo.slug}
              className="w-[min(14rem,78vw)] shrink-0 snap-start"
            >
              <Link
                href={localizeHref(`/demos/${demo.slug}`, locale)}
                prefetch={false}
                data-home-rail-tile="demo"
                className={TILE_CLASS}
              >
                <span className={LABEL_CLASS}>{demo.n}</span>
                <span className="min-w-0">
                  <span className="block text-base font-bold leading-snug text-foreground">
                    {demo.title}
                  </span>
                  <span className="mt-1 block text-[0.8125rem] leading-snug text-muted-foreground">
                    {demo.titleKicker}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {BOOK_RAIL_SHOWN ? (
        <div className="mx-auto mt-6 w-full max-w-6xl px-6 md:px-12">
          <RailHeading eyebrow={copy.booksEyebrow} title={copy.booksTitle} />
          {/* One tile per publicly routed title. Titles on editorial hold
              are unroutable and must not appear, so this list is driven by
              `books`, never by `allBooks`. */}
          <ul aria-label={copy.booksRailLabel} className={RAIL_CLASS}>
            {books.map((book) => {
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
                    className={TILE_CLASS}
                  >
                    <span className={LABEL_CLASS}>{display.edition}</span>
                    <span className="min-w-0">
                      <span className="block text-base font-bold leading-snug text-foreground">
                        {display.title}
                      </span>
                      <span className="mt-1 block text-[0.8125rem] leading-snug text-muted-foreground">
                        {copy.bookMeta(book.chapters, book.readingTimeMinutes)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
