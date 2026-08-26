import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseAssessmentCta } from "@/components/course/kurs/course-assessment-cta";
import { getClaudeCourseBundle } from "@/lib/claude-course/localization";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  buildTechnicalCourseMetadata,
  technicalCourseHref,
} from "@/lib/technical-courses/routes";

const INDEX_COPY = {
  de: {
    title: "Kursplan: Claude-Kurs",
    description:
      "Zwölf Lektionen zu Prompt-Struktur, Kontext, Arbeitsabläufen, Agenten, Evals und sicherer Nutzung.",
    eyebrow: "Kursplan",
    heading: "Vier Themenbereiche, zwölf Lektionen",
    intro:
      "Die Reihenfolge führt vom mentalen Modell zu überprüfbaren Arbeitsabläufen und klaren Teamregeln.",
    track: "Themenbereich",
    lesson: "Lektion",
    duration: (minutes: number) => `${minutes} Min.`,
  },
  en: {
    title: "Course map: Claude course",
    description:
      "Twelve lessons on prompt structure, context, workflows, agents, evals, and safe use.",
    eyebrow: "Course map",
    heading: "Four tracks, twelve lessons",
    intro:
      "The sequence moves from the mental model to verifiable workflows and explicit team rules.",
    track: "Track",
    lesson: "Lesson",
    duration: (minutes: number) => `${minutes} min`,
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = INDEX_COPY[locale];
  return buildTechnicalCourseMetadata({
    courseSlug: "claude",
    locale,
    target: { kind: "reader" },
    title: copy.title,
    description: copy.description,
    availableContentLocales: ["de", "en"],
  });
}

export default async function ClaudeKursIndexPage() {
  const locale = await getRequestLocale();
  const bundle = await getClaudeCourseBundle(locale);
  const copy = INDEX_COPY[locale];

  return (
    <div lang={locale} className="mx-auto max-w-[900px] px-4 py-12 sm:px-6">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
        {copy.eyebrow}
      </p>
      <h1 className="mt-3 break-words text-[36px] font-bold tracking-[-0.03em] text-foreground md:text-[44px]">
        {copy.heading}
      </h1>
      <p className="mt-3 max-w-[640px] text-[16px] leading-[1.5] text-muted-foreground">
        {copy.intro}
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {bundle.content.tracks.map((track, trackIndex) => {
          const trackLessons = bundle.content.lessons.filter(
            (lesson) => lesson.trackId === track.id,
          );
          return (
            <section key={track.id}>
              <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
                {copy.track} 0{trackIndex + 1}
              </p>
              <h2 className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-foreground">
                {track.label}
              </h2>
              <p className="mt-1 text-[14px] text-muted-foreground">
                {track.hint}
              </p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {trackLessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={technicalCourseHref("claude", locale, {
                        kind: "lesson",
                        lessonId: lesson.id,
                      })}
                      className="group flex h-full min-w-0 flex-col justify-between border-2 border-border bg-card p-4 transition-colors hover:border-brand-orange"
                    >
                      <div>
                        <p className="font-mono text-xs uppercase tracking-[0.08em] text-brand-orange">
                          {copy.lesson} {lesson.number}
                        </p>
                        <h3 className="mt-1 break-words text-[16px] font-semibold text-foreground">
                          {lesson.title}
                        </h3>
                        <p className="mt-1 break-words text-[13px] leading-[1.4] text-muted-foreground">
                          {lesson.hook}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
                        <span>{copy.duration(lesson.durationMinutes)}</span>
                        <ArrowRight
                          size={14}
                          className="shrink-0 transition-transform group-hover:translate-x-0.5"
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

      <CourseAssessmentCta courseSlug="claude" locale={locale} />
    </div>
  );
}
