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
import {
  getDemoIndustries,
  getDemosForLocale,
} from "@/lib/demos-localization";
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
      typeof industry === "string" && industries.has(industry)
        ? industry
        : "",
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

      <section className="relative overflow-hidden border-b border-border bg-foreground px-4 pb-12 pt-16 text-background sm:px-6 md:px-10 md:pb-16 md:pt-20">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 hidden w-[42%] border-l border-background/15 bg-[linear-gradient(135deg,transparent_0_42%,rgba(183,58,21,0.3)_42%_43%,transparent_43%_61%,rgba(183,58,21,0.18)_61%_62%,transparent_62%)] lg:block"
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div className="min-w-0">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-kupfer-light">
              {copy.catalog.kicker}
            </div>
            <h1 className="mt-5 max-w-4xl text-balance text-[clamp(2.35rem,7vw,5.4rem)] font-bold leading-[0.94] tracking-[-0.04em]">
              {copy.catalog.headingLead}{" "}
              <span className="text-kupfer-light">{copy.catalog.headingAccent}</span>
            </h1>
            <p className="mt-7 max-w-3xl text-pretty text-sm leading-7 text-background/75 sm:text-base">
              {copy.catalog.introduction}
            </p>
          </div>

          <aside className="border border-background/25 bg-background/[0.04] p-4 sm:p-5" aria-label={copy.catalog.scopeLabel}>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-kupfer-light">
              {copy.catalog.scopeLabel}
            </div>
            <ol className="mt-4 space-y-3">
              {copy.catalog.scopeItems.map((item, index) => (
                <li key={item} className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-2 text-sm leading-5 text-background/80">
                  <span className="font-mono text-xs font-bold text-kupfer-light">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        <div className="relative mx-auto mt-10 grid max-w-7xl grid-cols-1 border-y border-background/20 sm:grid-cols-3">
          {copy.catalog.stats.map((stat) => (
            <div key={stat.label} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 border-b border-background/20 py-3 last:border-b-0 sm:block sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
              <div className="font-mono text-2xl font-bold tabular-nums text-kupfer-light">{stat.value}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-background/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-3 pb-20 pt-8 sm:px-6 md:px-10">
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
