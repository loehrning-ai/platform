/**
 * Stable resource URIs for the agent surface.
 *
 * Three schemes, all addressable and all stable across deployments:
 *
 *   lesson://<course>/<lessonId>?locale=de|en
 *   workshop://<slug>?locale=de|en
 *   book://<book>/<chapter>?locale=de|en
 *
 * The scheme identity is the contract an agent stores, so parsing is strict:
 * an unknown scheme, an extra path segment, an unsupported locale, or a
 * segment with syntax that could escape a lookup is refused rather than
 * coerced onto something that happens to exist.
 */

import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locale";
import { McpToolError } from "./errors";

export const LESSON_URI_SCHEME = "lesson:";
export const WORKSHOP_URI_SCHEME = "workshop:";
export const BOOK_URI_SCHEME = "book:";

export const LESSON_URI_TEMPLATE = "lesson://{course}/{lessonId}";
export const WORKSHOP_URI_TEMPLATE = "workshop://{slug}";
export const BOOK_URI_TEMPLATE = "book://{book}/{chapter}";

const SEGMENT_PATTERN = /^[a-z0-9][a-z0-9_-]{0,120}$/;
const MAX_URI_LENGTH = 512;

export interface LessonUri {
  readonly kind: "lesson";
  readonly course: string;
  readonly lessonId: string;
  readonly locale: Locale;
}

export interface WorkshopUri {
  readonly kind: "workshop";
  readonly slug: string;
  readonly locale: Locale;
}

export interface BookUri {
  readonly kind: "book";
  readonly book: string;
  readonly chapter: string;
  readonly locale: Locale;
}

export type ParsedResourceUri = LessonUri | WorkshopUri | BookUri;

function invalid(reason: string): never {
  throw new McpToolError("invalid_resource_uri", reason);
}

function readLocale(url: URL): Locale {
  const raw = url.searchParams.get("locale");
  if (raw === null) return DEFAULT_LOCALE;
  if (!isLocale(raw)) {
    invalid("Unsupported locale in the resource URI. Use de or en.");
  }
  return raw;
}

function pathSegments(url: URL): readonly string[] {
  return url.pathname.split("/").filter((segment) => segment.length > 0);
}

function requireSegment(value: string, label: string): string {
  if (!SEGMENT_PATTERN.test(value)) {
    invalid(`The ${label} segment of the resource URI is not a valid slug.`);
  }
  return value;
}

/**
 * Parse one of the three platform resource URIs. Every rejection is an
 * `McpToolError` with the `invalid_resource_uri` code so a caller can tell a
 * malformed address apart from an address that simply does not exist.
 */
export function parseResourceUri(raw: string): ParsedResourceUri {
  if (typeof raw !== "string" || raw.length === 0) {
    invalid("The resource URI is empty.");
  }
  if (raw.length > MAX_URI_LENGTH) {
    invalid("The resource URI is too long.");
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return invalid("The resource URI could not be parsed.");
  }

  const locale = readLocale(url);
  const segments = pathSegments(url);

  if (url.protocol === LESSON_URI_SCHEME) {
    if (segments.length !== 1) {
      invalid("A lesson URI is lesson://<course>/<lessonId>.");
    }
    return {
      kind: "lesson",
      course: requireSegment(url.hostname, "course"),
      lessonId: requireSegment(segments[0]!, "lesson"),
      locale,
    };
  }

  if (url.protocol === WORKSHOP_URI_SCHEME) {
    if (segments.length !== 0) {
      invalid("A workshop URI is workshop://<slug>.");
    }
    return {
      kind: "workshop",
      slug: requireSegment(url.hostname, "workshop"),
      locale,
    };
  }

  if (url.protocol === BOOK_URI_SCHEME) {
    if (segments.length !== 1) {
      invalid("A book URI is book://<book>/<chapter>.");
    }
    return {
      kind: "book",
      book: requireSegment(url.hostname, "book"),
      chapter: requireSegment(segments[0]!, "chapter"),
      locale,
    };
  }

  return invalid("Unknown resource scheme. Use lesson, workshop, or book.");
}

function withLocale(base: string, locale: Locale): string {
  return locale === DEFAULT_LOCALE ? base : `${base}?locale=${locale}`;
}

export function lessonUri(
  course: string,
  lessonId: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return withLocale(`lesson://${course}/${lessonId}`, locale);
}

export function workshopUri(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return withLocale(`workshop://${slug}`, locale);
}

export function bookUri(
  book: string,
  chapter: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  return withLocale(`book://${book}/${chapter}`, locale);
}
