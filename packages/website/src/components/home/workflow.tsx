import Link from "next/link";
import { HOME_COPY } from "@/components/home/home-copy";
import { HOME_CONTAINER } from "@/components/home/home-container";
import { HomeSectionHead } from "@/components/home/home-section-head";
import { BOOK_RAIL_SHOWN } from "@/components/home/mobile-rails";
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
import { BUTTON_CLASSES } from "@/components/werk/button-link";
import { Pictogram, type PictogramName } from "@/components/werk/pictogram";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

/** One deck pictogram per resource, in copy order. */
const RESOURCE_GLYPHS: readonly PictogramName[] = [
  "canvas", // Blog: notes with primary sources
  "guide", // Lernbücher
  "demo", // Praxisbeispiele
  "person", // Workshops
  "export", // Open Source
];

/**
 * Ressourcen: the supporting areas as one ledger. Every destination is a
 * hairline row with its pictogram, name and one sentence; the account note
 * closes the ledger with a secondary ink button. No tinted boards, no
 * icon tiles and no hover lift. Names are set at 18px, a step under the
 * course titles above, so the courses stay the page's first read.
 */
export function Workflow({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = HOME_COPY[locale].workflow;
  // Below lg a rail above this board already carries these subjects, so
  // their rows step out there: one path per destination on a phone.
  const railOwned = new Set<string>(
    BOOK_RAIL_SHOWN ? ["/demos", "/buecher"] : ["/demos"],
  );

  return (
    <section
      id="ressourcen"
      className="scroll-mt-24 bg-background py-12 max-lg:py-5"
      data-testid="ressourcen-section"
    >
      <div className={HOME_CONTAINER}>
        <HomeSectionHead
          note={copy.boardLabel(copy.resources.length)}
          title={copy.headline}
        />

        <ul
          className="mt-8 border-t border-hairline max-lg:mt-4"
          aria-label={copy.boardAriaLabel}
        >
          {copy.resources.map((resource, index) => (
            <li
              key={resource.label}
              className={railOwned.has(resource.href) ? "max-lg:hidden" : undefined}
            >
              <Link
                href={localizeHref(resource.href, locale)}
                className="group grid min-h-16 min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-6 border-b border-hairline py-3 transition-colors duration-[120ms] hover:bg-card-hover motion-reduce:transition-none max-lg:min-h-14 max-lg:grid-cols-[2rem_minmax(0,1fr)_auto] max-lg:gap-3 max-lg:py-2"
                data-home-resource-card
              >
                <Pictogram
                  name={RESOURCE_GLYPHS[index] ?? "guide"}
                  className="size-7 text-foreground max-lg:size-6"
                />
                <span className="min-w-0">
                  <span className="block text-lg font-semibold leading-snug text-foreground underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] group-hover:decoration-current motion-reduce:transition-none max-lg:text-base max-lg:leading-snug max-lg:no-underline">
                    {resource.label}
                  </span>
                  <span className="block text-caption leading-snug text-muted-foreground lg:mt-0.5 lg:text-body">
                    {resource.short}
                  </span>
                </span>
                <ArrowGlyph className="mr-1 text-foreground" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between gap-6 max-lg:mt-3 max-lg:grid max-lg:grid-cols-[minmax(0,1fr)_auto] max-lg:gap-4">
          <p className="max-w-[56ch] text-body text-muted-foreground max-lg:text-caption max-lg:leading-snug">
            {copy.accountBody}
          </p>
          <Link
            href={localizeHref("/konto", locale)}
            prefetch={false}
            className={`${BUTTON_CLASSES.paper.secondary} shrink-0 max-lg:px-3 max-lg:text-sm`}
          >
            {copy.accountCta}
            <ArrowGlyph />
          </Link>
        </div>
      </div>
    </section>
  );
}
