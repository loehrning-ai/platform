import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowGlyph } from "@/components/werk";
import { CapsLine, PlakatBand } from "@/components/plakat";
import "@/components/demos/hub/demo-tile.css";
import "@/components/demos/hub/tile-scenes.css";
import { DemoTile } from "@/components/demos/hub/demo-tile";
import { DemoTileStage } from "@/components/demos/hub/demo-tile-stage";
import { getDemosForLocale } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
import { ROUTE_PLAKAT } from "@/lib/plakat/palettes";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const demos = getDemosForLocale(locale);
  const copy = DEMOS_PAGE_COPY[locale].metadata;
  const localizedPath = localizeHref("/demos", locale);
  const alternates = buildLocaleAlternates("/demos", contentLocalesForPath("/demos"));

  return {
    title: copy.title,
    description: copy.description(demos.length),
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title: `${copy.title} · loehrning.ai`,
      description: copy.openGraphDescription(demos.length),
      url: `${SITE_URL}${localizedPath}`,
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.openGraphDescription(demos.length),
    },
  };
}

const CONTAINER = "mx-auto max-w-[75rem] px-4 sm:px-6";

/** The hub's poster title stays 2.75rem on a phone (3.5rem at most), so the hero stays under 160px. */
const HUB_TITLE_SIZE = { "--text-poster": "clamp(2.75rem, 2rem + 2.4vw, 3.5rem)" } as CSSProperties;

const TEXT_LINK =
  "inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 [-webkit-tap-highlight-color:transparent] hover:decoration-mennige hover:decoration-2 active:decoration-mennige active:decoration-2";

/**
 * The hub: six live trailers, not six posters. A compact IDEA band, then
 * a grid of tiles (one column on a phone, two from md, three from lg), each
 * a 16:9 miniature of the demo's own object that plays its story once when
 * first seen and replays on hover or focus (demo-tile-stage.tsx), with the
 * job line, the workshop kicker and what you take home. A last cell, a
 * full row, states the promise all six share.
 */
export default async function DemosPage() {
  const locale = await getRequestLocale();
  const demos = getDemosForLocale(locale);
  const copy = DEMOS_PAGE_COPY[locale];
  const localizedPath = localizeHref("/demos", locale);
  const inLanguage = locale === "de" ? "de-DE" : "en-GB";

  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "CollectionPage",
        name: copy.metadata.title,
        description: copy.metadata.description(demos.length),
        url: `${SITE_URL}${localizedPath}`,
        inLanguage,
        publisher: { "@id": ORG_ID },
        hasPart: demos.map((demo) => ({
          "@type": "LearningResource",
          name: demo.title,
          description: demo.oneLiner,
          url: `${SITE_URL}${localizeHref(`/demos/${demo.slug}`, locale)}`,
          inLanguage,
          isAccessibleForFree: true,
          learningResourceType: "Interactive demo",
          timeRequired: `PT${demo.minutes}M`,
        })),
      },
    ],
  };

  return (
    <div className="overflow-x-clip pb-10 sm:pb-20" data-plakat-page={ROUTE_PLAKAT.demos}>
      <JsonLd data={jsonLd} id="demos-jsonld" />

      {/* A compact IDEA band (at most 160px on a phone): the caps line, the
          H1 and one line. The tiles below are the picture, and the first one
          sits whole in the first screen at 390 x 664. */}
      <header data-demo-hub-hero="">
        <PlakatBand
          plakat={ROUTE_PLAKAT.demos}
          labelledBy="demos-title"
          contentClassName="pt-3 pb-0 sm:pb-2 lg:py-10"
        >
          <CapsLine arrow>{copy.catalog.kicker}</CapsLine>
          <h1
            id="demos-title"
            className="poster-title mt-2 text-scene-mid sm:mt-3"
            style={{ ...posterTitleFallbackStyle(copy.catalog.heading), ...HUB_TITLE_SIZE }}
          >
            {copy.catalog.heading}
          </h1>
          <p className="mt-2 max-w-[46ch] text-[1rem] leading-snug text-scene-ink text-pretty sm:mt-3 sm:text-[1.0625rem]">
            {copy.hub.lede}
          </p>
        </PlakatBand>
      </header>

      <section aria-labelledby="demo-list-heading" className="pt-4 sm:pt-8">
        <div className={CONTAINER}>
          <h2 id="demo-list-heading" className="sr-only">
            {copy.catalog.listHeading}
          </h2>
          <DemoTileStage className="dt-grid" label={copy.catalog.listHeading}>
            {demos.map((demo) => (
              <DemoTile key={demo.slug} demo={demo} locale={locale} />
            ))}
            <li className="dt-promise" data-demo-promise-cell="">
              <h3 className="dt-promise-title">
                <span className="dt-zero plakat-idea">{copy.catalog.promiseZero}</span>
                {copy.catalog.promiseTitle}
              </h3>
              <p className="dt-promise-body">{copy.catalog.promiseBody}</p>
              <p data-demo-provenance="" className="dt-promise-note">
                {copy.catalog.provenance}
              </p>
            </li>
          </DemoTileStage>
          <p className="mt-8 sm:mt-10">
            <Link href={localizeHref("/workshops", locale)} className={TEXT_LINK}>
              {copy.catalog.toWorkshops}
              <ArrowGlyph />
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
