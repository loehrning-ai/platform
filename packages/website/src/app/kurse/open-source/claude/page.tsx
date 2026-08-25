import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroOrrery } from "@/components/imported-courses/claude/hero-orrery";
import { HeroTransform } from "@/components/imported-courses/claude/hero-transform";
import { getClaudeCourseBundle } from "@/lib/claude-course/localization";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import {
  buildTechnicalCourseJsonLd,
  buildTechnicalCourseMetadata,
  technicalCourseHref,
  TECHNICAL_COURSE_ROUTES,
} from "@/lib/technical-courses/routes";
import { JsonLd } from "@/lib/seo/json-ld";

const LANDING_COPY = {
  de: {
    metadataTitle: "Claude-Kurs: klare Prompts und überprüfbare Arbeitsabläufe",
    metadataDescription:
      "Zwölf praktische Lektionen zu Prompt-Struktur, Kontext, CLAUDE.md, Agenten, Code-Reviews, Grounding, Evals und sicherer Nutzung.",
    eyebrow: "Technischer Claude-Kurs",
    title: "Claude mit klarer Struktur einsetzen.",
    intro:
      "Zwölf Lektionen zeigen, wie du Aufgaben präzise beschreibst, relevante Fakten bereitstellst und Ergebnisse prüfst. Jede Lektion enthält eine interaktive Übung.",
    startLesson: "Lektion 01 starten",
    courseMap: "Zum Kursplan",
    facts: [
      "12 Lektionen",
      "117 Minuten",
      "4 Themenbereiche",
      "Übung in jeder Lektion",
    ],
    demoEyebrow: "Prompt-Bausteine",
    demoIntro:
      "Aktiviere einzelne Bestandteile und vergleiche die simulierten Ergebnisse.",
    courseEyebrow: "Kursplan",
    courseTitle: "Vier Themenbereiche, zwölf Lektionen",
    courseIntro:
      "Beginne mit dem mentalen Modell. Danach folgen wiederverwendbare Arbeitsabläufe, Agenten, Prüfverfahren und Teamregeln.",
    lessonLabel: "Lektion",
    finalEyebrow: "Einstieg",
    finalTitle: "Lektion 01: Was Claude tatsächlich ist",
    finalBody:
      "Die erste Lektion erklärt Kontextfenster, Grounding und typische Fehlerbilder. Bearbeitungszeit: acht Minuten.",
    begin: "Beginnen",
    teaches: [
      "Prompt-Struktur und Kontextfenster",
      "CLAUDE.md und wiederverwendbare Arbeitsabläufe",
      "Agenten, Code-Review und Grounding",
      "Evals, Teamregeln und sichere Nutzung",
    ],
  },
  en: {
    metadataTitle: "Claude course: clear prompts and verifiable workflows",
    metadataDescription:
      "Twelve practical lessons on prompt structure, context, CLAUDE.md, agents, code review, grounding, evals, and safe use.",
    eyebrow: "Technical Claude course",
    title: "Use Claude with clear structure.",
    intro:
      "Twelve lessons cover precise task briefs, relevant context, and verifiable output. Every lesson includes an interactive exercise.",
    startLesson: "Start lesson 01",
    courseMap: "View course map",
    facts: [
      "12 lessons",
      "117 minutes",
      "4 tracks",
      "Exercise in every lesson",
    ],
    demoEyebrow: "Prompt components",
    demoIntro:
      "Toggle individual components and compare the simulated results.",
    courseEyebrow: "Course map",
    courseTitle: "Four tracks, twelve lessons",
    courseIntro:
      "Start with the mental model, then move through reusable workflows, agents, evaluation methods, and team rules.",
    lessonLabel: "Lesson",
    finalEyebrow: "Start here",
    finalTitle: "Lesson 01: What Claude actually is",
    finalBody:
      "The first lesson explains context windows, grounding, and common failure modes. Estimated time: eight minutes.",
    begin: "Begin",
    teaches: [
      "Prompt structure and context windows",
      "CLAUDE.md and reusable workflows",
      "Agents, code review, and grounding",
      "Evals, team rules, and safe use",
    ],
  },
} as const;

const BASE_PATH = TECHNICAL_COURSE_ROUTES.claude.basePath;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = LANDING_COPY[locale];
  return buildTechnicalCourseMetadata({
    courseSlug: "claude",
    locale,
    target: { kind: "landing" },
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    availableContentLocales: contentLocalesForPath(BASE_PATH),
  });
}

export default async function ClaudeCourseLandingPage() {
  const locale = await getRequestLocale();
  const bundle = await getClaudeCourseBundle(locale);
  const copy = LANDING_COPY[locale];
  const firstLessonHref = technicalCourseHref("claude", locale, {
    kind: "lesson",
    lessonId: "mental-model",
  });
  const courseJsonLd = buildTechnicalCourseJsonLd({
    courseSlug: "claude",
    locale,
    name: bundle.config.title,
    description: copy.metadataDescription,
    teaches: copy.teaches,
    timeRequired: "PT117M",
  });

  return (
    <>
      <JsonLd data={courseJsonLd} id="claude-course-jsonld" />
      <section
        lang={locale}
        className="mx-auto max-w-[1100px] px-4 pb-20 pt-14 sm:px-6 sm:pt-20"
      >
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          {copy.eyebrow}
        </p>
        <h1 className="mt-6 max-w-[900px] break-words text-[42px] font-bold leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[60px] md:text-[76px]">
          {copy.title}
        </h1>
        <p className="mt-7 max-w-[680px] text-[18px] leading-[1.6] text-muted-foreground">
          {copy.intro}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={firstLessonHref}
            prefetch={false}
            className="inline-flex min-h-12 items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-3 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)]"
          >
            {copy.startLesson}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link
            href="#lessons"
            className="inline-flex min-h-12 items-center gap-2 border-2 border-foreground bg-background px-6 py-3 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card"
          >
            {copy.courseMap}
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {copy.facts.map((fact) => (
            <span
              key={fact}
              className="border border-foreground bg-background px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-foreground"
            >
              {fact}
            </span>
          ))}
        </div>

        <div className="mt-16">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.demoEyebrow}
          </p>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {copy.demoIntro}
          </p>
          <div className="mt-6">
            <HeroOrrery locale={locale} />
          </div>
          <div className="mt-8">
            <HeroTransform locale={locale} />
          </div>
        </div>

        <section id="lessons" className="mt-20 scroll-mt-24">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.courseEyebrow}
          </p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[34px]">
            {copy.courseTitle}
          </h2>
          <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
            {copy.courseIntro}
          </p>

          <div className="mt-8 flex flex-col gap-8">
            {bundle.content.tracks.map((track) => {
              const trackLessons = bundle.content.lessons.filter(
                (lesson) => lesson.trackId === track.id,
              );
              return (
                <div key={track.id}>
                  <h3 className="text-[18px] font-bold text-foreground">
                    {track.label}
                  </h3>
                  <p className="text-[13px] text-muted-foreground">
                    {track.hint}
                  </p>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {trackLessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          href={technicalCourseHref("claude", locale, {
                            kind: "lesson",
                            lessonId: lesson.id,
                          })}
                          prefetch={false}
                          className="block h-full min-w-0 border-2 border-border bg-card p-4 transition-colors hover:border-brand-orange"
                        >
                          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-brand-orange">
                            {copy.lessonLabel} {lesson.number}
                          </p>
                          <h4 className="mt-1 break-words text-[15px] font-semibold text-foreground">
                            {lesson.title}
                          </h4>
                          <p className="mt-1 break-words text-[12.5px] leading-[1.4] text-muted-foreground">
                            {lesson.subtitle}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-16 border-2 border-foreground bg-card p-6 text-center shadow-[6px_6px_0_var(--color-foreground)] sm:p-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {copy.finalEyebrow}
          </p>
          <h2 className="mt-2 text-[26px] font-bold text-foreground sm:text-[32px]">
            {copy.finalTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-[480px] text-[14px] leading-relaxed text-muted-foreground">
            {copy.finalBody}
          </p>
          <Link
            href={firstLessonHref}
            prefetch={false}
            className="mt-6 inline-flex min-h-12 items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-3 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--color-foreground)]"
          >
            {copy.begin}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
