"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  courseDurationShort,
  coursePromise,
  coursePromiseShort,
} from "@/lib/courses/course-hub-copy";
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
import { PosterThumb } from "@/components/plakat";
import { coursePlakat, PLAKAT_KEYS, type PlakatKey } from "@/lib/plakat/palettes";
import type { CourseAccess, CourseAccessBySlug } from "@/lib/courses/access";
import {
  CourseLedgerRow,
  courseAction,
  defaultStat,
  isLiveCourse,
  sourceRepository,
  type Course,
  type CourseStat,
  type LedgerRowCopy,
} from "./course-ledger-row";

const LIVE_COURSES = ALL_COURSE_CATALOG.filter(isLiveCourse);

/**
 * Colour groups by track (SPEC §2.2, D8): inside a group the rows keep the
 * catalogue order within each scene, and the scenes follow the series order
 * (Lemons, IDEA, Bloom), so the Technikkurse read IDEA ×3 then Bloom ×3.
 */
function byTrackScene(courses: readonly Course[]): Course[] {
  const rank = (course: Course) => {
    const scene = coursePlakat(course.slug)?.plakat;
    return scene ? PLAKAT_KEYS.indexOf(scene) : PLAKAT_KEYS.length;
  };
  return courses
    .map((course, index) => ({ course, index }))
    .sort((a, b) => rank(a.course) - rank(b.course) || a.index - b.index)
    .map(({ course }) => course);
}

/**
 * The rows of a group split into runs of one scene, in order. A group with
 * two scenes (the Technikkurse: IDEA, then Bloom) names each run, so the
 * colour change always has a label (SPEC §2.2).
 */
function sceneRuns(
  courses: readonly Course[],
): { readonly scene: PlakatKey | undefined; readonly courses: Course[] }[] {
  const runs: { scene: PlakatKey | undefined; courses: Course[] }[] = [];
  for (const course of courses) {
    const scene = coursePlakat(course.slug)?.plakat;
    const last = runs.at(-1);
    if (last && last.scene === scene) last.courses.push(course);
    else runs.push({ scene, courses: [course] });
  }
  return runs;
}

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
      `${title} ist hier nicht verfügbar.`,
    levelLabel: "Kursstufe wählen",
    allLevels: "Alle",
    levelCount: (visible: number, total: number) =>
      `${visible} von ${total} Kursen`,
    viewProgress: "Fortschritt in deinem Konto ansehen",
    tryDemo: (count: number) =>
      count > 1 ? `${count} Praxisbeispiele ansehen` : "Praxisbeispiel ansehen",
    tryDemoPhoneTail: " ansehen",
    sourceCode: "Quellcode",
    sourceCommit: "Commit",
    start: "Kurs starten",
    continue: "Weiterlernen",
    viewRecord: "Abschluss ansehen",
    accountRequired: "Lernkonto nötig",
    unavailable: "Hier nicht verfügbar",
    groupUnavailable: "hier nicht verfügbar",
    groupAccountRequired: "Lernkonto nötig",
    groupSource: "Quellcode aller Technikkurse",
    sceneSubheads: { idea: "Prompting und Agenten", bloom: "Daten" },
    unavailableAction: "Hier nicht verfügbar · Kursübersicht",
    overview: "Kursübersicht",
    accessTerm: "Zugang",
    openAlternative: "Offene Alternative ohne Lernkonto",
    openRecommendation: "Offener Einstieg ohne Lernkonto",
    openRecommendationShort: "Ohne Konto",
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
      `${title} isn't available here.`,
    levelLabel: "Choose a course level",
    allLevels: "All",
    levelCount: (visible: number, total: number) =>
      `${visible} of ${total} courses`,
    viewProgress: "View your progress in your account",
    tryDemo: (count: number) =>
      count > 1 ? `${count} applied examples` : "Applied example",
    tryDemoPhoneTail: "",
    sourceCode: "Source code",
    sourceCommit: "Commit",
    start: "Start course",
    continue: "Continue",
    viewRecord: "View completion",
    accountRequired: "Account required",
    unavailable: "Unavailable here",
    groupUnavailable: "unavailable here",
    groupAccountRequired: "account required",
    groupSource: "source code of all technical courses",
    sceneSubheads: { idea: "Prompting and agents", bloom: "Data" },
    unavailableAction: "Unavailable here · Course overview",
    overview: "Course overview",
    accessTerm: "Access",
    openAlternative: "Open alternative without an account",
    openRecommendation: "Open starting point without an account",
    openRecommendationShort: "No account",
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
      readonly openRecommendationShort: string;
      readonly groupUnavailable: string;
      readonly groupAccountRequired: string;
      readonly groupSource: string;
      /** Names the track inside a group that holds two scenes (SPEC §2.2). */
      readonly sceneSubheads: Partial<Record<PlakatKey, string>>;
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
  const sceneSubheads: Partial<Record<PlakatKey, string>> = copy.sceneSubheads;
  const sections = courseSections(locale);
  const courses = localizeCatalog(ALL_COURSE_CATALOG, locale);
  // Null keeps the default recommendation distinct from an explicit choice
  // of "start"; only an unchosen, unstarted path may receive an open fallback.
  const [goalId, setGoalId] = useState<GoalId | null>(null);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("alle");
  const [stats, setStats] = useState<Record<string, CourseStat>>({});
  const levelLabels = COURSE_LEVEL_LABELS_BY_LOCALE[locale];
  const goalRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const requestedGoal = new URL(window.location.href).searchParams.get(
      "goal",
    );
    if (isGoalId(requestedGoal)) {
      setGoalId(requestedGoal);
      // A shared link can name a goal whose chip sits past the phone rail's
      // edge. Scroll the rail itself, never the page, so the pressed chip is
      // in view. From lg the rail does not scroll and this is a no-op.
      const rail = goalRailRef.current;
      const chip = rail?.querySelector<HTMLElement>(
        `[data-learning-goal="${requestedGoal}"]`,
      );
      if (rail && chip && rail.scrollWidth > rail.clientWidth) {
        rail.scrollLeft = Math.max(
          0,
          chip.offsetLeft - parseFloat(getComputedStyle(rail).scrollPaddingLeft || "0"),
        );
      }
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
  const nextPoster = nextCourse ? coursePlakat(nextCourse.slug) : undefined;
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
      courses: byTrackScene(
        courses.filter((course) => courseGroupFor(course.slug) !== "deeper"),
      ),
    },
    {
      id: "tiefer-gehen",
      title: sections.deeper.title,
      eyebrow: sections.deeper.eyebrow,
      courses: byTrackScene(
        courses.filter((course) => courseGroupFor(course.slug) === "deeper"),
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
        {/* The Kopflinie head. Below sm the question and the intro stay in
            the accessibility tree only: the goal chips read as the question
            on their own, so the phone hero is followed directly by the
            choice and the recommended course's action. */}
        <header className="border-t-2 border-scene-line pt-3 max-sm:border-t-0 max-sm:pt-0 sm:pt-4">
          <h2
            id="learning-atlas-heading"
            className="text-[1.375rem]/[1.15] font-bold text-foreground max-sm:sr-only sm:text-fluid-h2"
          >
            {copy.heading}
          </h2>
          <p className="sr-only max-w-[64ch] text-body text-muted-foreground text-pretty sm:not-sr-only sm:mt-2 sm:block">
            {copy.intro}
          </p>
        </header>

        {/* Below lg the four goals are one horizontal rail of square chips
            that bleeds to the screen edge, so the choice costs one 44px row
            and a cut chip shows there is more. From lg the same buttons are
            one joined row of 56px tabs on a shared hairline. The chosen goal
            is an ink fill, which carries the state without colour. The
            buttons stay aria-pressed toggles, so the choice keeps working as
            a plain form of four buttons, and each one is reachable by Tab. */}
        <div
          ref={goalRailRef}
          data-learning-goal-rail
          className="-mx-4 snap-x overflow-x-auto overscroll-x-contain scroll-px-4 [scrollbar-width:none] sm:-mx-6 sm:mt-6 sm:scroll-px-6 lg:mx-0 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
        >
          <div
            className="flex w-max gap-2 px-4 sm:px-6 lg:grid lg:w-auto lg:grid-cols-4 lg:gap-0 lg:px-0"
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
                    "relative flex min-h-11 min-w-0 shrink-0 snap-start items-center whitespace-nowrap border px-3.5 py-2 text-left text-label transition-colors duration-[120ms] focus-visible:z-[2] motion-reduce:transition-none lg:min-h-14 lg:shrink lg:whitespace-normal lg:px-4",
                    goalIndex > 0 && "lg:-ml-px",
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
        </div>

        <div
          id="selected-learning-path"
          className="mt-3 grid min-w-0 gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,27rem)] lg:gap-14"
        >
          <div className="min-w-0" data-testid="selected-path-sequence">
            {/* The tab above already prints the goal; the head names the
                path. The goal stays in the name so each heading is unique. */}
            <h3 className="text-[1.125rem]/[1.2] font-bold text-foreground sm:text-fluid-h3">
              {copy.pathHeading(pathCourses.length)}
              <span className="sr-only">: {goal.label}</span>
            </h3>
            {/* The pressed chip already names the goal; the summary is
                orientation for the wider layouts. */}
            <p className="mt-1 max-w-[60ch] text-body text-muted-foreground max-sm:hidden">
              {goal.summary}
            </p>

            {/* The deck's Route, vertical: square stations on a 2px line.
                Finished courses are solid, the recommended one carries the
                inset square, open ones are outlined behind a dashed line. The
                state is also a word inside each link. On a phone each station
                is one 44px line, title then duration and state; sm stacks
                the caption under the title again. */}
            <ol
              className="mt-2 max-w-[34rem] sm:mt-6"
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
                    className="relative grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 sm:gap-x-4 sm:pb-3 sm:last:pb-0"
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
                      className="group flex min-h-11 min-w-0 flex-wrap content-center items-baseline gap-x-2 py-1.5 sm:flex-col sm:flex-nowrap sm:content-normal sm:items-start sm:gap-0.5 sm:py-2"
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
                        <PhoneDuration
                          full={course.duration}
                          short={courseDurationShort(course.slug, locale)}
                        />{" "}
                        · {status}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>

          <aside
            className="order-first min-w-0 border border-hairline bg-card p-4 sm:p-6 lg:order-none lg:self-start"
            aria-live="polite"
            aria-atomic="true"
            data-testid="next-proof"
          >
            {nextCourse && nextStat && nextAction ? (
              <>
                <p className="text-label text-muted-foreground tabular-nums">
                  {/* One line at 320: the phone says "Ohne Konto", the
                      accessible text keeps the full label. */}
                  {openDefault ? (
                    <>
                      <span aria-hidden="true" className="sm:hidden">
                        {copy.openRecommendationShort}
                      </span>
                      <span className="max-sm:sr-only">
                        {copy.openRecommendation}
                      </span>
                    </>
                  ) : (
                    <span>{copy.nextProof}</span>
                  )}{" "}
                  {goal.courseSlugs.includes(nextCourse.slug) ? (
                    <span>
                      ·{" "}
                      {copy.pathPosition(
                        goal.courseSlugs.indexOf(nextCourse.slug) + 1,
                        goal.courseSlugs.length,
                      )}
                    </span>
                  ) : null}
                  {/* On a phone the duration joins this line instead of
                      taking one of its own under the promise. */}
                  <span className="sm:hidden">
                    {" · "}
                    <span className="whitespace-nowrap">
                      {courseDurationShort(nextCourse.slug, locale) ??
                        nextCourse.duration}
                    </span>
                  </span>
                </p>
                {/* The recommended course's poster, 64 x 80, beside its
                    title (SPEC §3.4). Decorative and without its numeral:
                    the sequence numerals belong to the Grundlagenpfad rows
                    below, so "01" prints once on the page (D9); the line
                    above states the position as text. */}
                <div className="mt-1 flex min-w-0 items-start gap-3 sm:mt-3 sm:gap-4">
                  {nextPoster ? (
                    <PosterThumb
                      plakat={nextPoster.plakat}
                      motif={nextPoster.motif}
                      numeral={null}
                      size="xs"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <h3 className="text-[1.25rem]/[1.2] font-bold text-foreground sm:text-fluid-h3">
                      {nextCourse.title}
                    </h3>
                    {/* Under 390px the sheet prints the short promise, so the
                        Mennige action clears the tab bar on a 568px screen; the
                        full promise stays in the accessibility tree. */}
                    <p className="mt-1.5 max-w-[52ch] text-[0.9375rem]/[1.5] text-foreground sm:mt-2 sm:text-body">
                      <PhonePromise
                        full={
                          coursePromise(nextCourse.slug, locale) ??
                          nextCourse.tagline
                        }
                        short={coursePromiseShort(nextCourse.slug, locale)}
                      />
                    </p>
                  </div>
                </div>
                <p className="mt-2 hidden text-caption text-muted-foreground tabular-nums sm:block">
                  {nextCourse.duration}
                </p>
                {/* Full width on a phone, label left and arrow right, so the
                    one Mennige action is a thumb-wide bar. */}
                <Link
                  href={nextAction.href}
                  prefetch={false}
                  className={cx(
                    BUTTON_CLASSES.paper.primary,
                    "mt-2.5 w-full max-w-full justify-between py-2 sm:mt-5 sm:w-auto sm:justify-start",
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
                  <p className="mt-2 max-w-[52ch] text-caption text-muted-foreground text-pretty sm:mt-4">
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

      <section aria-labelledby="all-courses-heading" className="mt-12 sm:mt-16 lg:mt-20">
        <header className="border-t-2 border-scene-line pt-3 sm:pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2
              id="all-courses-heading"
              className="text-[1.375rem]/[1.15] font-bold text-foreground sm:text-fluid-h2"
            >
              {copy.allCourses}
            </h2>
            {/* Below lg the Konto tab and the cost note below already lead
                to the account, so the phone ledger head keeps its title. */}
            <Link
              href={localizeHref("/konto", locale)}
              prefetch={false}
              className={cx(BUTTON_CLASSES.paper.text, "max-lg:hidden")}
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
            className="mt-1.5 flex items-center gap-2 text-caption sm:mt-2 text-muted-foreground"
          >
            <span className="size-2.5 shrink-0 bg-foreground" />
            {copy.pathCourse}
          </p>
        </header>

        {/* Level chips, phone only. They stick under the compact top bar while
            the ledger scrolls, on screens tall enough to spare the 53px; on a
            short phone the bar, the top bar and the tab bar together would
            cover a third of the screen, so there it scrolls away. "alle" is
            the server default and hydration never flips a row.
            js-shell-only: four inert buttons without scripting would be
            worse than the complete list. */}
        <div
          data-course-level-filter
          className="js-shell-only sticky top-[var(--nav-h-compact)] z-30 mt-3 border-b border-hairline bg-background py-1 sm:mt-4 sm:py-2 lg:hidden [@media(max-height:700px)]:static"
        >
          <div
            role="group"
            aria-label={copy.levelLabel}
            className="-mx-4 flex snap-x gap-2 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
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
                  className={cx(FILTER_CHIP_CLASS, "shrink-0 snap-start")}
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

        <div className="mt-5 space-y-8 sm:mt-8 sm:space-y-12 lg:mt-10 lg:space-y-16">
          {groups.map((group) => {
            const groupAccess = sharedAccess(group.courses, access);
            const groupSource = sharedSource(group.courses);
            return (
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
              {/* One step below the h2 at every width: 22px on phones, where
                  the fluid h2 bottoms out at 26px, 26px from sm up. */}
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 border-t-2 border-scene-line pb-1 pt-2.5 sm:gap-y-1 sm:pb-2 sm:pt-3">
                <h3
                  id={`${group.id}-heading`}
                  className="text-[1.375rem] font-bold leading-tight text-foreground sm:text-[1.625rem]"
                >
                  {group.title}
                </h3>
                <p className="text-caption text-muted-foreground tabular-nums">
                  {group.eyebrow}
                  {/* Every row of the group shares this state, so the phone
                      says it once here; from lg each row's facts column
                      states it. */}
                  {groupAccess ? (
                    <span data-group-access className="lg:hidden">
                      {" · "}
                      {/* The state wraps as one unit, never as a lone word. */}
                      <span className="whitespace-nowrap">
                        {groupAccess === "unavailable"
                          ? copy.groupUnavailable
                          : copy.groupAccountRequired}
                      </span>
                    </span>
                  ) : null}
                </p>
                {/* The MIT attribution once per group below lg, when all
                    rows share one repository and pinned commit; from lg
                    every row prints its own. */}
                {groupSource ? (
                  <a
                    data-group-source
                    href={groupSource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-mt-2 inline-flex min-h-11 basis-full items-center font-mono text-caption text-muted-foreground underline decoration-border underline-offset-4 hover:decoration-foreground lg:hidden"
                  >
                    {groupSource.name} #{groupSource.commit}
                    <span className="sr-only">
                      : {copy.groupSource} ({groupSource.owner}/
                      {groupSource.name}, {copy.sourceCommit}{" "}
                      {groupSource.commit})
                    </span>
                  </a>
                ) : null}
              </div>
              {sceneRuns(group.courses).map((run, runIndex, runs) => {
                const subhead =
                  runs.length > 1 && run.scene ? sceneSubheads[run.scene] : undefined;
                const subheadId = subhead ? `${group.id}-${run.scene}` : undefined;
                return (
                  <div
                    key={run.scene ?? runIndex}
                    data-scene-run={run.scene}
                    className={cx(
                      subhead && "mt-4 first:mt-2 sm:mt-6 sm:first:mt-3",
                      !run.courses.some((course) => matchesLevel(course, levelFilter)) &&
                        "hidden lg:block",
                    )}
                  >
                    {subhead ? (
                      <p
                        id={subheadId}
                        className="text-label font-semibold text-muted-foreground"
                      >
                        {subhead}
                      </p>
                    ) : null}
                    <ol aria-labelledby={subheadId}>
                      {run.courses.map((course) => (
                        <CourseLedgerRow
                          key={course.slug}
                          course={course}
                          inPath={selectedSlugs.has(course.slug)}
                          visible={matchesLevel(course, levelFilter)}
                          stat={stats[course.slug]}
                          locale={locale}
                          copy={copy}
                          access={access[course.slug] ?? "unavailable"}
                          accessInGroupHead={groupAccess !== null}
                          sourceInGroupHead={groupSource !== null}
                        />
                      ))}
                    </ol>
                  </div>
                );
              })}
            </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/**
 * The access state every course of a group shares, when it is not "open":
 * the phone group head then states it once instead of on every row.
 */
function sharedAccess(
  courses: readonly Course[],
  access: CourseAccessBySlug,
): Exclude<CourseAccess, "open"> | null {
  const first = courses[0];
  if (!first || !courses.every(isLiveCourse)) return null;
  const state = access[first.slug] ?? "unavailable";
  if (state === "open") return null;
  return courses.every(
    (course) => (access[course.slug] ?? "unavailable") === state,
  )
    ? state
    : null;
}

/**
 * The repository and pinned commit every course of a group shares, for the
 * phone group head. Null when any course lacks a source or differs.
 */
function sharedSource(courses: readonly Course[]): {
  readonly owner: string;
  readonly name: string;
  readonly commit: string;
  readonly href: string;
} | null {
  const first = courses[0];
  if (!first?.sourceHref || !first.sourceCommit) return null;
  const repository = sourceRepository(first.sourceHref);
  if (!repository.owner || !repository.name) return null;
  const same = courses.every((course) => {
    if (!course.sourceHref || course.sourceCommit !== first.sourceCommit) {
      return false;
    }
    const other = sourceRepository(course.sourceHref);
    return other.owner === repository.owner && other.name === repository.name;
  });
  if (!same) return null;
  return {
    owner: repository.owner,
    name: repository.name,
    commit: first.sourceCommit.slice(0, 7),
    href: `https://github.com/${repository.owner}/${repository.name}/tree/${first.sourceCommit}`,
  };
}

/** A phone-length duration below sm where one exists, the catalog label from sm. */
function PhoneDuration({
  full,
  short,
}: {
  readonly full: string;
  readonly short?: string;
}) {
  if (!short) return <>{full}</>;
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="max-sm:hidden">{full}</span>
    </>
  );
}

/** The short promise under 390px (aria-hidden), the full one above it. */
function PhonePromise({
  full,
  short,
}: {
  readonly full: string;
  readonly short?: string;
}) {
  if (!short) return <>{full}</>;
  return (
    <>
      <span aria-hidden="true" className="min-[390px]:hidden">
        {short}
      </span>
      <span className="max-[389px]:sr-only">{full}</span>
    </>
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
