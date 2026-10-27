import { GlasButton } from "@/components/demos/glas/button";
import { GlasStage } from "@/components/demos/glas/feld";
import { feldFor } from "@/components/demos/glas/feld-math";
import type { LocalizedDemo } from "@/lib/demos";
import { takeHomeFor } from "@/lib/demo-takehome";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { glasToneFor } from "@/lib/glas";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { Workshop } from "@/lib/workshops";

/**
 * The close of a v4 demo page, in the demo's own glass: the workshop this
 * demo belongs to, and its slides, its kit and its page as three buttons on
 * a small field in the workshop's colours. The kit is the take-home kit of
 * this language, so the page never offers two different zips.
 */
export function ClosingGlass({ demo, workshop, locale }: { readonly demo: LocalizedDemo; readonly workshop: Workshop | undefined; readonly locale: Locale }) {
  const copy = DEMOS_PAGE_COPY[locale].shell;
  const deck = workshop?.materials.find((material) => material.role === "deck");
  const kitHref =
    takeHomeFor(demo.slug)?.kit[locale].href ??
    workshop?.materials.find((material) => material.role === "kit" && material.kind === "zip")?.href;
  const workshopHref = localizeHref(`/workshops/${demo.workshopSlug}`, locale);
  return (
    <section className="demo4-closing-wrap" aria-labelledby="demo-closing-title" data-closing-band="">
      <GlasStage feld={feldFor(demo.plakat, [{ x: 0.1, y: 0.2 }, { x: 0.9, y: 0.8 }, { x: 0.55, y: 1.1 }], 0.8)} tone={glasToneFor(demo.plakat)} className="demo4-closing">
        <div className="demo4-closing-text">
          <p className="demo4-closing-kicker">{copy.closingKicker(demo.workshopNumber)}</p>
          <h2 id="demo-closing-title" className="demo4-closing-title">
            {copy.closingHeading(demo.workshopNumber)}
          </h2>
          {workshop ? <p className="demo4-closing-lead">{workshop.title}</p> : null}
        </div>
        <div className="demo4-closing-actions">
          {deck ? (
            <GlasButton variant="glass" icon="doc" href={deck.href} download={false} data-closing-link="deck">
              {copy.closingSlides(deck.minutes)}
            </GlasButton>
          ) : null}
          {kitHref ? (
            <GlasButton variant="glass" icon="download" href={kitHref} download="" data-closing-link="kit">
              {copy.closingKit}
            </GlasButton>
          ) : null}
          <GlasButton variant="glass" trailingIcon="forward" href={workshopHref} data-closing-link="workshop">
            {copy.closingWorkshop}
          </GlasButton>
        </div>
      </GlasStage>
    </section>
  );
}
