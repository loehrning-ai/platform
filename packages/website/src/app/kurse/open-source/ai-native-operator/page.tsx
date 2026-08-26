import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseAssessmentCta } from "@/components/course/kurs/course-assessment-cta";
import {
  TECHNICAL_COURSE_LEDGER_LINK_CLASS,
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseHeader,
  TechnicalCourseSectionHeading,
} from "@/components/course/technical-course-landing";
import { TechnicalCourseProgressBar } from "@/components/course/technical-course-progress";
import { getAiNativeOperatorCourseCopy } from "@/lib/ai-native-operator/course-copy";
import { getAiNativeOperatorLocaleRegistry } from "@/lib/ai-native-operator/data";
import { lessonHref, moduleHref } from "@/lib/ai-native-operator/routes";
import {
  MODULE_IDS,
  TOTAL_LESSON_COUNT,
  getCourseMeta,
  orderedModuleMetas,
} from "@/lib/ai-native-operator/types";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd, SITE_URL, type JsonLdGraph } from "@/lib/seo/json-ld";
import {
  buildTechnicalCourseJsonLd,
  buildTechnicalCourseMetadata,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";

const CANONICAL_PATH = "/kurse/open-source/ai-native-operator";
const TOTAL_EXERCISE_COUNT = 30;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  (await getAiNativeOperatorLocaleRegistry()).get(locale);
  const copy = getAiNativeOperatorCourseCopy(locale).landingMetadata;
  return buildTechnicalCourseMetadata({
    courseSlug: "ai-native-operator",
    locale,
    target: { kind: "landing" },
    title: copy.title,
    description: copy.description,
    availableContentLocales: contentLocalesForPath(CANONICAL_PATH),
  });
}

export default async function AiNativeOperatorLandingPage() {
  const locale = await getRequestLocale();
  const bundle = (await getAiNativeOperatorLocaleRegistry()).get(locale);
  const modules = orderedModuleMetas(locale);
  const courseMeta = getCourseMeta(locale);
  const copy = getAiNativeOperatorCourseCopy(locale).landing;
  const firstModuleId = MODULE_IDS[0];
  const landingHref = technicalCourseHref("ai-native-operator", locale, {
    kind: "landing",
  });
  const course = buildTechnicalCourseJsonLd({
    courseSlug: "ai-native-operator",
    locale,
    name: bundle.config.title,
    description: courseMeta.subtitle,
    teaches: modules.map((module) => module.name),
    timeRequired: "PT14H",
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
            item: `${SITE_URL}${landingHref}`,
          },
        ],
      },
      {
        ...courseNode,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          url: `${SITE_URL}${landingHref}`,
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={courseJsonLd} id="ai-native-operator-course-jsonld" />
      <TechnicalCourseFrame courseId="ai-native-operator" lang={locale}>
        <TechnicalCourseHeader
          eyebrow={copy.eyebrow}
          title={copy.title}
          intro={courseMeta.subtitle}
          facts={[
            copy.moduleCount(modules.length),
            copy.lessonCount(TOTAL_LESSON_COUNT),
            copy.exerciseCount(TOTAL_EXERCISE_COUNT),
            copy.durationShort,
          ]}
          factsLabel={locale === "de" ? "Kursdaten" : "Course facts"}
          progress={
            <TechnicalCourseProgressBar
              courseSlug="ai-native-operator"
              totalLessons={TOTAL_LESSON_COUNT}
              label={
                locale === "de" ? "Lektionsfortschritt" : "Lesson progress"
              }
              unitLabel={locale === "de" ? "Lektionen" : "lessons"}
            />
          }
          primaryAction={
            <Link
              href={lessonHref(firstModuleId, 1, locale)}
              className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}
            >
              {copy.start}
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          }
          secondaryAction={
            <Link
              href="#syllabus"
              className={TECHNICAL_COURSE_SECONDARY_ACTION_CLASS}
            >
              {copy.syllabusLink}
            </Link>
          }
        />

        <section className="mt-12">
          <TechnicalCourseSectionHeading
            eyebrow={copy.outcomesEyebrow}
            title={copy.outcomesTitle}
          />
          <ol className="mt-4 min-w-0 border-y border-border">
            {courseMeta.outcomes.map((outcome, index) => (
              <li
                key={outcome}
                className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border py-3 last:border-b-0"
              >
                <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-brand-orange">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="min-w-0 break-words text-sm leading-[1.5] text-foreground">
                  {outcome}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section id="syllabus" className="mt-12 scroll-mt-24">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <TechnicalCourseSectionHeading
              eyebrow={copy.syllabusEyebrow}
              title={copy.syllabusTitle}
            />
            <p className="pb-1 font-mono text-xs text-muted-foreground">
              {copy.syllabusMode}
            </p>
          </div>

          <div className="mt-4 min-w-0 border-y border-border">
            {modules.map((module) => (
              <Link
                key={module.id}
                href={moduleHref(module.id, locale)}
                className={`${TECHNICAL_COURSE_LEDGER_LINK_CLASS} grid-cols-[3.25rem_minmax(0,1fr)_1rem] sm:grid-cols-[4rem_minmax(0,1fr)_1rem] sm:gap-4`}
              >
                <div className="font-mono text-xs font-bold tabular-nums text-brand-orange sm:text-[13px]">
                  {module.code}
                </div>
                <div className="min-w-0">
                  <h3 className="break-words text-[16px] font-semibold text-foreground sm:text-[17px]">
                    {module.name}
                  </h3>
                  <p className="mt-0.5 break-words text-[13px] leading-[1.45] text-muted-foreground">
                    {module.tagline}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.04em] text-muted-foreground">
                    <span>{module.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>{copy.lessonUnit(module.lessonCount)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{module.duration}</span>
                  </div>
                </div>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-orange"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>

        <CourseAssessmentCta
          courseSlug="ai-native-operator"
          locale={locale}
          className="mt-12 shadow-none [&_.font-mono]:!text-xs"
        />
      </TechnicalCourseFrame>
    </>
  );
}
