"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ALL_COURSE_CATALOG,
  type CatalogCourse,
  type CourseLevel,
} from "@/lib/courses/catalog";
import {
  COURSE_LEVEL_LABELS_BY_LOCALE,
  localizeCatalog,
} from "@/lib/courses/catalog-copy";
import { coursePromise } from "@/lib/courses/course-hub-copy";
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
import { ArrowGlyph } from "@/components/werk/arrow-glyph";
import { BUTTON_CLASSES } from "@/components/werk/button-link";
import { FILTER_CHIP_CLASS } from "@/components/werk/chip";
import { cx } from "@/components/werk/cx";
import { notifyUrlStateChanged } from "@/lib/navigation/url-state";
import type { CourseAccessBySlug } from "@/lib/courses/access";
import {
  CourseLedgerRow,
  courseAction,
  defaultStat,
  isLiveCourse,
  type Course,
  type CourseStat,
  type LedgerRowCopy,
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
    heading: "Womit fängst du an?",
    intro:
      "Wähle, was auf dich zutrifft. Der Pfad zeigt die passenden Kurse in der empfohlenen Reihenfolge.",
    goalLabel: "Lernziel auswählen",
    pathLabel: "Kurse in diesem Pfad",
    nextProof: "Empfohlen als Nächstes",
    pathPosition: (position: number, total: number) =>
      `${position} von ${total}`,
    complete: "abgeschlossen",
    inProgress: "begonnen",
    queued: "offen",
    completedLabel: "Abgeschlossen",
    levelTerm: "Stufe",
    allCourses: "Alle Kurse",
    allCoursesIntro:
      "Jede Zeile sagt, was du nach dem Kurs kannst. Jeden Kurs kannst du auch ohne Pfad direkt öffnen.",
    pathHeading: (count: number) => `Dein Pfad · ${count} Kurse`,
    pathStartUnavailable: (title: string) =>
      `Dein Pfad beginnt mit ${title}, der hier nicht verfügbar ist. Diesen Kurs öffnest du ohne Konto.`,
    levelLabel: "Kursstufe wählen",
    allLevels: "Alle",
    levelCount: (visible: number, total: number) =>
      `${visible} von ${total} Kursen`,
    viewProgress: "Fortschritt in deinem Konto ansehen",
    tryDemo: (count: number) =>
      count > 1 ? `${count} Praxisbeispiele ansehen` : "Praxisbeispiel ansehen",
    sourceCode: "Quellcode",
    sourceCommit: "Commit",
    start: "Kurs starten",
    continue: "Weiterlernen",
    viewRecord: "Abschluss ansehen",
    accountRequired: "Lernkonto nötig",
    unavailable: "Hier nicht verfügbar",
    unavailableAction: "Hier nicht verfügbar · Kursübersicht",
    overview: "Kursübersicht",
    accessTerm: "Zugang",
    openAlternative: "Offene Alternative ohne Lernkonto",
    openRecommendation: "Offener Einstieg ohne Lernkonto",
    pathCourse: "Teil deines Pfads",
    goals: LEARNING_GOALS.de,
  },
  en: {
    heading: "Where do you want to start?",
    intro:
      "Pick what fits you. The path shows the matching courses in the suggested order.",
    goalLabel: "Choose a learning goal",
    pathLabel: "Courses in this path",
    nextProof: "Suggested next",
    pathPosition: (position: number, total: number) =>
      `${position} of ${total}`,
    complete: "complete",
    inProgress: "started",
    queued: "open",
    completedLabel: "Completed",
    levelTerm: "Level",
    allCourses: "All courses",
    allCoursesIntro:
      "Each row says what you can do afterwards. You can open any course directly, with or without a path.",
    pathHeading: (count: number) => `Your path · ${count} courses`,
    pathStartUnavailable: (title: string) =>
      `Your path starts with ${title}, which is unavailable here. This course opens without an account.`,
    levelLabel: "Choose a course level",
    allLevels: "All",
    levelCount: (visible: number, total: number) =>
      `${visible} of ${total} courses`,
    viewProgress: "View your progress in your account",
    tryDemo: (count: number) =>
      count > 1 ? `See ${count} applied examples` : "See the applied example",
    sourceCode: "Source code",
    sourceCommit: "Commit",
    start: "Start course",
    continue: "Continue",
    viewRecord: "View completion",
    accountRequired: "Account required",
    unavailable: "Unavailable here",
    unavailableAction: "Unavailable here · Course overview",
    overview: "Course overview",
    accessTerm: "Access",
    openAlternative: "Open alternative without an account",
    openRecommendation: "Open starting point without an account",
    pathCourse: "Part of your path",
    goals: LEARNING_GOALS.en,
  },
} as const satisfies Readonly<
  Record<
    Locale,
    LedgerRowCopy & {
      readonly heading: string;
      readonly intro: string;
      readonly goalLabel: string;
      readonly pathLabel: string;
      readonly nextProof: string;
      readonly pathPosition: (position: number, total: number) => string;
      readonly complete: string;
      readonly inProgress: string;
      readonly queued: string;
      readonly allCourses: string;
      readonly allCoursesIntro: string;
      readonly pathHeading: (count: number) => string;
      readonly pathStartUnavailable: (title: string) => string;
      readonly levelLabel: string;
      readonly allLevels: string;
      readonly levelCount: (visible: number, total: number) => string;
      readonly viewProgress: string;
      readonly openAlternative: string;
      readonly openRecommendation: string;
      readonly goals: readonly LearningGoal[];
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
      <section aria-labelledby="learning-atlas-heading">
        {/* The Kopflinie head. Below sm the intro stays in the accessibility
            tree only, so the goal tabs and the recommended course fit the
            first phone viewport. */}
        <header className="border-t-2 border-foreground pt-4">
          <h2
            id="learning-atlas-heading"
            className="text-fluid-h2 font-bold text-foreground"
          >
            {copy.heading}
          </h2>
          <p className="sr-only max-w-[64ch] text-body text-muted-foreground text-pretty sm:not-sr-only sm:mt-2 sm:block">
            {copy.intro}
          </p>
        </header>

        {/* Four square tabs on one hairline grid: two joined rows of 44px
            segments below lg, one joined row of 56px segments from lg. The
            chosen goal is an ink fill, which carries the state without
            colour. The buttons stay aria-pressed toggles so the choice keeps
            working as a plain form of four buttons. */}
        <div
          className="mt-4 grid grid-cols-2 sm:mt-6 lg:grid-cols-4"
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
                className={cx(
                  "relative flex min-h-11 min-w-0 items-center border px-3 py-2 text-left text-label transition-colors duration-[120ms] focus-visible:z-[2] motion-reduce:transition-none lg:min-h-14 lg:px-4",
                  goalIndex % 2 === 1 && "-ml-px",
                  goalIndex === 2 && "lg:-ml-px",
                  goalIndex >= 2 && "-mt-px lg:mt-0",
                  selected
                    ? "z-[1] border-foreground bg-foreground text-background"
                    : "border-border bg-transparent text-foreground hover:z-[1] hover:border-foreground hover:bg-card-hover",
                )}
              >
                <span className="min-w-0 break-words">{candidate.label}</span>
              </button>
            );
          })}
        </div>

        <div
          id="selected-learning-path"
          className="mt-6 grid min-w-0 gap-8 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,27rem)] lg:gap-14"
        >
          <div className="min-w-0" data-testid="selected-path-sequence">
            {/* The tab above already prints the goal; the head names the
                path. The goal stays in the name so each heading is unique. */}
            <h3 className="text-fluid-h3 font-bold text-foreground">
              {copy.pathHeading(pathCourses.length)}
              <span className="sr-only">: {goal.label}</span>
            </h3>
            <p className="mt-1 max-w-[60ch] text-body text-muted-foreground">
              {goal.summary}
            </p>

            {/* The deck's Route, vertical: square stations on a 2px line.
                Finished courses are solid, the recommended one carries the
                inset square, open ones are outlined behind a dashed line. The
                state is also a word inside each link. */}
            <ol
              className="mt-6 max-w-[34rem]"
              aria-label={copy.pathLabel}
              data-learning-path-stepper
            >
              {pathCourses.map((course, index) => {
                const stat = stats[course.slug] ?? defaultStat(course);
                // The Route marks the path's own next course, also when the
                // sheet offers an open course because this one is unavailable.
                const isNext = pathNextCourse?.slug === course.slug;
                const state: StationState = stat.certified
                  ? "past"
                  : isNext
                    ? "current"
                    : "future";
                const status = stat.certified
                  ? copy.complete
                  : stat.started
                    ? copy.inProgress
                    : copy.queued;
                const last = index === pathCourses.length - 1;
                return (
                  <li
                    key={course.slug}
                    data-state={state}
                    className="relative grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 pb-3 last:pb-0"
                  >
                    {last ? null : (
                      <span
                        aria-hidden="true"
                        data-route-line={state === "past" ? "solid" : "dashed"}
                        className={cx(
                          "absolute -bottom-[1.375rem] left-[9px] top-[1.375rem] border-l-2",
                          state === "past"
                            ? "border-foreground"
                            : "border-dashed border-muted",
                        )}
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="relative z-10 flex h-11 items-center justify-center"
                    >
                      <StationSquare state={state} />
                    </span>
                    <Link
                      href={localizeHref(course.href, locale)}
                      aria-current={isNext ? "step" : undefined}
                      className="group flex min-h-11 min-w-0 flex-col items-start gap-0.5 py-2"
                    >
                      <span
                        className={cx(
                          "min-w-0 break-words text-foreground underline decoration-transparent underline-offset-4 transition-colors duration-[120ms] group-hover:decoration-foreground motion-reduce:transition-none",
                          isNext ? "font-bold" : "font-semibold",
                        )}
                      >
                        {course.title}
                      </span>
                      <span className="text-caption text-muted-foreground tabular-nums">
                        {course.duration} · {status}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>

          <aside
            className="order-first min-w-0 border border-hairline bg-card p-5 sm:p-6 lg:order-none lg:self-start"
            aria-live="polite"
            aria-atomic="true"
            data-testid="next-proof"
          >
            {nextCourse && nextStat && nextAction ? (
              <>
                <p className="text-label text-muted-foreground tabular-nums">
                  {openDefault ? copy.openRecommendation : copy.nextProof}{" "}
                  {goal.courseSlugs.includes(nextCourse.slug) ? (
                    <span>
                      ·{" "}
                      {copy.pathPosition(
                        goal.courseSlugs.indexOf(nextCourse.slug) + 1,
                        goal.courseSlugs.length,
                      )}
                    </span>
                  ) : null}
                </p>
                <h3 className="mt-2 text-fluid-h3 font-bold text-foreground">
                  {nextCourse.title}
                </h3>
                <p className="mt-2 max-w-[52ch] text-body text-foreground">
                  {coursePromise(nextCourse.slug, locale) ??
                    nextCourse.tagline}
                </p>
                <p className="mt-2 text-caption text-muted-foreground tabular-nums">
                  {nextCourse.duration}
                </p>
                <Link
                  href={nextAction.href}
                  prefetch={false}
                  className={cx(
                    BUTTON_CLASSES.paper.primary,
                    "mt-5 max-w-full py-2",
                  )}
                >
                  <span className="min-w-0 break-words">
                    {nextAction.label}
                  </span>
                  <span className="sr-only">: {nextCourse.title}</span>
                  <ArrowGlyph />
                </Link>
                {/* Why the sheet offers a course off the path: the path's
                    own start is unavailable on this deployment. */}
                {openDefault && pathNextCourse ? (
                  <p className="mt-4 max-w-[52ch] text-caption text-muted-foreground text-pretty">
                    {copy.pathStartUnavailable(pathNextCourse.title)}
                  </p>
                ) : null}
                {openAlternative && alternativeAction ? (
                  <Link
                    href={alternativeAction.href}
                    prefetch={false}
                    data-open-course-alternative
                    className={cx(
                      BUTTON_CLASSES.paper.text,
                      "mt-2 flex max-w-full",
                    )}
                  >
                    {copy.openAlternative}: {openAlternative.title}
                  </Link>
                ) : null}
              </>
            ) : null}
          </aside>
        </div>
      </section>

      <section aria-labelledby="all-courses-heading" className="mt-16 lg:mt-20">
        <header className="border-t-2 border-foreground pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2
              id="all-courses-heading"
              className="text-fluid-h2 font-bold text-foreground"
            >
              {copy.allCourses}
            </h2>
            <Link
              href={localizeHref("/konto", locale)}
              prefetch={false}
              className={BUTTON_CLASSES.paper.text}
            >
              {copy.viewProgress}
              <ArrowGlyph />
            </Link>
          </div>
          {/* Orientation, not a decision: below sm it stays in the
              accessibility tree and leaves the printed page. */}
          <p className="sr-only text-body text-muted-foreground sm:not-sr-only sm:mt-1">
            {copy.allCoursesIntro}
          </p>
          {/* The key to the ink square on each row; the rows carry the
              same fact as text for screen readers. */}
          <p
            aria-hidden="true"
            data-path-legend
            className="mt-2 flex items-center gap-2 text-caption text-muted-foreground"
          >
            <span className="size-2.5 shrink-0 bg-foreground" />
            {copy.pathCourse}
          </p>
        </header>

        {/* Level chips, phone only. They stick under the compact top bar while
            the ledger scrolls. "alle" is the server default and hydration
            never flips a row. js-shell-only: four inert buttons without
            scripting would be worse than the complete list. */}
        <div
          data-course-level-filter
          className="js-shell-only sticky top-[var(--nav-h-compact)] z-30 mt-4 border-b border-hairline bg-background py-2 lg:hidden"
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
                  className={cx(FILTER_CHIP_CLASS, "shrink-0")}
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

        <div className="mt-8 space-y-12 lg:mt-10 lg:space-y-16">
          {groups.map((group) => (
            <section
              key={group.id}
              id={group.id}
              aria-labelledby={`${group.id}-heading`}
              className={cx(
                "scroll-mt-24",
                !group.courses.some((course) =>
                  matchesLevel(course, levelFilter),
                ) && "hidden lg:block",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t-2 border-foreground pb-2 pt-3">
                <h3
                  id={`${group.id}-heading`}
                  className="text-[1.625rem] font-bold leading-tight text-foreground"
                >
                  {group.title}
                </h3>
                <p className="text-caption text-muted-foreground tabular-nums">
                  {group.eyebrow}
                </p>
              </div>
              <ol>
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
      </section>
    </div>
  );
}

type StationState = "past" | "current" | "future";

function StationSquare({ state }: { readonly state: StationState }) {
  if (state === "current") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center bg-foreground">
        <span className="size-2 bg-background" />
      </span>
    );
  }
  if (state === "future") {
    return (
      <span className="size-4 shrink-0 border-2 border-foreground bg-background" />
    );
  }
  return <span className="size-4 shrink-0 bg-foreground" />;
}
