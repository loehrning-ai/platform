"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { Github } from "@/components/icons/brand";
import {
  ALL_COURSE_CATALOG,
  type CatalogCourse,
  type ImportedCourse,
} from "@/lib/courses/catalog";
import { localizeCatalog } from "@/lib/courses/catalog-copy";
import { COURSE_GALLERY_COPY } from "@/lib/courses/course-gallery-copy";
import { demosForCourse } from "@/lib/demos";
import { courseGroupFor, courseSections } from "@/lib/courses/tracks";
import {
  getCompletedLessonsCount,
  isCertificateEligible,
  subscribe,
} from "@/lib/progress/store";
import {
  hasCourseStarted,
  resolveCourseResumeHref,
} from "@/lib/courses/resume";
import {
  GOAL_IDS,
  LEARNING_GOALS,
  type GoalId,
  type LearningGoal,
} from "@/lib/courses/goals";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import type { UnifiedProgress } from "@/lib/progress/types";
import { cn } from "@/lib/utils";
import { notifyUrlStateChanged } from "@/lib/navigation/url-state";

interface CourseStat {
  readonly completed: number;
  readonly certified: boolean;
  readonly started: boolean;
  readonly resumeHref: string;
}

type Course = CatalogCourse | ImportedCourse;

const LIVE_COURSES = ALL_COURSE_CATALOG.filter(isLiveCourse);

// Cover-art wash per row, cycling across all ten courses -- kept light (10%)
// since ten consecutive tinted rows read as noisy at higher opacity, unlike
// the four-card home-page spine.
const ROW_TONES = [
  "bg-brand-acid/10",
  "bg-brand-sky/10",
  "bg-brand-pink/10",
  "bg-brand-peach/10",
  "bg-brand-teal/10",
  "bg-brand-cobalt/10",
] as const;

const ATLAS_COPY = {
  de: {
    eyebrow: "Lernatlas · ein nächster Schritt",
    heading: "Welchen Nachweis brauchst du als Nächstes?",
    intro:
      "Wähle ein Ziel. Der Atlas ordnet die Kurse und setzt den ersten offenen Arbeitsschritt nach vorn.",
    goalLabel: "Lernziel auswählen",
    selectedPath: "Gewählter Pfad",
    nextProof: "Nächster Nachweis",
    pathPosition: "Position im Pfad",
    complete: "abgeschlossen",
    inProgress: "begonnen",
    queued: "offen",
    allCourses: "Alle Kurse",
    allCoursesIntro:
      "Der Pfad ist eine Empfehlung. Jeder Kurs bleibt direkt erreichbar.",
    viewProgress: "Fortschritt in deinem Konto ansehen",
    tryDemo: (count: number) =>
      count > 1 ? `${count} Praxisbeispiele testen` : "Praxisbeispiel testen",
    sourceCode: "Quellcode",
    sourceCommit: "Commit",
    start: "Nachweis beginnen",
    continue: "Nachweis fortsetzen",
    viewRecord: "Nachweis ansehen",
    pathCourse: "Teil des gewählten Pfads",
    goals: LEARNING_GOALS.de,
    proofs: {
      "ki-fuehrerschein":
        "Prüfe eine reale Aufgabe auf Eingabe, Datenrisiko und Ergebnisqualität.",
      "ki-und-gesellschaft":
        "Trenne bei einem Beispiel Quelle, Interesse und Unsicherheit.",
      "eu-ai-act-kurs":
        "Klassifiziere einen Anwendungsfall und ordne Rolle und Pflichten zu.",
      "ai-native":
        "Dokumentiere Absicht, Kontext, Prüfschritt und Abbruchkriterium.",
      claude:
        "Baue einen begrenzten Prompt mit Kontext und überprüfbarem Ergebnis.",
      codex: "Spezifiziere eine Codeänderung mit Tests und Review-Kriterium.",
      "data-engineering-fundamentals":
        "Verfolge einen Pipelinefehler von der Quelle bis zur Nutzung.",
      "data-infrastructure":
        "Begründe eine Speicher-, Streaming- oder Konsistenzentscheidung.",
      "data-science":
        "Fordere eine Modellkennzahl mit einem Gegenbeispiel heraus.",
      "ai-native-operator":
        "Definiere einen KI-Ablauf mit Eigentümer, Kontrolle und Messgröße.",
    },
  },
  en: {
    eyebrow: "Learning atlas · one next move",
    heading: "What proof do you need next?",
    intro:
      "Choose a goal. The atlas orders the courses and brings the first open piece of work forward.",
    goalLabel: "Choose a learning goal",
    selectedPath: "Selected path",
    nextProof: "Next proof",
    pathPosition: "Position in path",
    complete: "complete",
    inProgress: "started",
    queued: "open",
    allCourses: "All courses",
    allCoursesIntro:
      "The path is a recommendation. Every course remains directly accessible.",
    viewProgress: "View your progress in your account",
    tryDemo: (count: number) =>
      count > 1 ? `Try ${count} applied examples` : "Try the applied example",
    sourceCode: "Source code",
    sourceCommit: "Commit",
    start: "Start this proof",
    continue: "Continue this proof",
    viewRecord: "View record",
    pathCourse: "Part of the selected path",
    goals: LEARNING_GOALS.en,
    proofs: {
      "ki-fuehrerschein":
        "Check one real task for input quality, data risk, and output quality.",
      "ki-und-gesellschaft":
        "Separate source, interest, and uncertainty in one example.",
      "eu-ai-act-kurs":
        "Classify one use case and map its role and obligations.",
      "ai-native":
        "Document intent, context, review step, and stopping condition.",
      claude: "Build a bounded prompt with context and a verifiable result.",
      codex: "Specify one code change with tests and a review criterion.",
      "data-engineering-fundamentals":
        "Trace one pipeline failure from source to consumption.",
      "data-infrastructure":
        "Justify one storage, streaming, or consistency decision.",
      "data-science": "Challenge one model metric with a counterexample.",
      "ai-native-operator":
        "Define one AI workflow with an owner, control, and measure.",
    },
  },
} as const satisfies Readonly<
  Record<
    Locale,
    {
      readonly eyebrow: string;
      readonly heading: string;
      readonly intro: string;
      readonly goalLabel: string;
      readonly selectedPath: string;
      readonly nextProof: string;
      readonly pathPosition: string;
      readonly complete: string;
      readonly inProgress: string;
      readonly queued: string;
      readonly allCourses: string;
      readonly allCoursesIntro: string;
      readonly viewProgress: string;
      readonly tryDemo: (count: number) => string;
      readonly sourceCode: string;
      readonly sourceCommit: string;
      readonly start: string;
      readonly continue: string;
      readonly viewRecord: string;
      readonly pathCourse: string;
      readonly goals: readonly LearningGoal[];
      readonly proofs: Readonly<Record<string, string>>;
    }
  >
>;

function isGoalId(value: string | null): value is GoalId {
  return value !== null && GOAL_IDS.includes(value as GoalId);
}

function isLiveCourse(course: Course): course is CatalogCourse {
  return course.nativeStatus === "live";
}

function readStat(
  course: CatalogCourse,
  progress?: UnifiedProgress,
): CourseStat {
  const completed = getCompletedLessonsCount(course.slug);
  return {
    completed,
    certified: isCertificateEligible(course.slug),
    started: completed > 0 || hasCourseStarted(progress, course.slug),
    resumeHref: resolveCourseResumeHref(progress, course.slug),
  };
}

function defaultStat(course: CatalogCourse): CourseStat {
  return {
    completed: 0,
    certified: false,
    started: false,
    resumeHref: course.startHref,
  };
}

function courseAction(
  course: CatalogCourse,
  stat: CourseStat,
  locale: Locale,
  copy: (typeof ATLAS_COPY)[Locale],
): { readonly href: string; readonly label: string } {
  if (stat.certified) {
    return {
      href: localizeHref(stat.resumeHref, locale),
      label: copy.viewRecord,
    };
  }
  if (stat.started) {
    return {
      href: localizeHref(stat.resumeHref, locale),
      label: copy.continue,
    };
  }
  return {
    href: localizeHref(course.startHref, locale),
    label: copy.start,
  };
}

function sourceRepository(sourceHref: string): string {
  try {
    return new URL(sourceHref).pathname
      .split("/")
      .filter(Boolean)
      .slice(0, 2)
      .join("/");
  } catch {
    return sourceHref;
  }
}

function CourseLedgerRow({
  course,
  index,
  inPath,
  stat,
  locale,
}: {
  readonly course: Course;
  readonly index: number;
  readonly inPath: boolean;
  readonly stat?: CourseStat;
  readonly locale: Locale;
}) {
  const copy = ATLAS_COPY[locale];
  const galleryCopy = COURSE_GALLERY_COPY[locale];
  const live = isLiveCourse(course);
  const liveStat = live ? (stat ?? defaultStat(course)) : null;
  const action =
    live && liveStat ? courseAction(course, liveStat, locale, copy) : null;
  const sourceHref = course.sourceHref;
  const sourceCommitHref = course.sourceCommitHref;
  const sourceCommit = course.sourceCommit;
  const tone = ROW_TONES[index % ROW_TONES.length];
  // Seven of the ten courses have no demo. Rather than substituting one from
  // another course, those rows simply omit the teaser.
  const courseDemos = live ? demosForCourse(course.slug) : [];
  const courseDemo = courseDemos[0];
  const demoCount = courseDemos.length;

  return (
    <li
      className={cn(
        "border border-border",
        tone,
        inPath && "border-l-[3px] border-l-brand-orange",
      )}
      data-course-slug={course.slug}
      data-in-path={inPath ? "true" : "false"}
      data-course-status={
        !live
          ? "external"
          : liveStat?.certified
            ? "complete"
            : liveStat?.started
              ? "started"
              : "open"
      }
    >
      {/* No cover thumbnail. The course artwork is a wide illustration; at the
          ~56px this dense ledger row allows it crops to unreadable mush, and
          the six imported courses have only site screenshots, which read as
          grey noise at that size. The art earns its space where it renders
          large, on the home cards and the account catalog. */}
      <div className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 p-3 sm:p-4 lg:grid-cols-[3rem_minmax(0,1fr)_minmax(180px,220px)_auto] lg:items-center">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center self-start border font-mono text-xs font-bold tabular-nums",
            liveStat?.certified || inPath
              ? "border-brand-orange bg-kupfer-mist text-brand-orange"
              : "border-border bg-background text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h4 className="min-w-0 text-[17px] font-bold leading-tight tracking-[-0.02em] text-foreground">
              <Link
                href={localizeHref(course.href, locale)}
                className="inline-flex min-h-11 items-center underline decoration-transparent underline-offset-4 transition-[text-decoration-color,color] duration-150 hover:decoration-brand-orange focus-visible:decoration-brand-orange motion-reduce:transition-none"
              >
                {course.title}
              </Link>
            </h4>
            {inPath ? (
              <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange">
                {copy.pathCourse}
              </span>
            ) : null}
          </div>
          <p className="mt-1 max-w-[68ch] text-sm leading-snug text-muted-foreground">
            {course.tagline}
          </p>
          {courseDemo ? (
            <Link
              href={localizeHref(
                `/demos/${courseDemo.slug}?source=gallery`,
                locale,
              )}
              prefetch={false}
              className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-brand-orange underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              {copy.tryDemo(demoCount)}
              <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </Link>
          ) : null}
          {/* Attribution for the imported MIT courses. This is the only place
              the repository and pinned commit are rendered as page content
              anywhere on the site: every other reference is machine-readable
              (the knowledge-graph endpoint and the course-discovery metadata),
              and the technical landing pages render none. It therefore stays
              visible on the row itself rather than behind a disclosure. */}
          {sourceHref ? (
            <p
              data-course-source
              className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-xs text-muted-foreground"
            >
              <a
                href={sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <Github className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {sourceRepository(sourceHref)}
                <span className="sr-only">
                  : {copy.sourceCode}, {course.title}
                </span>
              </a>
              {sourceCommitHref && sourceCommit ? (
                <a
                  href={sourceCommitHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  {copy.sourceCommit} #{sourceCommit.slice(0, 7)}
                </a>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="col-span-2 min-w-0 lg:col-span-1">
          <span className="inline-flex min-h-11 w-full items-center border border-border bg-background px-3 font-mono text-xs text-muted-foreground">
            {course.duration}
          </span>
        </div>
        <div
          className="col-span-2 flex min-w-0 lg:col-span-1 lg:justify-self-end"
          data-course-action
        >
          {live && action ? (
            <Link
              href={action.href}
              prefetch={false}
              className="inline-flex min-h-11 w-full min-w-0 items-center justify-between gap-3 border border-brand-orange bg-paper px-4 py-2 text-sm font-bold text-foreground transition-[background-color,border-color] duration-150 hover:bg-kupfer-mist focus-visible:bg-kupfer-mist motion-reduce:transition-none lg:w-auto"
            >
              <span className="break-words">{action.label}</span>
              <span className="sr-only">: {course.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          ) : course.launchHref ? (
            <a
              href={course.launchHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full min-w-0 items-center justify-between gap-3 border border-brand-orange bg-paper px-4 py-2 text-sm font-bold text-foreground transition-colors duration-150 hover:bg-kupfer-mist focus-visible:bg-kupfer-mist motion-reduce:transition-none lg:w-auto"
            >
              <span className="break-words">{galleryCopy.openCourse}</span>
              <span className="sr-only">
                : {course.title}, {galleryCopy.externalNewTab}
              </span>
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

    </li>
  );
}

export function LearningAtlas({ locale = "de" }: { readonly locale?: Locale }) {
  const copy = ATLAS_COPY[locale];
  const sections = courseSections(locale);
  const courses = localizeCatalog(ALL_COURSE_CATALOG, locale);
  const [goalId, setGoalId] = useState<GoalId>("start");
  const [stats, setStats] = useState<Record<string, CourseStat>>({});

  useEffect(() => {
    const requestedGoal = new URL(window.location.href).searchParams.get(
      "goal",
    );
    if (isGoalId(requestedGoal)) setGoalId(requestedGoal);

    return subscribe((progress) => {
      const next: Record<string, CourseStat> = {};
      for (const course of LIVE_COURSES) {
        next[course.slug] = readStat(course, progress);
      }
      setStats(next);
    });
  }, []); // The catalog is static for the lifetime of this route.

  const goal: LearningGoal =
    copy.goals.find((candidate) => candidate.id === goalId) ?? copy.goals[0];
  const coursesBySlug = new Map(courses.map((course) => [course.slug, course]));
  const pathCourses = goal.courseSlugs.flatMap((slug) => {
    const course = coursesBySlug.get(slug);
    return course && isLiveCourse(course) ? [course] : [];
  });
  const nextCourse =
    pathCourses.find((course) => !(stats[course.slug]?.certified ?? false)) ??
    pathCourses.at(-1);
  const nextStat = nextCourse
    ? (stats[nextCourse.slug] ?? defaultStat(nextCourse))
    : null;
  const nextAction =
    nextCourse && nextStat
      ? courseAction(nextCourse, nextStat, locale, copy)
      : null;
  const selectedSlugs: ReadonlySet<string> = new Set<string>(goal.courseSlugs);
  const groups = [
    {
      id: "lernpfad",
      title: sections.spine.title,
      eyebrow: sections.spine.eyebrow,
      courses: courses.filter(
        (course) => courseGroupFor(course.slug) !== "deeper",
      ),
    },
    {
      id: "tiefer-gehen",
      title: sections.deeper.title,
      eyebrow: sections.deeper.eyebrow,
      courses: courses.filter(
        (course) => courseGroupFor(course.slug) === "deeper",
      ),
    },
  ] as const;

  function selectGoal(nextGoal: GoalId) {
    setGoalId(nextGoal);
    const url = new URL(window.location.href);
    url.searchParams.set("goal", nextGoal);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    notifyUrlStateChanged();
  }

  return (
    <div data-testid="learning-atlas">
      <section
        aria-labelledby="learning-atlas-heading"
        className="border border-border border-t-[3px] border-t-brand-orange bg-card"
      >
        <div className="border-b border-border p-4 sm:p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
            {copy.eyebrow}
          </p>
          <h2
            id="learning-atlas-heading"
            className="mt-2 text-[25px] font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-[30px]"
          >
            {copy.heading}
          </h2>
          <p className="sr-only text-sm leading-relaxed text-muted-foreground sm:not-sr-only sm:mt-2 sm:block sm:max-w-[68ch]">
            {copy.intro}
          </p>

          <div
            className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4"
            role="group"
            aria-label={copy.goalLabel}
          >
            {copy.goals.map((candidate, goalIndex) => {
              const selected = candidate.id === goal.id;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  aria-pressed={selected}
                  aria-controls="selected-learning-path"
                  onClick={() => selectGoal(candidate.id)}
                  data-learning-goal={candidate.id}
                  className={cn(
                    "relative grid min-h-14 min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-2 overflow-hidden border px-3 py-2 text-left text-sm font-bold transition-[border-color,color,background-color] duration-150 motion-reduce:transition-none",
                    selected
                      ? "border-brand-orange bg-kupfer-mist text-foreground"
                      : "border-border bg-background text-foreground hover:border-brand-orange focus-visible:border-brand-orange",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      selected ? "text-brand-orange" : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {String(goalIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 break-words">{candidate.label}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-0 bottom-0 h-0.5 origin-left bg-brand-orange transition-transform duration-200 motion-reduce:transition-none",
                      selected ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="selected-learning-path"
          className="grid min-w-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]"
        >
          <div className="p-4 sm:p-5" data-testid="selected-path-sequence">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
              {copy.selectedPath}
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-[-0.02em] text-foreground">
              {goal.label}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{goal.summary}</p>

            <ol className="mt-4" data-learning-path-stepper>
              {pathCourses.map((course, index) => {
                const stat = stats[course.slug] ?? defaultStat(course);
                const isNext = nextCourse?.slug === course.slug;
                const status = stat.certified
                  ? copy.complete
                  : stat.started
                    ? copy.inProgress
                    : copy.queued;
                return (
                  <li
                    key={course.slug}
                    className="relative min-w-0 pb-2 last:pb-0"
                  >
                    {index < pathCourses.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 left-[0.875rem] top-7 w-px bg-border"
                      />
                    ) : null}
                    <Link
                      href={localizeHref(course.href, locale)}
                      aria-current={isNext ? "step" : undefined}
                      className={cn(
                        "relative grid min-h-14 min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-3 border border-transparent px-2 py-2 text-sm transition-[background-color,border-color] duration-150 hover:border-border hover:bg-card-hover focus-visible:border-brand-orange focus-visible:bg-card-hover motion-reduce:transition-none",
                        isNext && "border-brand-orange bg-kupfer-mist",
                      )}
                    >
                      <span
                        className={cn(
                          "relative z-[1] flex h-7 w-7 items-center justify-center border bg-background font-mono text-xs tabular-nums",
                          stat.certified
                            ? "border-brand-orange bg-kupfer-mist text-brand-orange"
                            : isNext
                              ? "border-brand-orange text-brand-orange"
                              : "border-border text-muted-foreground",
                        )}
                      >
                        {stat.certified ? (
                          <Check size={14} aria-hidden="true" />
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </span>
                      <span className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="min-w-0 break-words font-semibold text-foreground">
                          {course.title}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {status}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>

          <aside
            className="order-first min-w-0 border-b border-border bg-kupfer-mist p-4 sm:p-5 lg:order-none lg:border-b-0 lg:border-l"
            aria-live="polite"
            aria-atomic="true"
            data-testid="next-proof"
          >
            <div className="relative min-w-0 pb-2 pr-2" data-next-proof-stack>
              <span
                aria-hidden="true"
                className="absolute inset-0 translate-x-2 translate-y-2 border border-border bg-card"
              />
              <div
                data-next-proof-card
                className="relative min-w-0 border border-border border-t-[3px] border-t-brand-orange bg-paper p-4 sm:p-5"
              >
                {nextCourse && nextStat && nextAction ? (
                  <>
                    <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
                      {copy.nextProof}{" "}
                      <span className="text-muted-foreground">
                        · {goal.courseSlugs.indexOf(nextCourse.slug) + 1}/
                        {goal.courseSlugs.length}
                        <span className="sr-only"> {copy.pathPosition}</span>
                      </span>
                    </p>
                    <h3 className="mt-2 text-[22px] font-bold leading-tight tracking-[-0.03em] text-foreground">
                      {nextCourse.title}
                    </h3>
                    <p className="mt-2 max-w-[48ch] text-sm leading-snug text-foreground">
                      {(copy.proofs as Readonly<Record<string, string>>)[
                        nextCourse.slug
                      ] ?? nextCourse.tagline}
                    </p>
                    <Link
                      href={nextAction.href}
                      prefetch={false}
                      className="mt-4 inline-flex min-h-11 max-w-full items-center justify-between gap-3 border border-brand-orange bg-brand-orange px-4 py-2 text-sm font-bold text-background transition-[background-color,border-color,color] duration-150 hover:border-brand-cobalt hover:bg-brand-cobalt hover:text-white focus-visible:border-brand-cobalt focus-visible:bg-brand-cobalt focus-visible:text-white motion-reduce:transition-none"
                    >
                      <span className="min-w-0 break-words">
                        {nextAction.label}
                      </span>
                      <span className="sr-only">: {nextCourse.title}</span>
                      <ArrowRight
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                      />
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section aria-labelledby="all-courses-heading" className="mt-10">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
          {courses.length.toString().padStart(2, "0")} · {copy.allCourses}
        </p>
        <h2
          id="all-courses-heading"
          className="mt-1 text-[25px] font-bold tracking-[-0.03em] text-foreground sm:text-[30px]"
        >
          {copy.allCourses}
        </h2>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-sm text-muted-foreground">
            {copy.allCoursesIntro}
          </p>
          <Link
            href={localizeHref("/konto", locale)}
            prefetch={false}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-orange underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-brand-orange focus-visible:decoration-brand-orange motion-reduce:transition-none"
          >
            {copy.viewProgress}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-5 space-y-8">
          {groups.map((group) => (
            <section
              key={group.id}
              id={group.id}
              aria-labelledby={`${group.id}-heading`}
              className="scroll-mt-24"
            >
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-foreground pb-2">
                <h3
                  id={`${group.id}-heading`}
                  className="text-xl font-bold tracking-[-0.02em] text-foreground"
                >
                  {group.title}
                </h3>
                <p className="font-mono text-xs text-muted-foreground">
                  {group.eyebrow}
                </p>
              </div>
              <ol className="mt-3 grid gap-2">
                {group.courses.map((course, index) => (
                  <CourseLedgerRow
                    key={course.slug}
                    course={course}
                    index={index}
                    inPath={selectedSlugs.has(course.slug)}
                    stat={stats[course.slug]}
                    locale={locale}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          {COURSE_GALLERY_COPY[locale].workshopLead}{" "}
          <Link
            href={localizeHref("/workshops", locale)}
            className="font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            /workshops
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
