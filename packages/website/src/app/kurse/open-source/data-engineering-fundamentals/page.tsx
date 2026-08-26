import type { Metadata } from "next";
import Link from "next/link";
import {
  TECHNICAL_COURSE_LEDGER_LINK_CLASS,
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseHeader,
  TechnicalCourseSectionHeading,
} from "@/components/course/technical-course-landing";
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
      <TechnicalCourseFrame
        courseId="data-engineering-fundamentals"
        lang={locale}
      >
        <TechnicalCourseHeader
          eyebrow={copy.eyebrow}
          title={copy.title}
          intro={copy.intro}
          facts={copy.facts}
          factsLabel={locale === "de" ? "Kursdaten" : "Course facts"}
          primaryAction={
            <Link
              href={overviewHref}
              prefetch={false}
              className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}
            >
              {copy.start}
              <span className="shrink-0" aria-hidden="true">
                →
              </span>
            </Link>
          }
          secondaryAction={
            <Link
              href="#chapters"
              className={TECHNICAL_COURSE_SECONDARY_ACTION_CLASS}
            >
              {copy.browse}
            </Link>
          }
        />

        <section id="chapters" className="mt-12 min-w-0 scroll-mt-24">
          <TechnicalCourseSectionHeading
            eyebrow={copy.courseEyebrow}
            title={copy.courseTitle}
          />

          <ol className="mt-5 min-w-0 border-y border-border">
            {chapters.map((chapter) => (
              <li key={chapter.id} className="min-w-0">
                <Link
                  href={technicalCourseHref(
                    "data-engineering-fundamentals",
                    locale,
                    { kind: "chapter", chapterId: chapter.id },
                  )}
                  prefetch={false}
                  className={`${TECHNICAL_COURSE_LEDGER_LINK_CLASS} grid-cols-[5.75rem_minmax(0,1fr)_4rem_1rem]`}
                >
                  <p className="min-w-0 break-words font-mono text-xs font-bold uppercase tracking-[0.06em] text-brand-orange [overflow-wrap:anywhere]">
                    {copy.chapterLabel(chapter.meta.displayNumber, chapter.id)}
                  </p>
                  <div className="min-w-0">
                    <h3 className="break-words text-[15px] font-semibold text-foreground [overflow-wrap:anywhere]">
                      {chapter.meta.title}
                    </h3>
                    <p className="mt-0.5 break-words text-[13px] leading-[1.4] text-muted-foreground [overflow-wrap:anywhere]">
                      {chapter.meta.subtitle}
                    </p>
                  </div>
                  <span className="shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {copy.duration(chapter.meta.estimatedMinutes)}
                  </span>
                  <span
                    className="text-muted-foreground transition-colors group-hover:text-brand-orange"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </TechnicalCourseFrame>
    </>
  );
}
