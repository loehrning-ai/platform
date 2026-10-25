import type { Metadata } from "next";
import Link from "next/link";
import { ArrowGlyph } from "@/components/werk";
import {
  CapsLine,
  Halftone,
  PlakatBand,
  PosterCover,
  PosterThumb,
} from "@/components/plakat";
import { demoLede, getDemosForLocale, type LocalizedDemo } from "@/lib/demos";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref, type Locale } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
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

/**
 * From lg the band's corner dots sit 12px inside the 75rem content box
 * instead of the viewport corners, so they frame the text column on wide
 * screens (below 75rem both edges are the same).
 */
const CONTENT_BOX_DOTS =
  "lg:[&>[data-corner$=left]]:left-[max(0.75rem,calc(50%-36.75rem))] lg:[&>[data-corner$=right]]:right-[max(0.75rem,calc(50%-36.75rem))]";

/**
 * The halftone keeps a dot pitch of about 6 to 7px: phones show a 48px strip
 * cut from the field at 700px wide, and from lg the field fills a column
 * beside the lede at 176px high.
 */
const HALFTONE_CLASS =
  "mt-4 max-sm:h-12 max-sm:[mask-size:700px_auto] sm:mt-8 lg:mt-0 lg:h-44";

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
          learningResourceType: "Interactive practice exercise",
          timeRequired: `PT${demo.minutes}M`,
        })),
      },
    ],
  };

  return (
    <div className="overflow-x-clip pb-10 sm:pb-20" data-plakat-page={ROUTE_PLAKAT.demos}>
      <JsonLd data={jsonLd} id="demos-jsonld" />

      {/* IDEA band: four corner dots, the arrow caps line, the Himbeere
          poster H1, a 17px Kobalt lede and one halftone image. */}
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
          <div className="lg:mt-8 lg:grid lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-end lg:gap-12">
            <p className="mt-4 max-w-[46ch] text-[1.0625rem] leading-normal text-scene-ink text-pretty sm:mt-5 lg:mt-0">
              {copy.catalog.introduction(demos.length)}
            </p>
            <Halftone field="demos" className={HALFTONE_CLASS} />
          </div>
        </PlakatBand>
      </header>

      <section aria-labelledby="demo-list-heading" className="pt-2 sm:pt-10">
        <div className={CONTAINER}>
          <h2 id="demo-list-heading" className="sr-only">
            {copy.catalog.listHeading}
          </h2>
          <ol data-demo-list="">
            {demos.map((demo) => (
              <li key={demo.slug} className="min-w-0">
                <DemoRow demo={demo} locale={locale} />
              </li>
            ))}
          </ol>
          <p
            data-demo-provenance=""
            className="mt-6 max-w-[64ch] text-[0.9375rem]/[1.5] text-muted-foreground text-pretty sm:mt-10"
          >
            {copy.catalog.provenance}
          </p>
        </div>
      </section>
    </div>
  );
}

/**
 * One demo as a hub row, the sibling of the workshop hub row: the workshop's
 * poster with its number (a thumb on a phone, the cover from md), the meta
 * line "Workshop NN · ca. X Min.", the title, the one question, and an arrow.
 * The link's ::after makes the whole row one target.
 */
function DemoRow({ demo, locale }: { readonly demo: LocalizedDemo; readonly locale: Locale }) {
  const copy = DEMOS_PAGE_COPY[locale].catalog;
  const headingId = `demo-${demo.slug}-heading`;
  const meta = [copy.workshopNumber(demo.workshopNumber), copy.minutes(demo.minutes)];

  return (
    <article
      id={`demo-${demo.slug}`}
      data-testid="demo-row"
      aria-labelledby={headingId}
      className="group relative grid min-w-0 scroll-mt-24 grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-x-4 border-b border-hairline py-4 outline-offset-4 has-[a:active]:outline has-[a:active]:outline-[3px] has-[a:active]:outline-mennige has-[a:focus-visible]:outline has-[a:focus-visible]:outline-[3px] has-[a:focus-visible]:outline-brand-orange max-md:-mx-4 max-md:px-4 max-md:outline-offset-[-3px] sm:max-md:-mx-6 sm:max-md:px-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10 md:py-10 lg:grid-cols-[18rem_minmax(0,1fr)]"
    >
      <figure className="min-w-0">
        <div
          aria-hidden="true"
          data-demo-tile=""
          className="transition-transform duration-300 ease-out motion-reduce:transition-none md:hidden [&>span]:w-[6.5rem] [@media(hover:hover)]:group-hover:-translate-y-[0.25rem] group-has-[a:focus-visible]:-translate-y-[0.25rem]"
        >
          <PosterThumb
            plakat={demo.plakat}
            motif={demo.motif}
            numeral={demo.workshopNumber}
            size="md"
          />
        </div>
        <div
          aria-hidden="true"
          data-demo-cover=""
          className="hidden transition-transform duration-300 ease-out motion-reduce:transition-none md:block [@media(hover:hover)]:group-hover:-translate-y-[0.25rem] group-has-[a:focus-visible]:-translate-y-[0.25rem]"
        >
          <PosterCover plakat={demo.plakat} motif={demo.motif} numeral={demo.workshopNumber} />
        </div>
      </figure>

      <div className="min-w-0">
        <p data-demo-meta="" className="text-caption text-muted-foreground tabular-nums md:text-label">
          {meta.map((part, position) => (
            <span key={part} className="whitespace-nowrap">
              {part}
              {position < meta.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
        <h3
          id={headingId}
          className="mt-0.5 max-w-[28ch] pr-8 text-[1.0625rem] font-bold leading-[1.2] tracking-[-0.01em] text-foreground text-balance decoration-2 underline-offset-4 group-hover:underline group-hover:decoration-mennige md:mt-2 md:text-[1.75rem]"
        >
          {demo.title}
        </h3>
        <p
          data-demo-row-question=""
          className="mt-1 max-w-[56ch] text-[0.9375rem]/[1.45] text-muted-foreground text-pretty md:mt-3 md:text-body"
        >
          {demoLede(demo)}
        </p>
        <Link
          href={`${localizeHref(`/demos/${demo.slug}`, locale)}?source=gallery`}
          aria-label={`${copy.open}: ${demo.title}`}
          className="inline-flex min-h-11 min-w-11 items-center gap-1.5 font-semibold text-foreground underline decoration-border underline-offset-4 [-webkit-tap-highlight-color:transparent] after:absolute after:inset-0 hover:decoration-mennige hover:decoration-2 group-hover:decoration-mennige group-hover:decoration-2 active:decoration-mennige active:decoration-2 supports-[selector(:has(*))]:focus-visible:outline-none max-md:absolute max-md:inset-0 max-md:items-start max-md:justify-end max-md:px-4 max-md:pt-[2.375rem] sm:max-md:px-6 md:mt-4"
        >
          <span className="max-md:sr-only">{copy.open}</span>
          <ArrowGlyph />
        </Link>
      </div>
    </article>
  );
}
