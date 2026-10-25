import Link from "next/link";
import { ArrowGlyph } from "@/components/werk";
import { CapsLine, PlakatBand, PosterArt } from "@/components/plakat";
import type { LocalizedDemo } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { Workshop } from "@/lib/workshops";

const BAND_LINK =
  "inline-flex min-h-11 items-center gap-2 font-semibold text-scene-ink underline decoration-current decoration-1 underline-offset-4 [-webkit-tap-highlight-color:transparent] active:decoration-[var(--color-scene-anti-a)] active:decoration-[3px] focus-visible:decoration-[var(--color-scene-anti-a)] focus-visible:decoration-[3px] [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-[var(--color-scene-anti-a)] [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-[3px]";

/**
 * The closing band above the take-home block: the poster art with the big
 * workshop number, and "Weiter im Workshop 0N: Folien (60 Min) · Kit (ZIP)".
 * The deck and kit links come from the workshop's own materials.
 */
export function ClosingBand({
  demo,
  workshop,
  locale,
}: {
  readonly demo: LocalizedDemo;
  readonly workshop: Workshop | undefined;
  readonly locale: Locale;
}) {
  const copy = DEMOS_PAGE_COPY[locale].shell;
  const deck = workshop?.materials.find((material) => material.role === "deck");
  const kit = workshop?.materials.find((material) => material.role === "kit" && material.kind === "zip");
  const workshopHref = localizeHref(`/workshops/${demo.workshopSlug}`, locale);
  return (
    <div data-closing-band="" className="mt-12 sm:mt-16">
      <PlakatBand
        plakat={demo.plakat}
        labelledBy="demo-closing-title"
        artPhoneLayout="strip"
        className="sm:[&>[data-plakat-art-phone]]:h-28 lg:min-h-[16rem]"
        contentClassName="lg:py-8"
        art={<PosterArt plakat={demo.plakat} motif={demo.motif} numeral={demo.workshopNumber} format="portrait" cornerDots={false} />}
        artPhone={<PosterArt plakat={demo.plakat} motif={demo.motif} numeral={demo.workshopNumber} format="strip" cornerDots={false} />}
      >
        <CapsLine>{copy.closingKicker(demo.workshopNumber)}</CapsLine>
        <h2 id="demo-closing-title" className="mt-2 text-[1.75rem] font-black leading-tight text-scene-ink sm:text-[2.25rem]">
          {copy.closingHeading(demo.workshopNumber)}
        </h2>
        <ul className="mt-3 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
          {deck ? (
            <li>
              <a href={deck.href} className={BAND_LINK} data-closing-link="deck">
                {copy.closingSlides(deck.minutes)}
                <ArrowGlyph direction="right" className="size-4" />
              </a>
            </li>
          ) : null}
          {kit ? (
            <li>
              <a href={kit.href} download="" className={BAND_LINK} data-closing-link="kit">
                {copy.closingKit}
                <ArrowGlyph direction="down" className="size-4" />
              </a>
            </li>
          ) : null}
          <li>
            <Link prefetch={false} href={workshopHref} className={BAND_LINK} data-closing-link="workshop">
              {copy.closingWorkshop}
              <ArrowGlyph direction="right" className="size-4" />
            </Link>
          </li>
        </ul>
      </PlakatBand>
    </div>
  );
}
