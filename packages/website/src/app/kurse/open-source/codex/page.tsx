import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
            item: locale === "en" ? `${SITE_URL}/en/kurse` : `${SITE_URL}/kurse`,
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
      <section className="mx-auto w-full max-w-[1180px] px-4 pb-20 pt-14 sm:px-6 sm:pt-20">
        <div className="border-y-2 border-foreground py-10 sm:py-14">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <h1 className="mt-6 max-w-[960px] break-words text-[42px] font-bold leading-[0.98] tracking-[-0.045em] text-foreground sm:text-[60px] md:text-[76px]">
            {copy.title}
          </h1>
          <p className="mt-7 max-w-[720px] text-[17px] leading-[1.65] text-muted-foreground sm:text-[18px]">
            {copy.intro}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={firstLessonHref}
              className="inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)] sm:px-6 sm:text-[13px]"
            >
              {copy.start}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link
              href="#lessons"
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
        </div>

        <section id="lessons" className="mt-16 scroll-mt-24 sm:mt-20">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.courseEyebrow}
          </p>
          <h2 className="mt-2 max-w-[800px] text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[36px]">
            {copy.courseTitle}
          </h2>
          <p className="mt-3 max-w-[660px] text-[15px] leading-relaxed text-muted-foreground">
            {copy.courseIntro}
          </p>

          <div className="mt-9 flex flex-col gap-10">
            {tracks.map((track) => {
              const trackLessons = lessons.filter((lesson) => lesson.trackId === track.id);
              return (
                <section key={track.id} className="grid min-w-0 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="border-l-2 border-brand-orange pl-4">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-brand-orange">
                      {track.label}
                    </p>
                    <h3 className="mt-2 text-[20px] font-bold text-foreground">{track.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{track.hint}</p>
                  </div>
                  <ul className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {trackLessons.map((lesson) => (
                      <li key={lesson.id} className="min-w-0">
                        <Link
                          href={technicalCourseHref("codex", locale, {
                            kind: "lesson",
                            lessonId: lesson.id,
                          })}
                          className="group flex h-full min-w-0 flex-col border-2 border-border bg-card p-4 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand-orange"
                        >
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-brand-orange">
                            {copy.lessonLabel(lesson.number)}
                          </p>
                          <h4 className="mt-1.5 break-words text-[15px] font-semibold text-foreground">
                            {lesson.title}
                          </h4>
                          <p className="mt-2 break-words text-[12.5px] leading-[1.5] text-muted-foreground">
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

        <div className="mt-16 border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_var(--color-foreground)] sm:p-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.finalEyebrow}
          </p>
          <h2 className="mt-2 text-[26px] font-bold text-foreground sm:text-[32px]">
            {copy.finalTitle}
          </h2>
          <p className="mt-3 max-w-[620px] text-[14px] leading-relaxed text-muted-foreground">
            {copy.finalBody}
          </p>
          <Link
            href={firstLessonHref}
            className="mt-6 inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)] sm:px-6 sm:text-[13px]"
          >
            {copy.finalCta}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
