import type { Metadata } from "next";
import {
  DemoGrid,
  type DemoGridInitialFilters,
} from "@/components/demos/demo-grid";
import {
  DEMO_CATEGORIES,
  DEMO_LEVELS,
  type DemoCategory,
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

  return (
    <div className="min-h-[100svh] overflow-x-clip">
      <JsonLd data={jsonLd} id="demos-jsonld" />

      <header
        className="border-b border-border px-4 py-6 sm:px-6 sm:py-8 md:px-10"
        data-demo-atlas-hero
      >
        <div className="mx-auto max-w-7xl border border-foreground/70 bg-background">
          <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.45fr)]">
            <div className="min-w-0 p-5 sm:p-7 lg:border-r lg:border-foreground/20 lg:p-9">
              <div className="flex items-center gap-3">
                <div
                  className="h-[3px] w-12 bg-brand-orange"
                  aria-hidden="true"
                />
                <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
                  {copy.catalog.kicker}
                </p>
              </div>
              <h1 className="mt-4 max-w-5xl text-balance text-[clamp(2.45rem,5.5vw,5.5rem)] font-bold leading-[0.9] tracking-[-0.055em] text-foreground">
                {copy.catalog.headingLead}{" "}
                <span className="text-brand-orange">
                  {copy.catalog.headingAccent}
                </span>
              </h1>
              <p className="mt-5 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                {copy.catalog.introduction}
              </p>
            </div>

            <aside
              className="bg-foreground p-5 text-background sm:p-6"
              aria-label={copy.catalog.scopeLabel}
            >
              <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-kupfer-light">
                {copy.catalog.scopeLabel}
              </p>
              <ol className="mt-4 border-t border-background/25">
                {copy.catalog.scopeItems.map((item, index) => (
                  <li
                    key={item}
                    className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b border-background/20 py-3 text-sm leading-5 text-background/80"
                  >
                    <span className="font-mono text-xs font-bold text-kupfer-light tabular-nums">
                      0{index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>

          <dl
            className="grid divide-y divide-foreground/20 border-t border-foreground/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
            aria-label={copy.catalog.kicker}
          >
            {copy.catalog.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex min-w-0 items-center justify-between gap-4 px-3 py-3 sm:block sm:px-5"
              >
                <dt className="text-pretty font-mono text-xs uppercase leading-4 tracking-[0.08em] text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-2xl font-bold tracking-[-0.04em] text-foreground sm:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <section className="px-3 pb-10 pt-5 sm:px-6 sm:pb-12 md:px-10">
        <div className="mx-auto max-w-7xl">
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
