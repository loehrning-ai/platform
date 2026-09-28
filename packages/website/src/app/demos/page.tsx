import type { Metadata } from "next";
import {
  DemoGrid,
  type DemoGridInitialFilters,
} from "@/components/demos/demo-grid";
import { StatRow } from "@/components/werk";
import { CapsLine, Halftone, PlakatBand } from "@/components/plakat";
import {
  DEMO_CATEGORIES,
  DEMO_LEVELS,
  type DemoCategory,
  type DemoExternalActionMode,
  type DemoLevel,
} from "@/lib/demos";
import { getDemoIndustries, getDemosForLocale } from "@/lib/demos-localization";
import { DEMOS_PAGE_COPY } from "@/lib/demos-ui-copy";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { posterTitleFallbackStyle } from "@/lib/plakat/fit";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const demos = getDemosForLocale(locale);
  const copy = DEMOS_PAGE_COPY[locale].metadata;
  const localizedPath = localizeHref("/demos", locale);
  const alternates = buildLocaleAlternates(
    "/demos",
    contentLocalesForPath("/demos"),
  );

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

type DemoSearchParams = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

interface DemosPageProps {
  readonly searchParams: Promise<DemoSearchParams>;
}

function isDemoLevel(value: unknown): value is DemoLevel {
  return (
    typeof value === "string" &&
    DEMO_LEVELS.some((candidate) => candidate === value)
  );
}

function isDemoCategory(value: unknown): value is DemoCategory {
  return (
    typeof value === "string" &&
    DEMO_CATEGORIES.some((candidate) => candidate === value)
  );
}

/**
 * Whether an action mode reaches a real system. The stat counts demos from
 * the registry through this map, so a new mode has to declare itself here
 * before the hub can render.
 */
const ACTION_REACHES_SYSTEM: Readonly<Record<DemoExternalActionMode, boolean>> = {
  none: false,
  simulated: false,
  review_gated: false,
  real_disabled: false,
};

/**
 * From lg the band's corner dots sit 12px inside the 75rem content box
 * instead of the viewport corners, so they frame the text column on wide
 * screens (below 75rem both edges are the same).
 */
const CONTENT_BOX_DOTS =
  "lg:[&>[data-corner$=left]]:left-[max(0.75rem,calc(50%-36.75rem))] lg:[&>[data-corner$=right]]:right-[max(0.75rem,calc(50%-36.75rem))]";

/**
 * The halftone keeps a dot pitch of about 6 to 7px (its mask's dots sit 16px
 * apart at 1600px): phones show a 48px strip cut from the field at 700px
 * wide (a motif line, so the first examples reach the first screen), and
 * from lg the field fills a column beside the lede at 176px high.
 */
const HALFTONE_CLASS =
  "mt-4 max-sm:h-12 max-sm:[mask-size:700px_auto] sm:mt-8 lg:mt-0 lg:h-44";

function singleValue(
  value: string | readonly string[] | undefined,
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function sanitizeDemoFilters(
  params: DemoSearchParams,
  industries: ReadonlySet<string>,
): DemoGridInitialFilters {
  const level = singleValue(params.level);
  const category = singleValue(params.cat);
  const industry = singleValue(params.industry);

  return {
    level: isDemoLevel(level) ? level : "alle",
    category: isDemoCategory(category) ? category : "Alle",
    industry:
      typeof industry === "string" && industries.has(industry) ? industry : "",
  };
}

export default async function DemosPage({ searchParams }: DemosPageProps) {
  const locale = await getRequestLocale();
  const demos = getDemosForLocale(locale);
  const copy = DEMOS_PAGE_COPY[locale];
  const industries = new Set(getDemoIndustries(locale));
  const initialFilters = sanitizeDemoFilters(await searchParams, industries);
  const filterKey = [
    locale,
    initialFilters.level,
    initialFilters.category,
    initialFilters.industry,
  ].join(":");
  const localizedPath = localizeHref("/demos", locale);

  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "CollectionPage",
        name: copy.metadata.title,
        description: copy.metadata.description(demos.length),
        url: `${SITE_URL}${localizedPath}`,
        inLanguage: locale === "de" ? "de-DE" : "en-GB",
        publisher: { "@id": ORG_ID },
        hasPart: demos.map((demo) => ({
          "@type": "LearningResource",
          name: `${demo.title} ${demo.titleKicker}`,
          description: demo.description,
          url: `${SITE_URL}${localizeHref(`/demos/${demo.slug}`, locale)}`,
          inLanguage: locale === "de" ? "de-DE" : "en-GB",
          isAccessibleForFree: true,
          learningResourceType: "Interactive practice example",
        })),
      },
    ],
  };

  const stats = [
    {
      label: copy.catalog.stats.examples.label,
      value: demos.length,
      note: copy.catalog.stats.examples.note,
    },
    {
      label: copy.catalog.stats.modes.label,
      value: new Set(demos.map((demo) => demo.evidenceMode)).size,
      note: copy.catalog.stats.modes.note,
    },
    {
      label: copy.catalog.stats.externalActions.label,
      value: demos.filter((demo) => ACTION_REACHES_SYSTEM[demo.externalActionMode])
        .length,
      note: copy.catalog.stats.externalActions.note,
    },
  ];

  return (
    <div className="overflow-x-clip" data-plakat-page="idea">
      <JsonLd data={jsonLd} id="demos-jsonld" />

      {/* IDEA band (SPEC §3.12): four corner dots, the arrow caps line, the
          Himbeere poster H1, a 17px Kobalt lede and one halftone image, so
          the band keeps three type sizes. Everything factual (the stats) sits
          on paper right below. Below sm the halftone is a 112px strip, so the first
          example still starts in the first screen. From lg the halftone
          sits beside the lede, so the catalogue heading reaches the first
          view, and the dots mark the content box, not the viewport corners.
          The halftone keeps a dot pitch of about 6 to 7px at every width:
          phones show a 700px crop of the field instead of shrinking it. */}
      <header data-demo-atlas-hero>
        <PlakatBand
          plakat="idea"
          labelledBy="demo-atlas-title"
          cornerDots
          className={CONTENT_BOX_DOTS}
        >
          <CapsLine arrow>
            {copy.catalog.kicker}
            {/* Below sm the detail drops, so the caps line stays one row. */}
            <span className="max-sm:hidden"> · {copy.catalog.kickerDetail}</span>
          </CapsLine>
          <h1
            id="demo-atlas-title"
            className="poster-title mt-4 text-scene-mid sm:mt-5"
            style={posterTitleFallbackStyle(copy.catalog.heading)}
          >
            {copy.catalog.heading}
          </h1>
          <div className="lg:mt-8 lg:grid lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-end lg:gap-12">
            <p className="mt-4 max-w-[46ch] text-[1.0625rem] leading-normal text-scene-ink text-pretty sm:mt-5 lg:mt-0">
              {copy.catalog.introduction}
            </p>
            <Halftone field="demos" className={HALFTONE_CLASS} />
          </div>
        </PlakatBand>
      </header>

      {/* Paper below the band: the registry-derived stats. Below sm one
          caption line carries the same numbers, so the first examples start
          soon after the band. */}
      <div
        className="px-4 pb-5 pt-4 sm:px-6 sm:pb-12 sm:pt-10"
        data-demo-atlas-facts
      >
        <div className="mx-auto max-w-6xl">
          {/* A wrapping list of unbreakable items. Every item carries a
              1em "·" before it, and the list is pulled 1em left inside a
              clipping wrapper: whichever item opens a line has its
              separator clipped, so no line starts or ends with "·". */}
          <div className="overflow-hidden sm:hidden">
            <ul
              className="-ml-[1em] flex list-none flex-wrap p-0 text-caption text-muted-foreground tabular-nums"
              data-demo-stats-line
            >
              {copy.catalog
                .statsLine(stats[0].value, stats[2].value)
                .map((item) => (
                  <li
                    key={item}
                    className="whitespace-nowrap before:inline-block before:w-[1em] before:text-center before:content-['·']"
                  >
                    {item}
                  </li>
                ))}
            </ul>
          </div>
          <div className="grid gap-10 max-sm:hidden lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
            <div
              className="min-w-0"
              aria-label={copy.catalog.statsLabel}
              role="group"
            >
              <StatRow stats={stats} />
            </div>
          </div>
        </div>
      </div>

      <section
        className="px-4 pb-12 sm:px-6 sm:pb-16"
        aria-labelledby="demo-gallery-heading"
      >
        <div className="mx-auto max-w-6xl">
          <DemoGrid
            key={filterKey}
            initialFilters={initialFilters}
            locale={locale}
            catalog={demos}
          />
        </div>
      </section>
    </div>
  );
}
