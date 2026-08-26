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
import { getCodexCourseCopy } from "@/lib/codex/course-copy";
import { getCodexLocaleRegistry } from "@/lib/codex/data";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { JsonLd, SITE_URL, type JsonLdGraph } from "@/lib/seo/json-ld";
import {
  buildTechnicalCourseJsonLd,
  buildTechnicalCourseMetadata,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";

const CANONICAL_PATH = "/kurse/open-source/codex";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const registry = await getCodexLocaleRegistry();
  registry.get(locale);
  const copy = getCodexCourseCopy(locale).landingMetadata;
  return buildTechnicalCourseMetadata({
    courseSlug: "codex",
    locale,
    target: { kind: "landing" },
    title: copy.title,
    description: copy.description,
    availableContentLocales: contentLocalesForPath(CANONICAL_PATH),
  });
}

export default async function CodexCourseLandingPage() {
  const locale = await getRequestLocale();
  const bundle = (await getCodexLocaleRegistry()).get(locale);
  const { lessons, tracks } = bundle.content;
  const copy = getCodexCourseCopy(locale).landing;
  const firstLessonHref = technicalCourseHref("codex", locale, {
    kind: "lesson",
    lessonId: "L01",
  });
  const readerHref = technicalCourseHref("codex", locale, { kind: "reader" });
  const course = buildTechnicalCourseJsonLd({
    courseSlug: "codex",
    locale,
    name: bundle.config.title,
    description: copy.jsonLdDescription,
    teaches: tracks.map((track) => track.title),
    timeRequired: "PT2H",
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
            item: `${SITE_URL}${technicalCourseHref("codex", locale, { kind: "landing" })}`,
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
      <JsonLd data={courseJsonLd} id="codex-course-jsonld" />
      <TechnicalCourseFrame courseId="codex" lang={locale}>
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
              href="#lessons"
              className={TECHNICAL_COURSE_SECONDARY_ACTION_CLASS}
            >
              {copy.map}
            </Link>
          }
        />

        <section id="lessons" className="mt-12 scroll-mt-24">
          <TechnicalCourseSectionHeading
            eyebrow={copy.courseEyebrow}
            title={copy.courseTitle}
          />

          <div className="mt-5 border-b border-border">
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
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
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
                          href={technicalCourseHref("codex", locale, {
                            kind: "lesson",
                            lessonId: lesson.id,
                          })}
                          prefetch={false}
                          className={`${TECHNICAL_COURSE_LEDGER_LINK_CLASS} grid-cols-[4.75rem_minmax(0,1fr)_1rem]`}
                        >
                          <p className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-brand-orange">
                            {copy.lessonLabel(lesson.number)}
                          </p>
                          <div className="min-w-0">
                            <h4 className="break-words text-[15px] font-semibold text-foreground">
                              {lesson.title}
                            </h4>
                            <p className="mt-0.5 break-words text-[13px] leading-[1.4] text-muted-foreground">
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
      </TechnicalCourseFrame>
    </>
  );
}
