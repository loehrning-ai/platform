import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DataInfraProgressBand } from "@/components/data-infrastructure/data-infra-progress-band";
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
  const copy = getDataInfraCourseCopy(locale).landing;
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
      <div className="mx-auto w-full max-w-[1180px] min-w-0 px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        <section className="border-y-2 border-foreground py-10 sm:py-14">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <h1 className="mt-6 max-w-[980px] break-words text-[42px] font-bold leading-[0.98] tracking-[-0.045em] text-foreground [overflow-wrap:anywhere] sm:text-[60px] md:text-[76px]">
            {copy.title}
          </h1>
          <p className="mt-7 max-w-[740px] break-words text-[17px] leading-[1.65] text-muted-foreground sm:text-[18px]">
            {copy.intro}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={firstLessonHref}
              prefetch={false}
              className="inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)] sm:px-6 sm:text-[13px]"
            >
              {copy.start}
              <ArrowRight size={15} className="shrink-0" aria-hidden="true" />
            </Link>
            <Link
              href="#tracks"
              className="inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-background px-5 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card sm:px-6 sm:text-[13px]"
            >
              {copy.map}
            </Link>
          </div>

          <ul className="mt-7 grid gap-px border border-foreground bg-foreground sm:grid-cols-2 lg:grid-cols-4">
            {copy.facts.map((fact) => (
              <li
                key={fact}
                className="min-w-0 break-words bg-background px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.07em] text-foreground"
              >
                {fact}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 min-w-0 border border-border bg-card shadow-md sm:mt-16">
          <div className="flex min-w-0 items-center gap-3 border-b border-border px-3 py-2.5 font-mono text-[11px] text-muted-foreground sm:px-4 sm:text-[12px]">
            <span className="inline-flex shrink-0 gap-1.5" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-[#e07856]" />
              <span className="h-2 w-2 rounded-full bg-[#e0c356]" />
              <span className="h-2 w-2 rounded-full bg-[#63b380]" />
            </span>
            <h2 className="min-w-0 break-words">{copy.stackTitle}</h2>
            <span className="ml-auto hidden shrink-0 opacity-70 sm:inline">
              {copy.stackFile}
            </span>
          </div>
          <div className="grid min-w-0 gap-3 p-3 sm:p-4">
            {copy.stackRows.map((row) => (
              <article
                key={row.n}
                className="grid min-w-0 gap-3 border border-border bg-background p-3.5 sm:grid-cols-[100px_minmax(0,1fr)] lg:grid-cols-[100px_minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <span className="block font-mono text-[22px] leading-none tracking-[-0.03em] text-foreground">
                    {row.n}
                  </span>
                  <span className="break-words font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {row.name}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="break-words font-mono text-[14px] font-semibold text-foreground">
                    {row.head}
                  </h3>
                  <p className="mt-1 break-words text-[13px] leading-relaxed text-muted-foreground">
                    {row.body}
                  </p>
                </div>
                <ul className="flex min-w-0 flex-wrap content-start items-start gap-1.5 sm:col-start-2 lg:col-start-auto lg:justify-end">
                  {row.tools.map((tool) => (
                    <li
                      key={tool}
                      className="max-w-full break-words rounded-full border border-border bg-card px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {tool}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <dl className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {copy.stats.map((stat) => (
            <div
              key={stat.label}
              className="min-w-0 border-2 border-border bg-card p-4 text-center"
            >
              <dt className="mt-1 break-words font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground sm:text-[11px]">
                {stat.label}
              </dt>
              <dd className="break-words font-mono text-[24px] font-bold text-foreground sm:text-[26px]">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <section id="tracks" className="mt-16 min-w-0 scroll-mt-24 sm:mt-20">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.courseEyebrow}
          </p>
          <h2 className="mt-2 max-w-[840px] break-words text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[36px]">
            {copy.courseTitle}
          </h2>
          <p className="mt-3 max-w-[680px] break-words text-[15px] leading-relaxed text-muted-foreground">
            {copy.courseIntro}
          </p>

          <div className="mt-9 flex min-w-0 flex-col gap-10">
            {tracks.map((track) => {
              const trackLessons = lessons.filter(
                (lesson) => lesson.trackId === track.id,
              );
              return (
                <section
                  key={track.id}
                  className="grid min-w-0 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"
                >
                  <div className="min-w-0 border-l-2 border-brand-orange pl-4">
                    <p className="break-words font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                      {track.label}
                    </p>
                    <h3 className="mt-2 break-words text-[20px] font-bold text-foreground">
                      {track.title}
                    </h3>
                    <p className="mt-1.5 break-words text-[13px] leading-relaxed text-muted-foreground">
                      {track.hint}
                    </p>
                  </div>
                  <ul className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {trackLessons.map((lesson) => (
                      <li key={lesson.id} className="min-w-0">
                        <Link
                          href={technicalCourseHref(
                            "data-infrastructure",
                            locale,
                            { kind: "lesson", lessonId: lesson.id },
                          )}
                          prefetch={false}
                          className="group flex h-full min-w-0 flex-col border-2 border-border bg-card p-4 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand-orange"
                        >
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-brand-orange">
                            {copy.lessonLabel(lesson.number)}
                          </p>
                          <h4 className="mt-1.5 break-words text-[15px] font-semibold text-foreground [overflow-wrap:anywhere]">
                            {lesson.title}
                          </h4>
                          <p className="mt-2 break-words text-[12.5px] leading-[1.5] text-muted-foreground [overflow-wrap:anywhere]">
                            {lesson.hook}
                          </p>
                          <ArrowRight
                            size={15}
                            className="mt-auto self-end pt-3 text-brand-orange transition-transform group-hover:translate-x-0.5"
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

        <section className="mt-16 sm:mt-20">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.progressEyebrow}
          </p>
          <h2 className="mt-2 break-words text-[24px] font-bold tracking-[-0.02em] text-foreground">
            {copy.progressTitle}
          </h2>
          <div className="mt-6">
            <DataInfraProgressBand
              locale={locale}
              tracks={tracks}
              lessons={lessons.map((lesson) => ({
                id: lesson.id,
                trackId: lesson.trackId,
              }))}
            />
          </div>
        </section>

        <section className="mt-16 min-w-0 border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_var(--color-foreground)] sm:p-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.finalEyebrow}
          </p>
          <h2 className="mt-2 break-words text-[26px] font-bold text-foreground sm:text-[32px]">
            {copy.finalTitle}
          </h2>
          <p className="mt-3 max-w-[620px] break-words text-[14px] leading-relaxed text-muted-foreground">
            {copy.finalBody}
          </p>
          <Link
            href={firstLessonHref}
            prefetch={false}
            className="mt-6 inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)] sm:px-6 sm:text-[13px]"
          >
            {copy.finalCta}
            <ArrowRight size={15} className="shrink-0" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </>
  );
}
