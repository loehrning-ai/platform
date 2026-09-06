import type { CatalogCourse, CourseLevel } from "@/lib/courses/catalog";
import {
  type CoveredCourseOutcome,
  isCourseRecordEarned,
} from "@/lib/courses/competencies";
import { completedCanonicalLessonCount } from "@/lib/courses/completion";
import {
  hasCourseStarted,
  resolveCourseResumeHref,
} from "@/lib/courses/resume";
import type { UnifiedProgress } from "@/lib/progress/types";

/**
 * Anchor targets for the account regions whose content this module derives.
 *
 * The section nav links to these, so every id here must belong to an element
 * that actually renders whenever its nav entry is offered.
 *
 * Werkzeuge and Deine KI are deliberately absent: each owns its own id next to
 * the readiness gate that decides whether it renders at all
 * (`WERKZEUGE_SECTION_ID` in ./werkzeuge-copy, `DEINE_KI_SECTION_ID` in
 * ./deine-ki), and the page offers their anchors under exactly those
 * conditions. Restating the ids here would let a nav entry outlive its region.
 */
export const KONTO_SECTION_IDS = {
  weiterlernen: "konto-weiterlernen",
  kurse: "konto-meine-kurse",
  nachweise: "konto-nachweise",
  verwalten: "konto-verwalten",
} as const;

export const COURSE_LEVEL_VALUES: readonly CourseLevel[] = [
  "einstieg",
  "mittel",
  "fortg",
];

export const COURSE_SORT_VALUES = ["step", "duration", "progress"] as const;
export type CourseSort = (typeof COURSE_SORT_VALUES)[number];

export function isCourseLevel(value: string | undefined): value is CourseLevel {
  return value !== undefined && (COURSE_LEVEL_VALUES as string[]).includes(value);
}

export function isCourseSort(value: string | undefined): value is CourseSort {
  return (
    value !== undefined && (COURSE_SORT_VALUES as readonly string[]).includes(value)
  );
}

/** Build the catalog filter/sort link for the account page. */
export function kontoHref(params: {
  readonly level?: CourseLevel;
  readonly sort?: CourseSort;
}): string {
  const search = new URLSearchParams();
  if (params.level) search.set("level", params.level);
  if (params.sort && params.sort !== "step") search.set("sort", params.sort);
  const query = search.toString();
  return query ? `/konto?${query}` : "/konto";
}

/**
 * One course row, derived once in the page from the single progress fetch and
 * handed to every region as a prop. Regions never read progress themselves, so
 * no region can add a request waterfall to the account page.
 */
export interface AccountCourseEntry {
  readonly course: CatalogCourse;
  readonly done: number;
  readonly pct: number;
  readonly recordEarned: boolean;
  readonly started: boolean;
  readonly resumeHref: string;
  readonly lastActivity: string | null;
}

export function buildAccountCourses(
  courses: readonly CatalogCourse[],
  progress: UnifiedProgress | null,
): readonly AccountCourseEntry[] {
  return courses.map((course) => {
    const done = completedCanonicalLessonCount(progress, course.slug);
    const pct =
      course.totalLessons > 0
        ? Math.min(100, Math.round((done / course.totalLessons) * 100))
        : 0;
    return {
      course,
      done,
      pct,
      recordEarned: isCourseRecordEarned(progress, course.slug),
      started: done > 0 || hasCourseStarted(progress, course.slug),
      resumeHref: resolveCourseResumeHref(progress, course.slug),
      lastActivity: progress?.courses[course.slug]?.lastActivity ?? null,
    };
  });
}

/**
 * The most recently active course whose record is not earned yet.
 *
 * "Next" and the "all done" state use the same record-earned definition as the
 * completed tally, so the offered action cannot contradict the count.
 */
export function selectNextCourse(
  entries: readonly AccountCourseEntry[],
): AccountCourseEntry | null {
  return (
    entries
      .filter((entry) => !entry.recordEarned)
      .sort((left, right) => {
        const leftAt = left.lastActivity ? Date.parse(left.lastActivity) : 0;
        const rightAt = right.lastActivity ? Date.parse(right.lastActivity) : 0;
        return rightAt - leftAt;
      })[0] ?? null
  );
}

/**
 * Filter and sort apply to the catalog grid only, never to the rollups or the
 * continuation card, because those describe the whole record.
 */
export function orderCatalog(
  entries: readonly AccountCourseEntry[],
  level: CourseLevel | undefined,
  sort: CourseSort,
): readonly AccountCourseEntry[] {
  return entries
    .filter((entry) => !level || entry.course.level === level)
    .sort((left, right) => {
      if (sort === "duration") {
        return left.course.durationMinutes - right.course.durationMinutes;
      }
      if (sort === "progress") return right.pct - left.pct;
      return left.course.step - right.course.step;
    });
}

export interface CoveredOutcomeGroup {
  readonly course: CatalogCourse;
  readonly items: readonly CoveredCourseOutcome[];
}

/** Group curriculum outcomes under the completed course that covered them. */
export function groupCoveredOutcomes(
  courses: readonly CatalogCourse[],
  covered: readonly CoveredCourseOutcome[],
): readonly CoveredOutcomeGroup[] {
  return courses
    .map((course) => ({
      course,
      items: covered.filter((outcome) => outcome.courseSlug === course.slug),
    }))
    .filter((group) => group.items.length > 0);
}
