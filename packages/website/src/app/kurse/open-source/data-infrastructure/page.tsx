import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  TECHNICAL_COURSE_LEDGER_LINK_CLASS,
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseHeader,
  TechnicalCourseSectionHeading,
} from "@/components/course/technical-course-landing";
import { TechnicalCourseTrackProgress } from "@/components/course/technical-course-progress";
import { getDataInfraCourseCopy } from "@/lib/data-infrastructure/course-copy";
import { getDataInfraLandingManifest } from "@/lib/data-infrastructure/landing-manifest";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd, SITE_URL, type JsonLdGraph } from "@/lib/seo/json-ld";
import {
  buildTechnicalCourseJsonLd,
  buildTechnicalCourseMetadata,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";

const CANONICAL_PATH = "/kurse/open-source/data-infrastructure";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = getDataInfraCourseCopy(locale).landingMetadata;
  return buildTechnicalCourseMetadata({
    courseSlug: "data-infrastructure",
    locale,
    target: { kind: "landing" },
    title: copy.title,
    description: copy.description,
    availableContentLocales: contentLocalesForPath(CANONICAL_PATH),
  });
}

export default async function DataInfrastructureLandingPage() {
  const locale = await getRequestLocale();
  const { courseTitle, lessons, tracks } = getDataInfraLandingManifest(locale);
  const courseCopy = getDataInfraCourseCopy(locale);
  const copy = courseCopy.landing;
  const firstLessonHref = technicalCourseHref("data-infrastructure", locale, {
    kind: "lesson",
    lessonId: "mental-model",
  });
  const readerHref = technicalCourseHref("data-infrastructure", locale, {
    kind: "reader",
  });
  const course = buildTechnicalCourseJsonLd({
    courseSlug: "data-infrastructure",
    locale,
    name: courseTitle,
    description: copy.jsonLdDescription,
    teaches: tracks.map((track) => track.title),
    timeRequired: "PT3H",
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
            item: `${SITE_URL}${technicalCourseHref("data-infrastructure", locale, { kind: "landing" })}`,
          },
        ],
      },
      {
        ...courseNode,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          url: `${SITE_URL}${readerHref}`,
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={courseJsonLd} id="data-infrastructure-course-jsonld" />
      <TechnicalCourseFrame courseId="data-infrastructure" lang={locale}>
        <TechnicalCourseHeader
          eyebrow={copy.eyebrow}
          title={copy.title}
          intro={copy.intro}
          facts={copy.facts}
          factsLabel={locale === "de" ? "Kursdaten" : "Course facts"}
          primaryAction={
            <Link
              href={firstLessonHref}
              prefetch={false}
              className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}
            >
              {copy.start}
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          }
          secondaryAction={
            <Link
              href="#tracks"
              className={TECHNICAL_COURSE_SECONDARY_ACTION_CLASS}
            >
              {copy.map}
            </Link>
          }
        />

        <section id="tracks" className="mt-10 min-w-0 scroll-mt-24">
          <TechnicalCourseSectionHeading
            eyebrow={copy.courseEyebrow}
            title={copy.courseTitle}
          />

          <div className="mt-5 min-w-0 border-b border-border">
            {tracks.map((track) => {
              const trackLessons = lessons.filter(
                (lesson) => lesson.trackId === track.id,
              );
              return (
                <section
                  key={track.id}
                  className="grid min-w-0 border-t border-border lg:grid-cols-[240px_minmax(0,1fr)]"
                >
                  <div className="min-w-0 py-4 pr-5 lg:border-r lg:border-border">
                    <p className="break-words font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
                      {track.label}
                    </p>
                    <h3 className="mt-1 break-words text-lg font-bold text-foreground">
                      {track.title}
                    </h3>
                    <p className="mt-1 break-words text-[13px] leading-[1.45] text-muted-foreground">
                      {track.hint}
                    </p>
                  </div>
                  <ul className="min-w-0 lg:pl-3">
                    {trackLessons.map((lesson) => (
                      <li key={lesson.id} className="min-w-0">
                        <Link
                          href={technicalCourseHref(
                            "data-infrastructure",
                            locale,
                            { kind: "lesson", lessonId: lesson.id },
                          )}
                          prefetch={false}
                          className={`${TECHNICAL_COURSE_LEDGER_LINK_CLASS} grid-cols-[4.75rem_minmax(0,1fr)_1rem]`}
                        >
                          <p className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-brand-orange">
                            {copy.lessonLabel(lesson.number)}
                          </p>
                          <div className="min-w-0">
                            <h4 className="break-words text-[15px] font-semibold text-foreground [overflow-wrap:anywhere]">
                              {lesson.title}
                            </h4>
                            <p className="mt-0.5 break-words text-[13px] leading-[1.4] text-muted-foreground [overflow-wrap:anywhere]">
                              {lesson.hook}
                            </p>
                          </div>
                          <ArrowRight
                            className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-orange"
                            aria-hidden="true"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <TechnicalCourseSectionHeading
            eyebrow={copy.progressEyebrow}
            title={copy.progressTitle}
          />
          <div className="mt-4">
            <TechnicalCourseTrackProgress
              courseSlug="data-infrastructure"
              tracks={tracks}
              lessons={lessons.map((lesson) => ({
                id: lesson.id,
                trackId: lesson.trackId,
              }))}
              label={copy.progressTitle}
              overallLabel={courseCopy.progress.overall}
              unitLabel={courseCopy.progress.lessons}
            />
          </div>
        </section>
      </TechnicalCourseFrame>
    </>
  );
}
