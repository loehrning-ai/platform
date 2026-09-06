/**
 * Course tools. Pure functions over the canonical course registries: the same
 * catalog the /kurse hub renders and the same lesson bundles the readers use.
 */

import type { Locale } from "@/lib/i18n/locale";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import {
  blockUrl,
  catalogCourse,
  courseBlocks,
  courseUrl,
  findLesson,
  hasLessonBodies,
  isCourseSlug,
  localizedCourse,
} from "../catalog";
import { notFound } from "../errors";
import { lessonUri } from "../uris";

export interface CourseSummary {
  readonly slug: string;
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly level: string;
  readonly duration: string;
  readonly duration_minutes: number;
  readonly total_lessons: number;
  readonly unit_label: string;
  readonly unit_count: number;
  readonly audience: string;
  readonly url: string;
  readonly start_url: string;
  /** True when get_lesson can return this course's lesson bodies. */
  readonly lesson_bodies_available: boolean;
}

function summarize(slug: string, locale: Locale): CourseSummary {
  const course = catalogCourse(slug);
  if (!course) notFound("unknown_course", "course", "list_courses");
  const localized = localizedCourse(course, locale);
  return {
    slug: course.slug,
    title: localized.title,
    tagline: localized.tagline,
    description: localized.description,
    level: course.level,
    duration: localized.duration,
    duration_minutes: course.durationMinutes,
    total_lessons: course.totalLessons,
    unit_label: localized.unitLabel,
    unit_count: course.unitCount,
    audience: localized.audience,
    url: courseUrl(course, locale),
    start_url: courseUrl({ ...course, href: course.startHref }, locale),
    lesson_bodies_available: hasLessonBodies(course.slug),
  };
}

export function listCourses(locale: Locale) {
  return {
    stand: SITE_CONTENT_DATE,
    locale,
    count: COURSE_CATALOG.length,
    courses: COURSE_CATALOG.map((course) => summarize(course.slug, locale)),
  };
}

export function getCourse(slug: string, locale: Locale) {
  if (!isCourseSlug(slug)) {
    notFound("unknown_course", "course", "list_courses");
  }
  const summary = summarize(slug, locale);
  const blocks = courseBlocks(slug, locale);
  const course = catalogCourse(slug)!;

  return {
    ...summary,
    stand: SITE_CONTENT_DATE,
    blocks: blocks.map((block) => ({
      id: block.id,
      title: block.title,
      description: block.description,
      duration_minutes: block.durationMinutes,
      order_index: block.orderIndex,
      url: blockUrl(course, block.id, locale),
      lessons: block.lessons.map((lesson) => ({
        id: lesson.id,
        number: lesson.number,
        title: lesson.title,
        subtitle: lesson.subtitle,
        duration_minutes: lesson.durationMinutes,
        resource_uri: lessonUri(slug, lesson.id, locale),
      })),
    })),
    ...(blocks.length === 0
      ? {
          lesson_index_note:
            "This course renders from its own reader. Open the course URL to read it; get_lesson does not serve its lesson bodies.",
        }
      : {}),
  };
}

export function getLesson(slug: string, lessonId: string, locale: Locale) {
  if (!isCourseSlug(slug)) {
    notFound("unknown_course", "course", "list_courses");
  }
  const course = catalogCourse(slug);
  if (!course) notFound("unknown_course", "course", "list_courses");
  const lesson = findLesson(slug, lessonId, locale);
  if (!lesson) notFound("unknown_lesson", "lesson", "get_course");

  return {
    stand: SITE_CONTENT_DATE,
    locale,
    course: slug,
    block_id: lesson.blockId,
    id: lesson.id,
    number: lesson.number,
    title: lesson.title,
    subtitle: lesson.subtitle,
    duration_minutes: lesson.durationMinutes,
    key_concepts: lesson.keyConcepts,
    resource_uri: lessonUri(slug, lesson.id, locale),
    url: blockUrl(course, lesson.blockId, locale),
    sections: lesson.sections.map((section) => ({
      id: section.id,
      title: section.title,
      read_time_minutes: section.readTimeMinutes,
      key_takeaway: section.keyTakeaway ?? null,
      content: section.content,
    })),
    quiz_question_count: lesson.quiz.length,
    quiz_note:
      "The lesson quiz and every progress checkpoint stay in the reader, where a learner's own answers are recorded.",
  };
}

/** Markdown rendering of one lesson, used by the lesson:// resource. */
export function lessonMarkdown(
  slug: string,
  lessonId: string,
  locale: Locale,
): string {
  const lesson = getLesson(slug, lessonId, locale);
  const heading = `# ${lesson.title}\n\n${lesson.subtitle}\n`;
  const meta = [
    `Course: ${slug}`,
    `Block: ${lesson.block_id}`,
    `Duration: ${lesson.duration_minutes} min`,
    `Source: ${lesson.url}`,
  ].join("  \n");
  const concepts =
    lesson.key_concepts.length > 0
      ? `\n\n## Key concepts\n\n${lesson.key_concepts
          .map((concept) => `- ${concept}`)
          .join("\n")}`
      : "";
  const sections = lesson.sections
    .map((section) => {
      const takeaway = section.key_takeaway
        ? `\n\n> ${section.key_takeaway}`
        : "";
      return `\n\n## ${section.title}\n\n${section.content}${takeaway}`;
    })
    .join("");
  return `${heading}\n${meta}${concepts}${sections}\n`;
}
