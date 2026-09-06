import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { localizeCatalogCourse } from "@/lib/courses/catalog-copy";
import type { CourseSlug } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import { localizeHref } from "@/lib/i18n/locale";

/**
 * The course facts the "continue" card needs, resolved on the server.
 *
 * This exists so the card stays a ~1KB island. The catalog (31KB), its English
 * copy layer (10KB) and the per-course reader configs the canonical resume
 * resolver reaches for are all server-only modules; importing any of them from
 * a client component would ship them to every phone that opens the home page.
 * Ten small records in the payload are far cheaper than that, and the browser
 * then needs nothing but the progress store it already loads.
 *
 * Import this from a server component only — see continue-slot.tsx.
 */
export interface ContinueCourse {
  readonly slug: CourseSlug;
  readonly title: string;
  /** Locale-specific human duration, shown before a course is started. */
  readonly duration: string;
  readonly totalLessons: number;
  /**
   * Reader entry for a started course, already locale-prefixed. This is the
   * catalog's own `continueHref`: the course-level entry that discovery
   * surfaces use. It is not the canonical first-incomplete lesson, which only
   * `lib/courses/resume.ts` can resolve and which needs the reader configs.
   */
  readonly continueHref: string;
  /** First step of an unstarted course, already locale-prefixed. */
  readonly startHref: string;
}

export function homeContinueCourses(
  locale: Locale,
): readonly ContinueCourse[] {
  return COURSE_CATALOG.map((course) => {
    const localized = localizeCatalogCourse(course, locale);
    return {
      slug: course.slug,
      title: localized.title,
      duration: localized.duration ?? course.duration,
      totalLessons: course.totalLessons,
      continueHref: localizeHref(course.continueHref, locale),
      startHref: localizeHref(course.startHref, locale),
    };
  });
}
