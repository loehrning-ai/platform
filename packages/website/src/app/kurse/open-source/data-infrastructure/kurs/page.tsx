import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CompletionCertificateCta } from "@/components/course/kurs/completion-certificate-cta";
import { getDataInfraCourseCopy } from "@/lib/data-infrastructure/course-copy";
import { getDataInfraLandingManifest } from "@/lib/data-infrastructure/landing-manifest";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  buildTechnicalCourseMetadata,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";

const CANONICAL_PATH = "/kurse/open-source/data-infrastructure/kurs";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = getDataInfraCourseCopy(locale).indexMetadata;
  return buildTechnicalCourseMetadata({
    courseSlug: "data-infrastructure",
    locale,
    target: { kind: "reader" },
    title: copy.title,
    description: copy.description,
    availableContentLocales: contentLocalesForPath(CANONICAL_PATH),
  });
}

export default async function DataInfrastructureKursIndexPage() {
  const locale = await getRequestLocale();
  const { lessons, tracks } = getDataInfraLandingManifest(locale);
  const copy = getDataInfraCourseCopy(locale).index;

  return (
    <main className="mx-auto w-full max-w-[980px] min-w-0 px-4 py-12 sm:px-6 sm:py-16">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
        {copy.eyebrow}
      </p>
      <h1 className="mt-3 max-w-[780px] break-words text-[36px] font-bold tracking-[-0.03em] text-foreground [overflow-wrap:anywhere] md:text-[46px]">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-[660px] break-words text-[16px] leading-[1.6] text-muted-foreground">
        {copy.intro}
      </p>

      <div className="mt-10 flex min-w-0 flex-col gap-10">
        {tracks.map((track, trackIndex) => {
          const trackLessons = lessons.filter(
            (lesson) => lesson.trackId === track.id,
          );
          return (
            <section key={track.id} className="min-w-0">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                {copy.trackLabel(trackIndex + 1)}
              </p>
              <h2 className="mt-1 break-words text-[22px] font-bold tracking-[-0.02em] text-foreground">
                {track.title}
              </h2>
              <p className="mt-1 max-w-[680px] break-words text-[14px] leading-relaxed text-muted-foreground">
                {track.hint}
              </p>
              <ul className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                {trackLessons.map((lesson) => (
                  <li key={lesson.id} className="min-w-0">
                    <Link
                      href={technicalCourseHref("data-infrastructure", locale, {
                        kind: "lesson",
                        lessonId: lesson.id,
                      })}
                      prefetch={false}
                      className="group flex h-full min-w-0 flex-col justify-between border-2 border-border bg-card p-4 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand-orange"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-brand-orange">
                          {copy.lessonLabel(lesson.number)}
                        </p>
                        <h3 className="mt-1 break-words text-[16px] font-semibold text-foreground [overflow-wrap:anywhere]">
                          {lesson.title}
                        </h3>
                        <p className="mt-1 break-words text-[13px] leading-[1.5] text-muted-foreground [overflow-wrap:anywhere]">
                          {lesson.hook}
                        </p>
                      </div>
                      <div className="mt-4 flex min-w-0 items-center justify-between gap-3 font-mono text-[11px] text-muted-foreground">
                        <span className="break-words">
                          {copy.duration(lesson.durationMinutes)}
                        </span>
                        <ArrowRight
                          size={14}
                          className="shrink-0 text-brand-orange transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <CompletionCertificateCta
        courseSlug="data-infrastructure"
        locale={locale}
        className="mt-12"
      />
    </main>
  );
}
