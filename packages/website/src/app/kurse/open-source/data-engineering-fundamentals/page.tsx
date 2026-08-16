import type { Metadata } from "next";
import Link from "next/link";
import {
  DATA_ENGINEERING_FUNDAMENTALS_CONFIG,
  DATA_ENGINEERING_FUNDAMENTALS_CONFIG_DE,
} from "@/lib/data-engineering-fundamentals/config";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import {
  DEF_CHAPTERS,
  type ChapterMeta,
  type DefChapterId,
} from "@/lib/data-engineering-fundamentals/types";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd, SITE_URL, type JsonLdGraph } from "@/lib/seo/json-ld";
import {
  buildTechnicalCourseJsonLd,
  buildTechnicalCourseMetadata,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";

const CANONICAL_PATH = "/kurse/open-source/data-engineering-fundamentals";

const GERMAN_LANDING_CHAPTER_META: Readonly<
  Record<DefChapterId, Pick<ChapterMeta, "title" | "subtitle">>
> = {
  home: {
    title: "Überblick",
    subtitle: "Die Pipeline vom Anfang bis zum Ende",
  },
  fund: { title: "Grundlagen", subtitle: "Speicher, Formate und Engines" },
  ingest: { title: "Datenaufnahme", subtitle: "Wo Daten entstehen" },
  stream: { title: "Streaming", subtitle: "Die Brücke zum Warehouse" },
  store: { title: "Speicherung", subtitle: "Wo Daten liegen" },
  comp: { title: "Verarbeitung", subtitle: "Wie Daten gelesen werden" },
  orch: { title: "Orchestrierung", subtitle: "Airflow und Idempotenz" },
  qual: {
    title: "Qualität",
    subtitle: "Ausgeführt ist nicht gleich korrekt",
  },
  disc: { title: "Ermittlung", subtitle: "Katalog- und Lineage-Übung" },
  serve: {
    title: "Bereitstellung",
    subtitle: "Metriken und semantische Modelle",
  },
  gov: { title: "Governance", subtitle: "Die Deployment-Schranke" },
  cap: {
    title: "Abschlussprojekt",
    subtitle: "dim_users durchgängig aufbauen",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = getDataEngineeringFundamentalsCourseCopy(locale).landingMetadata;
  return buildTechnicalCourseMetadata({
    courseSlug: "data-engineering-fundamentals",
    locale,
    target: { kind: "landing" },
    title: copy.title,
    description: copy.description,
    availableContentLocales: contentLocalesForPath(CANONICAL_PATH),
  });
}

export default async function DataEngineeringFundamentalsLandingPage() {
  const locale = await getRequestLocale();
  // Landing pages need chapter identity and translated metadata, not the
  // chapter component registry. Loading the full registry here puts every
  // simulator in the landing page's eager client graph.
  const chapters = DEF_CHAPTERS.map((meta) => ({
    id: meta.id,
    meta:
      locale === "en"
        ? meta
        : { ...meta, ...GERMAN_LANDING_CHAPTER_META[meta.id] },
  }));
  const courseConfig =
    locale === "en"
      ? DATA_ENGINEERING_FUNDAMENTALS_CONFIG
      : DATA_ENGINEERING_FUNDAMENTALS_CONFIG_DE;
  const copy = getDataEngineeringFundamentalsCourseCopy(locale).landing;
  const overviewHref = technicalCourseHref(
    "data-engineering-fundamentals",
    locale,
    { kind: "chapter", chapterId: "home" },
  );
  const course = buildTechnicalCourseJsonLd({
    courseSlug: "data-engineering-fundamentals",
    locale,
    name: courseConfig.title,
    description: copy.jsonLdDescription,
    teaches: chapters
      .filter((chapter) => chapter.id !== "home")
      .map((chapter) => chapter.meta.title),
    timeRequired: "PT1H30M",
  });
  const { "@context": _context, ...courseNode } = course;
  const courseJsonLd: JsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: copy.breadcrumbs[0],
            item: locale === "en" ? `${SITE_URL}/en` : SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.breadcrumbs[1],
            item:
              locale === "en" ? `${SITE_URL}/en/kurse` : `${SITE_URL}/kurse`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: copy.breadcrumbs[2],
            item: `${SITE_URL}${technicalCourseHref(
              "data-engineering-fundamentals",
              locale,
              { kind: "landing" },
            )}`,
          },
        ],
      },
      {
        ...courseNode,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          url: `${SITE_URL}${overviewHref}`,
        },
      },
    ],
  };

  return (
    <>
      <JsonLd
        data={courseJsonLd}
        id="data-engineering-fundamentals-course-jsonld"
      />
      <main className="mx-auto w-full max-w-[1180px] min-w-0 px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        <section className="min-w-0 border-y-2 border-foreground py-10 sm:py-14">
          <p className="break-words font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <h1 className="mt-6 max-w-[980px] break-words text-[42px] font-bold leading-[0.98] tracking-[-0.045em] text-foreground [overflow-wrap:anywhere] sm:text-[60px] md:text-[76px]">
            {copy.title}
          </h1>
          <p className="mt-7 max-w-[760px] break-words text-[17px] leading-[1.65] text-muted-foreground [overflow-wrap:anywhere] sm:text-[18px]">
            {copy.intro}
          </p>

          <div className="mt-8 flex min-w-0 flex-wrap gap-3">
            <Link
              href={overviewHref}
              prefetch={false}
              className="inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)] sm:px-6 sm:text-[13px]"
            >
              {copy.start}
              <span className="shrink-0" aria-hidden="true">
                →
              </span>
            </Link>
            <Link
              href="#chapters"
              className="inline-flex min-h-12 max-w-full items-center break-words border-2 border-foreground bg-background px-5 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card sm:px-6 sm:text-[13px]"
            >
              {copy.browse}
            </Link>
          </div>

          <ul className="mt-7 grid min-w-0 gap-px border border-foreground bg-foreground sm:grid-cols-2 lg:grid-cols-4">
            {copy.facts.map((fact) => (
              <li
                key={fact}
                className="min-w-0 break-words bg-background px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.07em] text-foreground [overflow-wrap:anywhere]"
              >
                {fact}
              </li>
            ))}
          </ul>
        </section>

        <dl className="mt-12 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {copy.stats.map((stat) => (
            <div
              key={stat.label}
              className="min-w-0 border-2 border-border bg-card p-4 text-center"
            >
              <dd className="break-words font-mono text-[24px] font-bold text-foreground sm:text-[26px]">
                {stat.value}
              </dd>
              <dt className="mt-1 break-words font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground [overflow-wrap:anywhere] sm:text-[11px]">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>

        <section id="chapters" className="mt-16 min-w-0 scroll-mt-24 sm:mt-20">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.courseEyebrow}
          </p>
          <h2 className="mt-2 max-w-[900px] break-words text-[28px] font-bold tracking-[-0.03em] text-foreground [overflow-wrap:anywhere] sm:text-[36px]">
            {copy.courseTitle}
          </h2>
          <p className="mt-3 max-w-[700px] break-words text-[15px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            {copy.courseIntro}
          </p>

          <ol className="mt-9 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter) => (
              <li key={chapter.id} className="min-w-0">
                <Link
                  href={technicalCourseHref(
                    "data-engineering-fundamentals",
                    locale,
                    { kind: "chapter", chapterId: chapter.id },
                  )}
                  prefetch={false}
                  className="group flex h-full min-w-0 flex-col border-2 border-border bg-card p-4 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand-orange"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <p className="min-w-0 break-words font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-brand-orange [overflow-wrap:anywhere]">
                      {copy.chapterLabel(
                        chapter.meta.displayNumber,
                        chapter.id,
                      )}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {copy.duration(chapter.meta.estimatedMinutes)}
                    </span>
                  </div>
                  <h3 className="mt-2 break-words text-[16px] font-semibold text-foreground [overflow-wrap:anywhere]">
                    {chapter.meta.title}
                  </h3>
                  <p className="mt-1.5 break-words text-[12.5px] leading-[1.5] text-muted-foreground [overflow-wrap:anywhere]">
                    {chapter.meta.subtitle}
                  </p>
                  <span
                    className="mt-auto self-end pt-3 text-brand-orange transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 min-w-0 border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_var(--color-foreground)] sm:mt-20 sm:p-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.finalEyebrow}
          </p>
          <h2 className="mt-2 break-words text-[26px] font-bold text-foreground [overflow-wrap:anywhere] sm:text-[32px]">
            {copy.finalTitle}
          </h2>
          <p className="mt-3 max-w-[620px] break-words text-[14px] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            {copy.finalBody}
          </p>
          <Link
            href={overviewHref}
            prefetch={false}
            className="mt-6 inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)] sm:px-6 sm:text-[13px]"
          >
            {copy.finalCta}
            <span className="shrink-0" aria-hidden="true">
              →
            </span>
          </Link>
        </section>
      </main>
    </>
  );
}
