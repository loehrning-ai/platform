import type { Metadata } from "next";
import Link from "next/link";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";
import { getWieKiContent } from "@/lib/wie-ki-funktioniert";
import { WIE_KI_LANDING_COPY } from "@/lib/wie-ki-funktioniert-copy";

const PATH = "/wie-ki-funktioniert";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = WIE_KI_LANDING_COPY[locale].metadata;
  const localizedPath = localizeHref(PATH, locale);
  const metadata = createPublicPageMetadata({
    title: copy.title,
    description: copy.description,
    path: localizedPath,
    locale,
  });

  return {
    ...metadata,
    alternates: {
      ...buildLocaleAlternates(PATH, contentLocalesForPath(PATH)),
      canonical: localizedPath,
    },
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          description: copy.openGraphDescription,
          locale: locale === "de" ? "de_DE" : "en_GB",
          alternateLocale: [locale === "de" ? "en_GB" : "de_DE"],
        }
      : metadata.openGraph,
  };
}

function courseGraph(locale: Locale) {
  const { meta, lektionen } = getWieKiContent(locale);
  const copy = WIE_KI_LANDING_COPY[locale];
  const localizedPath = localizeHref(PATH, locale);
  const pageUrl = `${SITE_URL}${localizedPath}`;

  return {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: copy.home,
            item: `${SITE_URL}${localizeHref("/", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: meta.title,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "Course",
        "@id": `${pageUrl}#course`,
        name: meta.title,
        description: meta.subtitle,
        url: pageUrl,
        inLanguage: locale,
        isAccessibleForFree: true,
        educationalLevel: "Beginner",
        timeRequired: `PT${meta.durationMinutes}M`,
        provider: { "@id": ORG_ID },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          url: pageUrl,
        },
        hasPart: lektionen.map((lektion) => ({
          "@type": "LearningResource",
          position: lektion.number,
          name: lektion.title,
          description: lektion.subtitle,
          timeRequired: `PT${lektion.durationMinutes}M`,
          inLanguage: locale,
          isAccessibleForFree: true,
          url: `${SITE_URL}${localizeHref(`${PATH}/${lektion.id}`, locale)}`,
        })),
      },
    ],
  };
}

function WieKiFunktioniertContent({ locale }: { readonly locale: Locale }) {
  const { meta, lektionen } = getWieKiContent(locale);
  const copy = WIE_KI_LANDING_COPY[locale];
  const firstLesson = lektionen[0];

  return (
    <>
      <JsonLd
        data={courseGraph(locale)}
        id="wie-ki-funktioniert-course-jsonld"
      />

      <div
        className="mx-auto w-full max-w-6xl min-w-0 px-4 pb-12 pt-4 sm:px-6 sm:pt-6 lg:px-10"
        data-learning-explainer="ledger"
      >
        <nav aria-label={copy.breadcrumbLabel} className="min-w-0">
          <ol className="flex min-w-0 flex-wrap items-center gap-x-2 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <li>
              <Link
                href={localizeHref("/", locale)}
                className="inline-flex min-h-11 items-center break-words hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                {copy.home}
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li
              className="min-w-0 break-words text-foreground [overflow-wrap:anywhere]"
              aria-current="page"
            >
              {meta.title}
            </li>
          </ol>
        </nav>

        <header className="grid min-w-0 gap-6 border-y-2 border-foreground py-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="min-w-0">
            <p className="break-words font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              {copy.eyebrow}
            </p>
            <h1 className="mt-2 max-w-4xl break-words text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[0.96] tracking-[-0.04em] text-foreground [overflow-wrap:anywhere]">
              {meta.title}
            </h1>
            <p className="mt-3 max-w-3xl break-words text-base leading-[1.55] text-muted-foreground sm:text-lg">
              {meta.subtitle}
            </p>
          </div>
          <div className="min-w-0 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <p className="font-mono text-xs text-muted-foreground">
              {copy.lessonSummary(meta.durationMinutes)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {copy.resumeNote}
            </p>
            {firstLesson ? (
              <Link
                href={localizeHref(`${PATH}/${firstLesson.id}`, locale)}
                aria-label={`${locale === "de" ? "Lektion 1 öffnen" : "Open lesson 1"}: ${firstLesson.title}`}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-between gap-3 bg-brand-orange px-4 py-3 font-mono text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                data-primary-action
              >
                {locale === "de" ? "Lektion 1 öffnen" : "Open lesson 1"}
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
        </header>

        <ol
          className="mt-8 min-w-0 border-y border-border"
          data-testid="lektion-cards"
        >
          {lektionen.map((lektion) => (
            <li
              key={lektion.id}
              className="min-w-0 border-b border-border last:border-b-0"
            >
              <Link
                href={localizeHref(`${PATH}/${lektion.id}`, locale)}
                aria-label={`${copy.startLesson}: ${lektion.title}`}
                className="group grid min-h-11 min-w-0 gap-2 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange sm:grid-cols-[5.5rem_minmax(0,1fr)_8rem_1.5rem] sm:items-center sm:gap-4"
              >
                <span className="break-words font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
                  {copy.lessonLabel(lektion.number, lektion.durationMinutes)}
                </span>
                <span className="min-w-0">
                  <span className="block break-words text-lg font-bold leading-tight tracking-[-0.02em] text-foreground [overflow-wrap:anywhere] group-hover:text-brand-orange sm:text-xl">
                    {lektion.title}
                  </span>
                  <span className="mt-1 block break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                    {lektion.subtitle}
                  </span>
                </span>
                <span className="hidden font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground sm:block sm:text-right">
                  {copy.startLesson}
                </span>
                <span
                  className="hidden text-right text-lg text-brand-orange sm:block"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <aside className="mt-8 grid min-w-0 gap-4 border-y border-border py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="min-w-0">
            <p className="break-words font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
              {copy.nextEyebrow}
            </p>
            <p className="mt-2 max-w-3xl break-words text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
              {copy.nextBody}
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-5">
            <Link
              href={localizeHref("/ki-fuehrerschein", locale)}
              className="inline-flex min-h-11 max-w-full items-center gap-2 break-words border-b border-brand-orange py-2 text-left font-mono text-xs font-bold text-foreground hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {copy.driverLicense} <span aria-hidden="true">→</span>
            </Link>
            <Link
              href={localizeHref("/einstieg", locale)}
              className="inline-flex min-h-11 max-w-full items-center break-words py-2 text-left font-mono text-xs font-bold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {copy.backToEntry}
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

export default async function WieKiFunktioniertPage() {
  return <WieKiFunktioniertContent locale={await getRequestLocale()} />;
}
