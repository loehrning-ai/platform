import type { Metadata } from "next";
import {
  DemoGrid,
  type DemoGridInitialFilters,
} from "@/components/demos/demo-grid";
import { Kicker, StatRow } from "@/components/werk";
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
    <div className="overflow-x-clip">
      <JsonLd data={jsonLd} id="demos-jsonld" />

      {/* Paper hero: kicker, one-colour H1, lead, the three checks as an
          ink-square list, then evidence stats derived from the registry.
          Below sm the hero is kicker, H1, the lead's first sentence and one
          stat line, so the first examples sit inside the first screen; the
          check list repeats the lead there and is left out. */}
      <header
        className="px-4 pb-6 pt-5 sm:px-6 sm:pb-12 sm:pt-12"
        data-demo-atlas-hero
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-12">
            <div className="min-w-0">
              <Kicker>{copy.catalog.kicker}</Kicker>
              <h1 className="mt-2 max-w-[22ch] text-fluid-h1 font-bold text-foreground sm:mt-3">
                {copy.catalog.heading}
              </h1>
              <p className="mt-3 max-w-[56ch] text-lead text-muted-foreground text-pretty max-sm:text-[1.0625rem] max-sm:leading-normal sm:mt-4">
                {copy.catalog.introduction}
                <span className="max-sm:hidden"> {copy.catalog.introductionDetail}</span>
              </p>
              {/* A wrapping list of unbreakable items. Every item carries a
                  1em "·" before it, and the list is pulled 1em left inside a
                  clipping wrapper: whichever item opens a line has its
                  separator clipped, so no line starts or ends with "·". */}
              <div className="mt-3 overflow-hidden sm:hidden">
                <ul
                  className="-ml-[1em] flex list-none flex-wrap p-0 text-caption text-muted-foreground tabular-nums"
                  data-demo-stats-line
                >
                  {copy.catalog
                    .statsLine(stats[0].value, stats[1].value, stats[2].value)
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
            </div>
            {/* Top-aligned with the H1 (the kicker line plus its gap sits above
                it), so both columns share a first line at every width. */}
            <div
              className="min-w-0 max-sm:hidden lg:pt-[calc(var(--text-label)*1.3+0.75rem)]"
              data-demo-scope
            >
              <p
                id="demo-scope-label"
                className="text-label text-foreground"
              >
                {copy.catalog.scopeLabel}
              </p>
              <ul
                aria-labelledby="demo-scope-label"
                className="mt-3 border-t border-hairline"
              >
                {copy.catalog.scopeItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-baseline gap-3 border-b border-hairline py-3 text-body text-foreground"
                  >
                    <span
                      className="size-2.5 shrink-0 translate-y-[-0.1em] bg-foreground"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* From sm up the stats stand as a StatRow. Below sm the stat line
              under the lead says the same in one caption. */}
          <div
            className="mt-10 border-t border-hairline pt-6 max-sm:hidden"
            aria-label={copy.catalog.statsLabel}
            role="group"
          >
            <StatRow stats={stats} />
          </div>
        </div>
      </header>

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
