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
 * A rail lists items, never the subject's own landing page. `/demos` and
 * `/buecher` are two of the five cards the Ressourcen board renders directly
 * below this section at every width, and the shell is one document with two
 * layouts: a rail that closed with its own "all" tile would put those two
 * destinations in the document twice, visible together on a phone and a
 * second, hidden link set on desktop. See the "content is not duplicated into
 * a second DOM tree" rule in docs/experience-system.md.
 *
 * It ships zero client JavaScript and requests no image.
 */

/** How many applied examples the rail carries. */
const RAIL_DEMO_COUNT = 6;

const DEMO_TONES = [
  "bg-brand-sky/50",
  "bg-brand-acid/48",
  "bg-brand-peach/45",
  "bg-brand-pink/42",
  "bg-brand-teal/15",
  "bg-brand-sky/38",
] as const;

const BOOK_TONES = ["bg-brand-peach/50", "bg-brand-sky/45"] as const;

const RAIL_CLASS =
  "-mx-6 flex snap-x snap-mandatory list-none gap-3 overflow-x-auto overscroll-x-contain scroll-px-6 px-6 pb-1 [contain-intrinsic-height:auto_6.25rem] [content-visibility:auto]";

const TILE_CLASS =
  "group flex h-full min-h-[6.25rem] flex-col justify-between gap-2 rounded-2xl border border-foreground/10 p-3 shadow-card outline-none transition-[border-color,box-shadow] duration-200 hover:border-brand-cobalt/45 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-brand-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const EYEBROW_CLASS =
  "font-ui-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange";

function RailHeading({
  eyebrow,
  title,
}: {
  readonly eyebrow: string;
  readonly title: string;
}) {
  return (
    <header className="mb-2">
      <p className={EYEBROW_CLASS}>{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-foreground">
        {title}
      </h2>
    </header>
  );
}

export function MobileRails({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].companion;
  const demos = getDemosForLocale(locale).slice(0, RAIL_DEMO_COUNT);

  return (
    <section
      className="border-b border-border/60 bg-background/65 py-5 lg:hidden"
      data-testid="companion-rails"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <RailHeading eyebrow={copy.demosEyebrow} title={copy.demosTitle} />
        <ul aria-label={copy.demosRailLabel} className={RAIL_CLASS}>
          {demos.map((demo, index) => (
            <li key={demo.slug} className="w-60 shrink-0 snap-start">
              <Link
                href={localizeHref(`/demos/${demo.slug}`, locale)}
                prefetch={false}
                data-home-rail-tile="demo"
                className={`${TILE_CLASS} ${DEMO_TONES[index % DEMO_TONES.length]}`}
              >
                <span className={EYEBROW_CLASS}>{demo.n}</span>
                <span className="min-w-0">
                  <span className="block text-base font-bold leading-snug tracking-[-0.02em] text-foreground">
                    {demo.title}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                    {demo.titleKicker}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto mt-4 w-full max-w-6xl px-6">
        <RailHeading eyebrow={copy.booksEyebrow} title={copy.booksTitle} />
        {/* One tile per publicly routed title. The rail holds a single
            published book today; titles on editorial hold are unroutable and
            must not appear, so this list is driven by `books`, never by
            `allBooks`. */}
        <ul aria-label={copy.booksRailLabel} className={RAIL_CLASS}>
          {books.map((book, index) => {
            const display = getBookDisplay(book, locale);
            return (
              <li key={book.id} className="w-72 shrink-0 snap-start">
                <Link
                  href={localizeHref(book.readerHref, locale)}
                  prefetch={false}
                  data-home-rail-tile="book"
                  className={`${TILE_CLASS} ${BOOK_TONES[index % BOOK_TONES.length]}`}
                >
                  <span className={EYEBROW_CLASS}>{display.edition}</span>
                  <span className="min-w-0">
                    <span className="block text-base font-bold leading-snug tracking-[-0.02em] text-foreground">
                      {display.title}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                      {copy.bookMeta(book.chapters, book.readingTimeMinutes)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
