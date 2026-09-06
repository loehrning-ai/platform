/**
 * Addressable resources.
 *
 * Lessons, workshops and book chapters get stable URIs an agent can store and
 * come back to: `lesson://`, `workshop://` and `book://`. The listing stays in
 * the canonical language so `resources/list` remains a small response; the
 * templates document the `?locale=` parameter, and every read callback honours
 * it, so `lesson://ki-fuehrerschein/block_1_lesson_1?locale=en` resolves.
 */

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/lib/i18n/locale";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import {
  allWorkshops,
  courseLessons,
  publishedBooks,
} from "./catalog";
import { getBookChapterList } from "@/lib/book-reader-content";
import { bookChapterMarkdown } from "./tools/books";
import { lessonMarkdown } from "./tools/courses";
import { workshopMarkdown } from "./tools/workshops";
import {
  BOOK_URI_TEMPLATE,
  LESSON_URI_TEMPLATE,
  WORKSHOP_URI_TEMPLATE,
  bookUri,
  lessonUri,
  parseResourceUri,
  workshopUri,
} from "./uris";
import { McpToolError } from "./errors";

export interface ResourceListing {
  readonly uri: string;
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly mimeType: "text/markdown";
}

export const RESOURCE_LOCALE_NOTE =
  "Append ?locale=en for the English text. Without it the canonical German text is returned.";

export function listLessonResources(): readonly ResourceListing[] {
  const listings: ResourceListing[] = [];
  for (const course of COURSE_CATALOG) {
    for (const lesson of courseLessons(course.slug, DEFAULT_LOCALE)) {
      listings.push({
        uri: lessonUri(course.slug, lesson.id, DEFAULT_LOCALE),
        name: `${course.slug}/${lesson.id}`,
        title: lesson.title,
        description: `${course.title}: ${lesson.subtitle}`,
        mimeType: "text/markdown",
      });
    }
  }
  return listings;
}

export function listWorkshopResources(): readonly ResourceListing[] {
  return allWorkshops(DEFAULT_LOCALE).map((workshop) => ({
    uri: workshopUri(workshop.slug, DEFAULT_LOCALE),
    name: workshop.slug,
    title: workshop.title,
    description: workshop.summary,
    mimeType: "text/markdown" as const,
  }));
}

export async function listBookResources(): Promise<readonly ResourceListing[]> {
  const listings: ResourceListing[] = [];
  for (const book of publishedBooks()) {
    let chapters;
    try {
      chapters = await getBookChapterList(book.id, DEFAULT_LOCALE);
    } catch {
      // A deployment whose function bundle carries no book content still
      // serves every other resource; it simply lists no chapters.
      continue;
    }
    for (const chapter of chapters) {
      listings.push({
        uri: bookUri(book.id, chapter.slug, DEFAULT_LOCALE),
        name: `${book.id}/${chapter.slug}`,
        title: chapter.title,
        description: chapter.description ?? book.title,
        mimeType: "text/markdown",
      });
    }
  }
  return listings;
}

export interface ResourceContent {
  readonly uri: string;
  readonly mimeType: "text/markdown";
  readonly text: string;
}

/**
 * Resolve any of the three schemes. A URI whose scheme does not match the
 * template it was read through is refused, so a `workshop://` address can
 * never be answered with lesson text.
 */
export async function readResource(
  uri: string,
  expected: "lesson" | "workshop" | "book",
): Promise<ResourceContent> {
  const parsed = parseResourceUri(uri);
  if (parsed.kind !== expected) {
    throw new McpToolError(
      "invalid_resource_uri",
      `This address is not a ${expected} resource.`,
    );
  }
  if (!SUPPORTED_LOCALES.includes(parsed.locale)) {
    throw new McpToolError(
      "unsupported_locale",
      "Unsupported locale in the resource URI. Use de or en.",
    );
  }

  if (parsed.kind === "lesson") {
    return {
      uri,
      mimeType: "text/markdown",
      text: lessonMarkdown(parsed.course, parsed.lessonId, parsed.locale),
    };
  }
  if (parsed.kind === "workshop") {
    return {
      uri,
      mimeType: "text/markdown",
      text: workshopMarkdown(parsed.slug, parsed.locale),
    };
  }
  return {
    uri,
    mimeType: "text/markdown",
    text: await bookChapterMarkdown(parsed.book, parsed.chapter, parsed.locale),
  };
}

export interface ResourceTemplateDefinition {
  readonly name: string;
  readonly uriTemplate: string;
  readonly title: string;
  readonly description: string;
  readonly kind: "lesson" | "workshop" | "book";
  readonly list: () => Promise<readonly ResourceListing[]>;
}

export const MCP_RESOURCE_TEMPLATES: readonly ResourceTemplateDefinition[] = [
  {
    name: "lesson",
    uriTemplate: LESSON_URI_TEMPLATE,
    title: "Course lesson",
    description: `One lesson of a loehrning.ai course as Markdown. ${RESOURCE_LOCALE_NOTE}`,
    kind: "lesson",
    list: async () => listLessonResources(),
  },
  {
    name: "workshop",
    uriTemplate: WORKSHOP_URI_TEMPLATE,
    title: "Workshop",
    description: `One self-study workshop with its steps, case and material manifest. ${RESOURCE_LOCALE_NOTE}`,
    kind: "workshop",
    list: async () => listWorkshopResources(),
  },
  {
    name: "book",
    uriTemplate: BOOK_URI_TEMPLATE,
    title: "Book chapter",
    description: `One chapter of an open book as Markdown. ${RESOURCE_LOCALE_NOTE}`,
    kind: "book",
    list: listBookResources,
  },
];
