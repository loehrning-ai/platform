"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  ALL_COURSE_CATALOG,
  type CatalogCourse,
  type CourseLevel,
} from "@/lib/courses/catalog";
import {
  COURSE_LEVEL_LABELS_BY_LOCALE,
  localizeCatalog,
} from "@/lib/courses/catalog-copy";
import { COURSE_GALLERY_COPY } from "@/lib/courses/course-gallery-copy";
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
import type { CourseAccessBySlug } from "@/lib/courses/access";
import {
  CourseLedgerRow,
  courseAction,
  defaultStat,
  isLiveCourse,
  type Course,
  type CourseStat,
} from "./course-ledger-row";

const LIVE_COURSES = ALL_COURSE_CATALOG.filter(isLiveCourse);

/**
 * Level filter for the phone ledger. "alle" is the default on both the server
 * and the first client render, so the ten rows are complete without
 * JavaScript and hydration never flips the list. Selecting a level hides the
 * non-matching rows BELOW lg only (`hidden lg:list-item`): the desktop ledger
 * is a reviewed, complete document and stays complete at every width, while
 * the phone gets the short list it can actually read.
 */
type LevelFilter = CourseLevel | "alle";

const LEVEL_FILTERS: readonly LevelFilter[] = [
  "alle",
  "einstieg",
  "mittel",
  "fortg",
];

function matchesLevel(course: Course, level: LevelFilter): boolean {
  return level === "alle" || course.level === level;
}

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
    levelLabel: "Kursstufe wählen",
    allLevels: "Alle",
    levelCount: (visible: number, total: number) =>
      `${visible} von ${total} Kursen`,
    viewProgress: "Fortschritt in deinem Konto ansehen",
    tryDemo: (count: number) =>
      count > 1 ? `${count} Praxisbeispiele testen` : "Praxisbeispiel testen",
    sourceCode: "Quellcode",
    sourceCommit: "Commit",
    start: "Nachweis beginnen",
    continue: "Nachweis fortsetzen",
    viewRecord: "Nachweis ansehen",
    accountRequired: "Lernkonto nötig",
    unavailable: "Hier nicht verfügbar",
    unavailableAction: "Hier nicht verfügbar · Kursübersicht",
    openAlternative: "Offene Alternative ohne Lernkonto",
    openRecommendation: "Offener Einstieg ohne Lernkonto",
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
    levelLabel: "Choose a course level",
    allLevels: "All",
    levelCount: (visible: number, total: number) =>
      `${visible} of ${total} courses`,
    viewProgress: "View your progress in your account",
    tryDemo: (count: number) =>
      count > 1 ? `Try ${count} applied examples` : "Try the applied example",
    sourceCode: "Source code",
    sourceCommit: "Commit",
    start: "Start this proof",
    continue: "Continue this proof",
    viewRecord: "View record",
    accountRequired: "Account required",
    unavailable: "Unavailable here",
    unavailableAction: "Unavailable here · Course overview",
    openAlternative: "Open alternative without an account",
    openRecommendation: "Open starting point without an account",
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
      readonly levelLabel: string;
      readonly allLevels: string;
      readonly levelCount: (visible: number, total: number) => string;
      readonly viewProgress: string;
      readonly tryDemo: (count: number) => string;
      readonly sourceCode: string;
      readonly sourceCommit: string;
      readonly start: string;
      readonly continue: string;
      readonly viewRecord: string;
      readonly accountRequired: string;
      readonly unavailable: string;
      readonly unavailableAction: string;
      readonly openAlternative: string;
      readonly openRecommendation: string;
      readonly pathCourse: string;
      readonly goals: readonly LearningGoal[];
      readonly proofs: Readonly<Record<string, string>>;
    }
  >
>;

function isGoalId(value: string | null): value is GoalId {
  return value !== null && GOAL_IDS.includes(value as GoalId);
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

export function LearningAtlas({
  locale = "de",
  access,
}: {
  readonly locale?: Locale;
  readonly access: CourseAccessBySlug;
}) {
  const copy = ATLAS_COPY[locale];
  const sections = courseSections(locale);
  const courses = localizeCatalog(ALL_COURSE_CATALOG, locale);
  // Null keeps the default recommendation distinct from an explicit choice
  // of "start"; only an unchosen, unstarted path may receive an open fallback.
  const [goalId, setGoalId] = useState<GoalId | null>(null);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("alle");
  const [stats, setStats] = useState<Record<string, CourseStat>>({});
  const levelLabels = COURSE_LEVEL_LABELS_BY_LOCALE[locale];

  useEffect(() => {
    const requestedGoal = new URL(window.location.href).searchParams.get(
      "goal",
    );
    if (isGoalId(requestedGoal)) {
      setGoalId(requestedGoal);
    }

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
  const pathNextCourse =
    pathCourses.find((course) => !(stats[course.slug]?.certified ?? false)) ??
    pathCourses.at(-1);
  const openDefault =
    goalId === null &&
    !Object.values(stats).some((stat) => stat.started || stat.certified) &&
    pathNextCourse &&
    access[pathNextCourse.slug] === "unavailable"
      ? courses.find(
          (course) => isLiveCourse(course) && access[course.slug] === "open",
        )
      : undefined;
  const nextCourse =
    openDefault && isLiveCourse(openDefault) ? openDefault : pathNextCourse;
  const nextStat = nextCourse
    ? (stats[nextCourse.slug] ?? defaultStat(nextCourse))
    : null;
  const nextAction =
    nextCourse && nextStat
      ? courseAction(
          nextCourse,
          nextStat,
          locale,
          copy,
          access[nextCourse.slug] ?? "unavailable",
        )
      : null;
  // An explicit goal still names its own next course. An unavailable reader
  // opens that course's public context; the open task is a separate choice,
  // never a silent replacement of the learner's path or progress.
  const openAlternative =
    nextCourse && access[nextCourse.slug] === "unavailable"
      ? (pathCourses.find((course) => access[course.slug] === "open") ??
        courses.find(
          (course) => isLiveCourse(course) && access[course.slug] === "open",
        ))
      : undefined;
  const alternativeAction =
    openAlternative && isLiveCourse(openAlternative)
      ? courseAction(
          openAlternative,
          stats[openAlternative.slug] ?? defaultStat(openAlternative),
          locale,
          copy,
          "open",
        )
      : null;
  const selectedSlugs: ReadonlySet<string> = new Set<string>(goal.courseSlugs);
  const visibleCourseCount = courses.filter((course) =>
    matchesLevel(course, levelFilter),
  ).length;
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

          {/* Below lg the four goals form one segmented control: two joined
              rows of 44px segments that share their hairlines, all four
              visible at once so the decision is complete without scrolling.
              The ordinal is desktop-only so every label fits on one line at
              390px. From lg the reviewed 56px tiles return. */}
          <div
            className="mt-4 grid grid-cols-2 lg:grid-cols-4 lg:gap-2"
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
                    "relative flex min-h-11 min-w-0 items-center gap-2 overflow-hidden border px-3 py-2 text-left text-sm font-bold transition-[border-color,color,background-color] duration-150 motion-reduce:transition-none lg:grid lg:min-h-14 lg:grid-cols-[1.75rem_minmax(0,1fr)]",
                    goalIndex % 2 === 1 && "-ml-px lg:ml-0",
                    goalIndex >= 2 && "-mt-px lg:mt-0",
                    selected
                      ? "z-[1] border-brand-orange bg-kupfer-mist text-foreground"
                      : "border-border bg-background text-foreground hover:z-[1] hover:border-brand-orange focus-visible:z-[1] focus-visible:border-brand-orange",
                  )}
                >
                  <span
                    className={cn(
                      "hidden font-mono text-xs tabular-nums lg:block",
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
                        "relative grid min-h-11 min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-3 border border-transparent px-2 py-2 text-sm transition-[background-color,border-color] duration-150 hover:border-border hover:bg-card-hover focus-visible:border-brand-orange focus-visible:bg-card-hover motion-reduce:transition-none lg:min-h-14",
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
                      {openDefault ? copy.openRecommendation : copy.nextProof}{" "}
                      {goal.courseSlugs.includes(nextCourse.slug) ? (
                        <span className="text-muted-foreground">
                          · {goal.courseSlugs.indexOf(nextCourse.slug) + 1}/
                          {goal.courseSlugs.length}
                          <span className="sr-only"> {copy.pathPosition}</span>
                        </span>
                      ) : null}
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
                    {openAlternative && alternativeAction ? (
                      <Link
                        href={alternativeAction.href}
                        prefetch={false}
                        data-open-course-alternative
                        className="mt-2 inline-flex min-h-11 max-w-full items-center text-sm font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:decoration-foreground"
                      >
                        {copy.openAlternative}: {openAlternative.title}
                      </Link>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section aria-labelledby="all-courses-heading" className="mt-8 lg:mt-10">
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
          {/* The same treatment the atlas intro above already gets: this
              sentence is orientation, not a decision, and below sm it costs
              two printed lines and pushes the progress link onto a third
              directly above the level chips. It stays in the accessibility
              tree and returns as visible text from sm. */}
          <p className="sr-only text-sm text-muted-foreground sm:not-sr-only">
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

        {/* Level chips, phone only. They stick under the compact top bar while
            the ledger scrolls, so the list can be narrowed from anywhere in it.
            "alle" is the server default and hydration never flips a row. The
            bar carries js-shell-only: four inert buttons without scripting
            would be worse than the complete list that reader already has. */}
        <div
          data-course-level-filter
          className="js-shell-only sticky top-[var(--nav-h-compact)] z-30 -mx-4 mt-4 border-b border-border bg-background px-4 py-2 sm:-mx-6 sm:px-6 lg:hidden"
        >
          <div
            role="group"
            aria-label={copy.levelLabel}
            className="flex gap-2 overflow-x-auto [scrollbar-width:none]"
          >
            {LEVEL_FILTERS.map((level) => {
              const selected = level === levelFilter;
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLevelFilter(level)}
                  data-course-level-chip={level}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center border px-3 text-xs font-bold transition-[border-color,background-color] duration-150 motion-reduce:transition-none",
                    selected
                      ? "border-brand-orange bg-kupfer-mist text-foreground"
                      : "border-border bg-background text-foreground hover:border-brand-orange focus-visible:border-brand-orange",
                  )}
                >
                  {level === "alle" ? copy.allLevels : levelLabels[level]}
                </button>
              );
            })}
          </div>
          <p aria-live="polite" className="sr-only">
            {copy.levelCount(visibleCourseCount, courses.length)}
          </p>
        </div>

        <div className="mt-4 space-y-6 lg:mt-5 lg:space-y-8">
          {groups.map((group) => (
            <section
              key={group.id}
              id={group.id}
              aria-labelledby={`${group.id}-heading`}
              className={cn(
                "scroll-mt-24",
                !group.courses.some((course) =>
                  matchesLevel(course, levelFilter),
                ) && "hidden lg:block",
              )}
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
                    visible={matchesLevel(course, levelFilter)}
                    stat={stats[course.slug]}
                    locale={locale}
                    copy={copy}
                    access={access[course.slug] ?? "unavailable"}
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
            className="inline-flex min-h-11 items-center font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            /workshops
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
