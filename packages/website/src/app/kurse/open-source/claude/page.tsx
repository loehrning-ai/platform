import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  TECHNICAL_COURSE_LEDGER_LINK_CLASS,
  TECHNICAL_COURSE_LESSON_ROW_COLUMNS,
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseHeader,
  TechnicalCourseLessonNumber,
  TechnicalCourseSectionHeading,
} from "@/components/course/technical-course-landing";
import { HeroOrrery } from "@/components/imported-courses/claude/hero-orrery";
import { HeroTransform } from "@/components/imported-courses/claude/hero-transform";
import { PhoneDisclosure } from "@/components/course/phone-disclosure";
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
      "Du gibst Claude Aufgaben mit Kontext, Beispielen und Ausgabeformat und prüfst die Ergebnisse.",
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
      "Schalte Bausteine an und vergleiche die simulierten Ergebnisse.",
    demoToggle: "Prompt-Werkbank ausprobieren",
    courseEyebrow: "Kursplan",
    courseTitle: "Vier Themenbereiche, zwölf Lektionen",
    lessonLabel: "Lektion",
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
      "You give Claude tasks with context, examples and output format, then check the results.",
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
      "Toggle components and compare the simulated results.",
    demoToggle: "Try the prompt workbench",
    courseEyebrow: "Course map",
    courseTitle: "Four tracks, twelve lessons",
    lessonLabel: "Lesson",
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
      <TechnicalCourseFrame courseId="claude" lang={locale}>
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
              {copy.startLesson}
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          }
          secondaryAction={
            <Link
              href="#lessons"
              className={`${TECHNICAL_COURSE_SECONDARY_ACTION_CLASS} max-sm:hidden`}
            >
              {copy.courseMap}
            </Link>
          }
        />

        {/* Below lg the two workbenches (about 1600px) collapse into one row,
            so the course plan follows the hero instead of three screens later.
            From lg they render open, exactly as before. */}
        <section
          className="mt-12 min-w-0 max-sm:mt-4"
          aria-labelledby="prompt-lab-heading"
        >
          {/* The same Kopflinie head as the course plan below. Below lg the
              heading and intro stay for assistive technology only: the
              toggle row names the workbench and carries the intro as its
              second line. */}
          <div className="max-lg:sr-only">
            <TechnicalCourseSectionHeading
              headingId="prompt-lab-heading"
              title={copy.demoEyebrow}
              intro={copy.demoIntro}
            />
          </div>
          <PhoneDisclosure
            id="prompt-lab-instruments"
            label={copy.demoToggle}
            hint={copy.demoIntro}
          >
            <div className="lg:mt-5 [&_.font-mono]:!text-xs [&_button]:!min-h-11 [&_button]:!min-w-11">
              <HeroOrrery locale={locale} />
            </div>
            <div className="mt-6 [&_.font-mono]:!text-xs [&_button]:!min-h-11 [&_button]:!min-w-11">
              <HeroTransform locale={locale} />
            </div>
          </PhoneDisclosure>
        </section>

        <section id="lessons" className="mt-12 scroll-mt-24 max-sm:mt-6">
          <TechnicalCourseSectionHeading
            eyebrow={copy.courseEyebrow}
            title={copy.courseTitle}
          />

          <div className="mt-5 border-b border-border">
            {bundle.content.tracks.map((track) => {
              const trackLessons = bundle.content.lessons.filter(
                (lesson) => lesson.trackId === track.id,
              );
              return (
                <section
                  key={track.id}
                  className="grid min-w-0 border-t border-border lg:grid-cols-[240px_minmax(0,1fr)]"
                >
                  <div className="min-w-0 py-4 pr-5 lg:border-r lg:border-border">
                    <h3 className="break-words text-lg font-bold text-foreground">
                      {track.label}
                    </h3>
                    <p className="mt-1 break-words text-[13px] leading-[1.45] text-muted-foreground">
                      {track.hint}
                    </p>
                  </div>
                  <ul className="min-w-0 lg:pl-3">
                    {trackLessons.map((lesson) => (
                      <li key={lesson.id} className="min-w-0">
                        <Link
                          href={technicalCourseHref("claude", locale, {
                            kind: "lesson",
                            lessonId: lesson.id,
                          })}
                          prefetch={false}
                          className={`${TECHNICAL_COURSE_LEDGER_LINK_CLASS} ${TECHNICAL_COURSE_LESSON_ROW_COLUMNS}`}
                        >
                          <TechnicalCourseLessonNumber
                            label={`${copy.lessonLabel} ${lesson.number}`}
                            number={lesson.number}
                          />
                          <div className="min-w-0">
                            <h4 className="break-words text-[15px] font-semibold text-foreground">
                              {lesson.title}
                            </h4>
                            <p className="mt-0.5 break-words text-[13px] leading-[1.4] text-muted-foreground max-sm:text-[14px]">
                              {lesson.subtitle}
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
