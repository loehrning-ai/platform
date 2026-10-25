import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowGlyph } from "@/components/werk";
import { ForYourClaude } from "@/components/demos/take-home/for-your-claude";
import type { Beat } from "@/lib/demo-beats";
import { demoLede, type LocalizedDemo } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { getWorkshopBySlug } from "@/lib/workshops";
import { DemoOpenTracker } from "../demo-open-tracker";
import type { DemoComponentProps } from "../demo-page";
import { DemoBackLink } from "./back-link";
import { BeatClockProvider } from "./beat-clock";
import { BeatRail } from "./beat-rail";
import { ClosingBand } from "./closing-band";
import "./shell.css";

const CONTAINER = "mx-auto max-w-[75rem] px-4 sm:px-6";

const TEXT_LINK =
  "inline-flex min-h-11 items-center gap-2 font-semibold text-foreground underline decoration-border decoration-1 underline-offset-4 [-webkit-tap-highlight-color:transparent] active:decoration-mennige active:decoration-[3px] [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-mennige [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-[3px]";

/**
 * The demo page every demo runs on (the v3 shell).
 *
 * Phone: a 56px demo bar (back glyph, the one-line H1, the workshop chip),
 * the beat rail, then the demo's stage and lever own the first screen; the
 * promise and the synthetic-data line follow below the demo. Desktop (from
 * 1024px): a sticky 4/12 column with the caps line, the poster title, the
 * question, the workshop link, the privacy line and a vertical rail; the
 * demo in 8/12. Then the closing band and "Für deinen Claude".
 *
 * The shell is closed: demo CSS never selects its parts (contract test).
 */
export function DemoPageV3({
  demo,
  locale,
  beats,
  Demo,
}: {
  readonly demo: LocalizedDemo;
  readonly locale: Locale;
  readonly beats: readonly Beat[];
  readonly Demo: ComponentType<DemoComponentProps>;
}) {
  const pageCopy = DEMOS_PAGE_COPY[locale];
  const copy = pageCopy.shell;
  const workshop = getWorkshopBySlug(demo.workshopSlug, locale);
  const workshopHref = localizeHref(`/workshops/${demo.workshopSlug}`, locale);
  const chip = workshop ? `${demo.workshopNumber} · ${workshop.topic}` : demo.workshopNumber;

  return (
    <article
      data-plakat-page={demo.plakat}
      data-demo-page={demo.slug}
      data-demo-v3=""
      className="bg-background pb-12 sm:pb-20"
    >
      <div className={CONTAINER}>
        <header className="demo-bar" data-demo-bar="">
          <DemoBackLink
            demosHref={localizeHref("/demos", locale)}
            demosLabel={copy.back}
            workshopHref={workshop ? workshopHref : null}
            workshopLabel={copy.backToWorkshop(demo.workshopNumber)}
          />
          <h1 id="demo-title" className="demo-bar-title lg:sr-only">
            {demo.title}
          </h1>
          <span className="flex-1 max-lg:hidden" aria-hidden="true" />
          {workshop ? (
            <Link
              prefetch={false}
              href={workshopHref}
              className="demo-bar-chip"
              data-demo-workshop-chip=""
              aria-label={pageCopy.detail.toWorkshop(demo.workshopNumber, workshop.title)}
            >
              {chip}
            </Link>
          ) : null}
        </header>

        <BeatClockProvider beats={beats} locale={locale}>
          <div className="demo-grid">
            <div className="demo-aside" data-demo-aside="">
              <p className="demo-aside-caps">{pageCopy.detail.caps(demo.workshopNumber)}</p>
              <p className="demo-aside-title" aria-hidden="true">
                {demo.title}
              </p>
              <p className="demo-aside-question" data-demo-question="">
                {demoLede(demo)}
              </p>
              {workshop ? (
                <p className="mt-3">
                  <Link prefetch={false} href={workshopHref} className={TEXT_LINK} data-demo-workshop-link="">
                    {pageCopy.detail.toWorkshop(demo.workshopNumber, workshop.title)}
                    <ArrowGlyph direction="right" className="size-4" />
                  </Link>
                </p>
              ) : null}
              <p className="demo-privacy mt-3" data-demo-privacy="aside">
                {copy.privacy}
              </p>
              <BeatRail orientation="vertical" className="mt-8" />
              <p className="mt-4 text-[0.8125rem] text-muted-foreground">{copy.keys}</p>
            </div>

            <div className="demo-main">
              <BeatRail orientation="horizontal" className="lg:hidden" />
              <section aria-label={pageCopy.detail.demoRegion} data-demo-mount={demo.slug} className="min-w-0">
                <Demo locale={locale} />
              </section>
              <div data-demo-below="" className="mt-8 border-t border-hairline pt-5">
                <p data-demo-promise="" className="max-w-[56ch] text-[1.0625rem] font-semibold leading-snug text-pretty">
                  {demo.oneLiner}
                </p>
                <p data-demo-synthetic="" className="mt-2 max-w-[64ch] text-[0.9375rem] leading-normal text-muted-foreground text-pretty">
                  {demo.syntheticDataLabel}
                </p>
              </div>
            </div>
          </div>
        </BeatClockProvider>
      </div>

      <ClosingBand demo={demo} workshop={workshop} locale={locale} />
      <ForYourClaude slug={demo.slug} locale={locale} />
      <DemoOpenTracker slug={demo.slug} />
    </article>
  );
}
