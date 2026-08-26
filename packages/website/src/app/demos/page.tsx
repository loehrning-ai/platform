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

      <header className="border-b border-border px-4 py-8 sm:px-6 sm:py-12 md:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end lg:gap-8">
          <div className="min-w-0">
            <div className="h-[3px] w-16 bg-brand-orange" aria-hidden="true" />
            <div className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              {copy.catalog.kicker}
            </div>
            <h1 className="mt-3 max-w-4xl text-balance text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[0.96] tracking-[-0.04em] text-foreground">
              {copy.catalog.headingLead}{" "}
              <span className="text-brand-orange">
                {copy.catalog.headingAccent}
              </span>
            </h1>
            <p className="mt-4 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {copy.catalog.introduction}
            </p>
          </div>

          <aside
            className="border border-border border-l-[3px] border-l-brand-orange bg-card"
            aria-label={copy.catalog.scopeLabel}
          >
            <details>
              <summary className="flex min-h-11 cursor-pointer items-center px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange">
                {copy.catalog.scopeLabel}
              </summary>
              <ol className="divide-y divide-border border-t border-border px-4">
                {copy.catalog.scopeItems.map((item, index) => (
                  <li
                    key={item}
                    className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-2 py-2 text-sm leading-5 text-muted-foreground"
                  >
                    <span className="font-mono text-xs font-bold text-brand-orange">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </details>
          </aside>
        </div>
      </header>

      <section className="px-3 pb-12 pt-6 sm:px-6 md:px-10">
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
