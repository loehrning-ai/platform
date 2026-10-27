import type { Metadata } from "next";
import Link from "next/link";
import { ArrowGlyph } from "@/components/werk";
import { GlasStage } from "@/components/demos/glas/feld";
import { hubFeld } from "@/components/demos/glas/feld-math";
import { GlasRoot } from "@/components/demos/glas/glas-root";
import "@/components/demos/hub/demo-tile.css";
import "@/components/demos/hub/tile-scenes.css";
import "@/components/demos/hub/hub-glas.css";
import { DemoTile } from "@/components/demos/hub/demo-tile";
import { DemoTileStage } from "@/components/demos/hub/demo-tile-stage";
import { getDemosForLocale } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { ROUTE_PLAKAT } from "@/lib/plakat/palettes";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { defaultSocialImage } from "@/lib/seo/page-metadata";

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
      images: [defaultSocialImage(locale)],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.openGraphDescription(demos.length),
      images: [defaultSocialImage(locale)],
    },
  };
}

const CONTAINER = "mx-auto max-w-[75rem] px-4 sm:px-6";

const TEXT_LINK =
  "inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 [-webkit-tap-highlight-color:transparent] hover:decoration-mennige hover:decoration-2 active:decoration-mennige active:decoration-2";

/**
 * The hub (Glas, frost mode): six live trailers, not six posters. A soft
 * field hero with the intro (language-standard B.8), then
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
    <GlasRoot
      tone="hell"
      initialMode="frost"
      className="hub4 overflow-x-clip pb-10 sm:pb-20"
      data-plakat-page={ROUTE_PLAKAT.demos}
      data-demos-hub-glas=""
    >
      <JsonLd data={jsonLd} id="demos-jsonld" />

      {/* The hero: the hub's own soft field (Kalkweiß with three pools), the
          caps line, the H1 and the four-sentence intro. Frost mode: no live
          filter anywhere on the hub. */}
      <header data-demo-hub-hero="">
        <GlasStage feld={hubFeld([{ x: 0.06, y: 0.12 }, { x: 0.94, y: 0.3 }, { x: 0.55, y: 1.1 }])} className="hub4-hero">
          <div className={CONTAINER}>
            <p className="hub4-kicker">{copy.catalog.kicker}</p>
            <h1 id="demos-title" className="hub4-title">
              {copy.catalog.heading}
            </h1>
            <p className="hub4-lede">{copy.hub.lede}</p>
          </div>
        </GlasStage>
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
              <h3 className="dt-promise-title">{copy.catalog.promiseTitle}</h3>
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
    </GlasRoot>
  );
}
