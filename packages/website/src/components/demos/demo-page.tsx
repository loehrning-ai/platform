import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowGlyph } from "@/components/werk";
import { CapsLine, PlakatBand, PosterArt } from "@/components/plakat";
import { demoLede, type LocalizedDemo } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
import { getWorkshopBySlug } from "@/lib/workshops";
import { DemoOpenTracker } from "./demo-open-tracker";

/** What every demo component receives from the page shell. */
export interface DemoComponentProps {
  readonly locale: Locale;
}

interface Props {
  readonly demo: LocalizedDemo;
  readonly locale: Locale;
  /** The demo component, imported by the route file so only this demo ships. */
  readonly Demo: ComponentType<DemoComponentProps>;
}

const CONTAINER = "mx-auto max-w-[75rem] px-4 sm:px-6";

/**
 * A text link on the poster ground: scene ink with a thin underline, and the
 * scene's anti colour as a 3px underline on hover (fine pointer), press and
 * focus, never a tint of the ink.
 */
const BAND_LINK =
  "inline-flex min-h-11 items-center gap-2 font-semibold text-scene-ink underline decoration-current decoration-1 underline-offset-4 [-webkit-tap-highlight-color:transparent] active:decoration-[var(--color-scene-anti-a)] active:decoration-[3px] focus-visible:decoration-[var(--color-scene-anti-a)] focus-visible:decoration-[3px] [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-[var(--color-scene-anti-a)] [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-[3px]";

function BackGlyph() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className="size-4 shrink-0"
    >
      <path d="M17 10H4M9 5l-5 5 5 5" />
    </svg>
  );
}

/**
 * The page around one demo: a paper bar back to /demos (from sm), the poster
 * band in the workshop's own palette (caps line, title, the one question as
 * lede, the link to the workshop, the workshop number on the poster), the
 * synthetic-data line on paper, then the demo itself, server-rendered from
 * the component its route file passes in.
 */
export function DemoPage({ demo, locale, Demo }: Props) {
  const copy = DEMOS_PAGE_COPY[locale].detail;
  const workshop = getWorkshopBySlug(demo.workshopSlug, locale);
  const lede = demoLede(demo);
  const workshopHref = localizeHref(`/workshops/${demo.workshopSlug}`, locale);

  return (
    <article
      data-plakat-page={demo.plakat}
      data-demo-page={demo.slug}
      className="bg-background pb-12 sm:pb-20"
    >
      <nav aria-label={copy.navigation} className="border-b border-hairline max-sm:hidden">
        <div className={CONTAINER}>
          <Link
            href={localizeHref("/demos", locale)}
            className="inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-bold text-muted-foreground underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] hover:text-foreground hover:decoration-mennige hover:decoration-2 active:decoration-mennige active:decoration-2 focus-visible:outline-offset-[-3px] motion-reduce:transition-none"
          >
            <BackGlyph />
            {copy.allDemos}
          </Link>
        </div>
      </nav>

      <PlakatBand
        plakat={demo.plakat}
        labelledBy="demo-title"
        artPhoneLayout="strip"
        className="max-sm:[&>[data-plakat-art-phone]]:h-[4.75rem] max-[400px]:[&>[data-plakat-art-phone]]:h-12 sm:[&>[data-plakat-art-phone]]:h-28 lg:min-h-[19rem]"
        contentClassName="max-sm:pt-2 lg:py-8"
        art={
          <PosterArt
            plakat={demo.plakat}
            motif={demo.motif}
            numeral={demo.workshopNumber}
            format="portrait"
            cornerDots={false}
          />
        }
        artPhone={
          <PosterArt
            plakat={demo.plakat}
            motif={demo.motif}
            numeral={demo.workshopNumber}
            format="strip"
            cornerDots={false}
          />
        }
      >
        <Link
          href={localizeHref("/demos", locale)}
          data-cover-back=""
          className="-my-2.5 inline-flex min-h-11 items-center gap-2 text-[0.875rem] font-bold text-scene-ink underline decoration-transparent decoration-2 underline-offset-4 [-webkit-tap-highlight-color:transparent] active:decoration-[var(--color-scene-anti-a)] sm:hidden"
        >
          <BackGlyph />
          {copy.allDemos}
        </Link>
        <CapsLine className="mt-2 sm:mt-0">{copy.caps(demo.workshopNumber)}</CapsLine>
        <h1
          id="demo-title"
          className="poster-title mt-2 max-w-[16ch] text-scene-ink max-[379px]:[--text-poster:min(2.25rem,9vw)] min-[380px]:max-sm:[--text-poster:2.25rem] sm:mt-4 sm:max-w-[24ch] sm:[--text-poster:3.5rem] lg:max-w-none lg:[--text-poster:4.5rem]"
          style={posterTitleFallbackStyle(demo.title)}
        >
          {demo.title}
        </h1>
        <p
          data-demo-question=""
          className="mt-2 max-w-[40ch] text-[1rem] sm:text-[1.0625rem] font-semibold leading-snug text-scene-ink text-balance sm:mt-4 lg:max-w-[52ch] lg:text-[1.1875rem]"
        >
          {lede}
        </p>
        {workshop ? (
          <p className="mt-2 sm:mt-3">
            <Link href={workshopHref} data-demo-workshop-link="" className={BAND_LINK}>
              {copy.toWorkshop(demo.workshopNumber, workshop.title)}
              <ArrowGlyph direction="right" className="size-4" />
            </Link>
          </p>
        ) : null}
      </PlakatBand>

      <div className={CONTAINER}>
        <p
          data-demo-synthetic=""
          className="mt-4 max-w-[64ch] text-[0.9375rem] leading-normal text-muted-foreground text-pretty sm:mt-6"
        >
          {demo.syntheticDataLabel}
        </p>
        <section
          aria-label={copy.demoRegion}
          data-demo-mount={demo.slug}
          className="mt-8 min-w-0 sm:mt-10"
        >
          <Demo locale={locale} />
        </section>
      </div>
      <DemoOpenTracker slug={demo.slug} />
    </article>
  );
}
