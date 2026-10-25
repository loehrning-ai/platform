import type { Metadata } from "next";
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

/**
 * From lg the band's corner dots sit 12px inside the 75rem content box
 * instead of the viewport corners, so they frame the text column on wide
 * screens (below 75rem both edges are the same).
 */
const CONTENT_BOX_DOTS =
  "lg:[&>[data-corner$=left]]:left-[max(0.75rem,calc(50%-36.75rem))] lg:[&>[data-corner$=right]]:right-[max(0.75rem,calc(50%-36.75rem))]";

const TEXT_LINK =
  "inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 [-webkit-tap-highlight-color:transparent] hover:decoration-mennige hover:decoration-2 active:decoration-mennige active:decoration-2";

/**
 * The hub: five live trailers, not five posters. A short IDEA band, then a
 * grid of tiles (one column on a phone, two from md, three from lg), each a
 * miniature of the demo's own object that plays its story once when first
 * seen and replays on hover or focus (demo-tile-stage.tsx). The sixth cell
 * states the promise all five share.
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

      {/* IDEA band: four corner dots, the arrow caps line, the Himbeere
          poster H1 and a 17px Kobalt lede. No picture: the tiles below are it. */}
      <header data-demo-hub-hero="">
        <PlakatBand
          plakat={ROUTE_PLAKAT.demos}
          labelledBy="demos-title"
          cornerDots
          className={CONTENT_BOX_DOTS}
        >
          <CapsLine arrow>{copy.catalog.kicker}</CapsLine>
          <h1
            id="demos-title"
            className="poster-title mt-4 text-scene-mid sm:mt-5"
            style={posterTitleFallbackStyle(copy.catalog.heading)}
          >
            {copy.catalog.heading}
          </h1>
          <p className="mt-4 max-w-[46ch] text-[1.0625rem] leading-normal text-scene-ink text-pretty sm:mt-5">
            {copy.catalog.introduction}
          </p>
        </PlakatBand>
      </header>

      <section aria-labelledby="demo-list-heading" className="pt-8 sm:pt-12">
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
