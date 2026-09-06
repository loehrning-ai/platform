/**
 * Lazy in-process search index over the public catalogue.
 *
 * Built once per locale on first use and kept for the life of the worker: the
 * inputs are compiled-in registries, so the index cannot go stale within a
 * deployment and rebuilding it per request would only burn cold-start budget.
 * Lesson bodies are indexed by their heading and key concepts rather than
 * their full text, which keeps the index small enough to stay in memory while
 * still resolving the words a learner actually searches for.
 */

import type { Locale } from "@/lib/i18n/locale";
import { LEARNING_NODES } from "@/lib/learning-graph";
import { absoluteUrl } from "@/lib/seo/entity";
import { localizeHref } from "@/lib/i18n/locale";
import {
  allWorkshops,
  blockUrl,
  bookUrlFor,
  catalogCourse,
  courseBlocks,
  courseUrl,
  localizedCourse,
  publishedBooks,
  artifactUrl,
  softwareArtifacts,
  workshopUrl,
} from "./catalog";
import { COURSE_CATALOG } from "@/lib/courses/catalog";
import { lessonUri, workshopUri } from "./uris";

export type SearchEntryKind =
  | "course"
  | "lesson"
  | "workshop"
  | "book"
  | "open_source"
  | "page";

export interface SearchEntry {
  readonly kind: SearchEntryKind;
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly url: string;
  readonly resource_uri: string | null;
  /** Lowercased haystack. Never returned to a caller. */
  readonly haystack: string;
}

export interface SearchHit {
  readonly kind: SearchEntryKind;
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly url: string;
  readonly resource_uri: string | null;
  readonly score: number;
}

function haystackOf(...parts: readonly (string | undefined | null)[]): string {
  return parts
    .filter((part): part is string => typeof part === "string")
    .join(" ")
    .toLowerCase();
}

function buildIndex(locale: Locale): readonly SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const catalogEntry of COURSE_CATALOG) {
    const course = catalogCourse(catalogEntry.slug)!;
    const localized = localizedCourse(course, locale);
    entries.push({
      kind: "course",
      id: course.slug,
      title: localized.title,
      summary: localized.tagline,
      url: courseUrl(course, locale),
      resource_uri: null,
      haystack: haystackOf(
        localized.title,
        localized.tagline,
        localized.description,
        localized.audience,
        localized.eyebrow,
      ),
    });

    for (const block of courseBlocks(course.slug, locale)) {
      for (const lesson of block.lessons) {
        entries.push({
          kind: "lesson",
          id: `${course.slug}/${lesson.id}`,
          title: lesson.title,
          summary: lesson.subtitle,
          url: blockUrl(course, block.id, locale),
          resource_uri: lessonUri(course.slug, lesson.id, locale),
          haystack: haystackOf(
            lesson.title,
            lesson.subtitle,
            lesson.keyConcepts.join(" "),
            lesson.sections.map((section) => section.title).join(" "),
            lesson.sections
              .map((section) => section.keyTakeaway ?? "")
              .join(" "),
          ),
        });
      }
    }
  }

  for (const workshop of allWorkshops(locale)) {
    entries.push({
      kind: "workshop",
      id: workshop.slug,
      title: workshop.title,
      summary: workshop.summary,
      url: workshopUrl(workshop, locale),
      resource_uri: workshopUri(workshop.slug, locale),
      haystack: haystackOf(
        workshop.title,
        workshop.eyebrow,
        workshop.summary,
        workshop.description,
        workshop.audience.join(" "),
        workshop.steps.map((step) => `${step.title} ${step.description}`).join(" "),
      ),
    });
  }

  for (const book of publishedBooks()) {
    entries.push({
      kind: "book",
      id: book.id,
      title: book.title,
      summary: book.subtitle,
      url: bookUrlFor(book, locale),
      resource_uri: null,
      haystack: haystackOf(
        book.title,
        book.subtitle,
        book.description,
        book.audience,
        book.highlights.join(" "),
      ),
    });
  }

  for (const artifact of softwareArtifacts()) {
    entries.push({
      kind: "open_source",
      id: artifact.slug,
      title: artifact.title,
      summary: artifact.description,
      url: artifactUrl(artifact, locale),
      resource_uri: null,
      haystack: haystackOf(
        artifact.title,
        artifact.eyebrow,
        artifact.description,
        artifact.language,
        artifact.guide.dataFlow,
      ),
    });
  }

  const known = new Set(entries.map((entry) => entry.url));
  for (const node of LEARNING_NODES) {
    const url = absoluteUrl(localizeHref(node.route, locale));
    if (known.has(url)) continue;
    entries.push({
      kind: "page",
      id: node.id,
      title: node.title,
      summary: node.summary ?? "",
      url,
      resource_uri: null,
      haystack: haystackOf(node.title, node.summary, node.type, node.stage),
    });
  }

  return entries;
}

const indexes = new Map<Locale, readonly SearchEntry[]>();

export function searchIndexFor(locale: Locale): readonly SearchEntry[] {
  const existing = indexes.get(locale);
  if (existing) return existing;
  const built = buildIndex(locale);
  indexes.set(locale, built);
  return built;
}

/** Exposed for tests: drop the memoized indexes. */
export function resetSearchIndex(): void {
  indexes.clear();
}

const TOKEN_PATTERN = /[\p{Letter}\p{Number}]+/gu;

export function tokenize(query: string): readonly string[] {
  return Array.from(query.toLowerCase().matchAll(TOKEN_PATTERN))
    .map((match) => match[0])
    .filter((token) => token.length >= 2)
    .slice(0, 12);
}

/**
 * Every token must appear somewhere in the entry. Score rewards a title match
 * and shorter titles, so "Datenschutz" finds the lesson called Datenschutz
 * before a lesson that merely mentions it.
 */
export function searchEntries(
  locale: Locale,
  query: string,
  limit: number,
): readonly SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scored: SearchHit[] = [];
  for (const entry of searchIndexFor(locale)) {
    const title = entry.title.toLowerCase();
    let score = 0;
    let matchesAll = true;
    for (const token of tokens) {
      const inTitle = title.includes(token);
      const inBody = entry.haystack.includes(token);
      if (!inTitle && !inBody) {
        matchesAll = false;
        break;
      }
      score += inTitle ? 8 : 1;
    }
    if (!matchesAll) continue;
    if (title === query.trim().toLowerCase()) score += 20;
    scored.push({
      kind: entry.kind,
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      url: entry.url,
      resource_uri: entry.resource_uri,
      score,
    });
  }

  return scored
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.title.length - right.title.length ||
        left.id.localeCompare(right.id),
    )
    .slice(0, limit);
}
