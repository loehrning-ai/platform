/**
 * One read path from the canonical registries to the agent surface.
 *
 * Nothing here holds course, workshop, book, or artifact data of its own. It
 * resolves an agent-supplied identifier against the same modules the website
 * renders from, so a lesson an agent reads and a lesson a learner reads can
 * never drift apart.
 */

import {
  COURSE_CATALOG,
  type CatalogCourse,
} from "@/lib/courses/catalog";
import { localizeCatalogCourse } from "@/lib/courses/catalog-copy";
import { getAllLessons, getBlocks } from "@/lib/course/data";
import {
  COURSE_SLUGS,
  type BlockDefinition,
  type CourseSlug,
  type Lesson,
} from "@/lib/course/types";
import { absoluteUrl } from "@/lib/seo/entity";
import { localizeHref, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locale";
import { getWorkshopBySlug, getWorkshops, type Workshop } from "@/lib/workshops";
import { books, type Book } from "@/lib/books";
import {
  OPEN_SOURCE_ARTIFACT_REGISTRY,
  type ProjectArtifact,
  type ToolArtifact,
} from "@/lib/open-source/artifacts";

export type SoftwareArtifact = ToolArtifact | ProjectArtifact;

export function isCourseSlug(value: string): value is CourseSlug {
  return (COURSE_SLUGS as readonly string[]).includes(value);
}

export function catalogCourse(slug: string): CatalogCourse | undefined {
  return COURSE_CATALOG.find((course) => course.slug === slug);
}

export function localizedCourse(
  course: CatalogCourse,
  locale: Locale,
): CatalogCourse {
  return localizeCatalogCourse(course, locale) as CatalogCourse;
}

export function courseUrl(course: CatalogCourse, locale: Locale): string {
  return absoluteUrl(localizeHref(course.href, locale));
}

/**
 * Courses whose lesson bodies live in the shared engine, resolved once by
 * asking the engine itself rather than by keeping a second list that could go
 * stale. Technical courses render from their own lesson modules and stay
 * reader-only on this surface.
 */
let lessonBodyCourses: ReadonlySet<CourseSlug> | null = null;

export function coursesWithLessonBodies(): ReadonlySet<CourseSlug> {
  if (lessonBodyCourses) return lessonBodyCourses;
  const resolved = new Set<CourseSlug>();
  for (const course of COURSE_CATALOG) {
    const everyLocaleLoads = SUPPORTED_LOCALES.every((locale) => {
      try {
        return getAllLessons(course.slug, locale).length > 0;
      } catch {
        return false;
      }
    });
    if (everyLocaleLoads) resolved.add(course.slug);
  }
  lessonBodyCourses = resolved;
  return resolved;
}

export function hasLessonBodies(slug: CourseSlug): boolean {
  return coursesWithLessonBodies().has(slug);
}

export function courseBlocks(
  slug: CourseSlug,
  locale: Locale,
): readonly BlockDefinition[] {
  if (!hasLessonBodies(slug)) return [];
  try {
    return getBlocks(slug, locale);
  } catch {
    return [];
  }
}

export function courseLessons(
  slug: CourseSlug,
  locale: Locale,
): readonly Lesson[] {
  if (!hasLessonBodies(slug)) return [];
  try {
    return getAllLessons(slug, locale);
  } catch {
    return [];
  }
}

export function findLesson(
  slug: CourseSlug,
  lessonId: string,
  locale: Locale,
): Lesson | undefined {
  return courseLessons(slug, locale).find((lesson) => lesson.id === lessonId);
}

/**
 * Lessons render inside their block page rather than at their own URL, so the
 * addressable location of a lesson is that block page. The tool never invents
 * a per-lesson route that would 404 for a reader who follows it.
 */
export function blockUrl(
  course: CatalogCourse,
  blockId: string,
  locale: Locale,
): string {
  return absoluteUrl(localizeHref(`${course.startHref}/${blockId}`, locale));
}

export function workshopBySlug(
  slug: string,
  locale: Locale,
): Workshop | undefined {
  return getWorkshopBySlug(slug, locale);
}

export function allWorkshops(locale: Locale): readonly Workshop[] {
  return getWorkshops(locale);
}

export function workshopUrl(workshop: Workshop, locale: Locale): string {
  return absoluteUrl(localizeHref(`/workshops/${workshop.slug}`, locale));
}

export function bookById(id: string): Book | undefined {
  return books.find((book) => book.id === id);
}

export function publishedBooks(): readonly Book[] {
  return books;
}

export function bookUrlFor(book: Book, locale: Locale): string {
  return absoluteUrl(localizeHref(book.readerHref, locale));
}

export function softwareArtifacts(): readonly SoftwareArtifact[] {
  return [
    ...OPEN_SOURCE_ARTIFACT_REGISTRY.tool,
    ...OPEN_SOURCE_ARTIFACT_REGISTRY.project,
  ];
}

export function softwareArtifactBySlug(
  slug: string,
): SoftwareArtifact | undefined {
  return softwareArtifacts().find((artifact) => artifact.slug === slug);
}

export function artifactUrl(
  artifact: SoftwareArtifact,
  locale: Locale,
): string {
  return absoluteUrl(localizeHref(artifact.href, locale));
}
