import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseProgressBar } from "@/components/ai-native-operator/course-progress-bar";
import { CourseAssessmentCta } from "@/components/course/kurs/course-assessment-cta";
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
      <section className="mx-auto w-full max-w-[1100px] overflow-x-clip px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
          {copy.eyebrow}
        </p>
        <h1 className="mt-6 max-w-[900px] break-words text-[40px] font-bold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[60px] md:text-[76px]">
          {copy.title}
        </h1>
        <p className="mt-7 max-w-[720px] text-[17px] leading-[1.65] text-muted-foreground sm:text-[18px]">
          {courseMeta.subtitle}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={lessonHref(firstModuleId, 1, locale)}
            className="inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.05em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)] sm:px-6 sm:text-[13px]"
          >
            {copy.start}
            <ArrowRight size={15} className="shrink-0" aria-hidden="true" />
          </Link>
          <Link
            href="#syllabus"
            className="inline-flex min-h-12 max-w-full items-center break-words border-2 border-foreground bg-background px-5 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.05em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card sm:px-6 sm:text-[13px]"
          >
            {copy.syllabusLink}
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            copy.moduleCount(modules.length),
            copy.lessonCount(TOTAL_LESSON_COUNT),
            copy.exerciseCount(TOTAL_EXERCISE_COUNT),
            copy.durationShort,
          ].map((chip) => (
            <span
              key={chip}
              className="max-w-full break-words border border-foreground bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-foreground"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-8 max-w-[420px]">
          <CourseProgressBar locale={locale} />
        </div>

        <div className="mt-16">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.outcomesEyebrow}
          </p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[34px]">
            {copy.outcomesTitle}
          </h2>
          <div className="mt-8 grid min-w-0 gap-6 sm:grid-cols-2">
            {courseMeta.outcomes.map((outcome, index) => (
              <div key={outcome} className="flex min-w-0 gap-4">
                <span className="shrink-0 font-mono text-[13px] font-bold text-brand-orange">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="min-w-0 break-words text-[15px] leading-[1.55] text-foreground">
                  {outcome}
                </p>
              </div>
            ))}
          </div>
        </div>

        <section id="syllabus" className="mt-20 scroll-mt-24">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              {copy.syllabusEyebrow}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {copy.syllabusMode}
            </p>
          </div>
          <h2 className="mt-2 break-words text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[34px]">
            {copy.syllabusTitle}
          </h2>

          <div className="mt-8 flex min-w-0 flex-col divide-y divide-border border-t border-border">
            {modules.map((module) => (
              <Link
                key={module.id}
                href={moduleHref(module.id, locale)}
                className="group grid min-w-0 grid-cols-[44px_minmax(0,1fr)_16px] items-center gap-3 py-5 transition-colors hover:bg-card sm:grid-cols-[56px_minmax(0,1fr)_16px] sm:gap-5"
              >
                <div className="font-mono text-[12px] font-bold text-brand-orange sm:text-[13px]">
                  {module.code}
                </div>
                <div className="min-w-0">
                  <h3 className="break-words text-[16px] font-semibold text-foreground sm:text-[17px]">
                    {module.name}
                  </h3>
                  <p className="mt-0.5 break-words text-[13px] leading-[1.45] text-muted-foreground sm:text-[13.5px]">
                    {module.tagline}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.05em] text-muted-foreground">
                    <span>{module.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>{copy.lessonUnit(module.lessonCount)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{module.duration}</span>
                  </div>
                </div>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>

        <CourseAssessmentCta courseSlug="ai-native-operator" locale={locale} />
      </section>
    </>
  );
}
