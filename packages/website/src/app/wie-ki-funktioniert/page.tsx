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

  return (
    <>
      <JsonLd
        data={courseGraph(locale)}
        id="wie-ki-funktioniert-course-jsonld"
      />

      <main className="mx-auto w-full max-w-6xl min-w-0 px-4 pb-24 pt-12 sm:px-6 sm:pb-32 sm:pt-20 lg:px-10">
        <nav aria-label={copy.breadcrumbLabel} className="mb-10 min-w-0">
          <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground sm:tracking-[0.1em]">
            <li>
              <Link
                href={localizeHref("/", locale)}
                className="break-words hover:text-foreground"
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

        <header className="min-w-0 border-b-2 border-foreground pb-12">
          <div className="h-[3px] w-[120px] bg-brand-orange" />
          <p className="mt-7 break-words font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-brand-orange sm:tracking-[0.18em]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-5 max-w-5xl break-words text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.055em] text-foreground [overflow-wrap:anywhere]">
            {meta.title}
          </h1>
          <p className="mt-6 max-w-3xl break-words text-[18px] leading-[1.6] text-muted-foreground sm:text-[21px]">
            {meta.subtitle}
          </p>
          <div className="mt-8 grid min-w-0 gap-2 font-mono text-[12px] text-muted-foreground sm:max-w-3xl sm:grid-cols-2 sm:gap-6">
            <p className="break-words">
              {copy.lessonSummary(meta.durationMinutes)}
            </p>
            <p className="break-words sm:text-right">{copy.resumeNote}</p>
          </div>
        </header>

        <ol
          className="mt-10 grid min-w-0 gap-px border border-border bg-border md:grid-cols-2"
          data-testid="lektion-cards"
        >
          {lektionen.map((lektion) => (
            <li key={lektion.id} className="min-w-0 bg-background">
              <Link
                href={localizeHref(`${PATH}/${lektion.id}`, locale)}
                className="group flex h-full min-w-0 flex-col p-5 transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-orange sm:p-7"
              >
                <span className="break-words font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brand-orange sm:tracking-[0.14em]">
                  {copy.lessonLabel(
                    lektion.number,
                    lektion.durationMinutes,
                  )}
                </span>
                <h2 className="mt-4 break-words text-[20px] font-bold leading-[1.16] tracking-[-0.025em] text-foreground [overflow-wrap:anywhere] group-hover:text-brand-orange sm:text-[24px]">
                  {lektion.title}
                </h2>
                <p className="mt-3 min-w-0 break-words text-[14px] leading-[1.6] text-muted-foreground [overflow-wrap:anywhere] sm:text-[15px]">
                  {lektion.subtitle}
                </p>
                <span className="mt-7 block break-words font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-brand-orange sm:tracking-[0.1em]">
                  {copy.startLesson} <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <aside className="mt-16 grid min-w-0 gap-6 border-2 border-foreground bg-card p-5 shadow-[5px_5px_0_var(--color-foreground)] sm:p-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <p className="break-words font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              {copy.nextEyebrow}
            </p>
            <p className="mt-3 max-w-3xl break-words text-[15px] leading-[1.65] text-muted-foreground [overflow-wrap:anywhere]">
              {copy.nextBody}
            </p>
          </div>
          <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:flex-wrap md:flex-col md:items-stretch">
            <Link
              href={localizeHref("/ki-fuehrerschein", locale)}
              className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 break-words bg-brand-orange px-5 py-3 text-left font-mono text-[12px] font-bold text-white transition-colors hover:bg-brand-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            >
              {copy.driverLicense} <span aria-hidden="true">→</span>
            </Link>
            <Link
              href={localizeHref("/einstieg", locale)}
              className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 break-words border border-border bg-background px-5 py-3 text-left font-mono text-[12px] font-bold text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {copy.backToEntry}
            </Link>
          </div>
        </aside>
      </main>
    </>
  );
}

export default async function WieKiFunktioniertPage() {
  return <WieKiFunktioniertContent locale={await getRequestLocale()} />;
}
