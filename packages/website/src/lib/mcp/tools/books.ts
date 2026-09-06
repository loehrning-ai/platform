/**
 * Book chapter tool.
 *
 * Chapter bodies are authored Markdown read from `content/books/`. That read
 * can legitimately fail in a deployment whose function bundle does not carry
 * the content tree, so the tool degrades to a structured "body unavailable"
 * answer with the reader URL instead of throwing an opaque error at the agent.
 */

import { SITE_CONTENT_DATE } from "@/lib/content-freshness";
import type { Locale } from "@/lib/i18n/locale";
import {
  getBookChapterList,
  loadBookChapter,
} from "@/lib/book-reader-content";
import { bookById, bookUrlFor, publishedBooks } from "../catalog";
import { MCP_MAX_OUTPUT_BYTES } from "../config";
import { notFound } from "../errors";
import { capText } from "../output";
import { bookUri } from "../uris";

/** Leaves room for the surrounding metadata inside the output ceiling. */
const CHAPTER_BODY_MAX_BYTES = MCP_MAX_OUTPUT_BYTES - 8 * 1024;

export interface BookChapterResult {
  readonly stand: string;
  readonly locale: Locale;
  readonly book: string;
  readonly book_title: string;
  readonly chapter: string;
  readonly chapter_title: string;
  readonly reading_time_minutes: number | null;
  readonly url: string;
  readonly resource_uri: string;
  readonly headings: readonly { readonly text: string; readonly level: number }[];
  readonly body_available: boolean;
  readonly body_truncated: boolean;
  readonly markdown: string | null;
  readonly note: string | null;
}

export function listBooksForSearch() {
  return publishedBooks();
}

export async function getBookChapter(
  bookSlug: string,
  chapterSlug: string,
  locale: Locale,
): Promise<BookChapterResult> {
  const book = bookById(bookSlug);
  if (!book) notFound("unknown_book", "book", "search_content");

  const url = bookUrlFor(book, locale);
  const base = {
    stand: SITE_CONTENT_DATE,
    locale,
    book: book.id,
    book_title: book.title,
    chapter: chapterSlug,
    url,
    resource_uri: bookUri(book.id, chapterSlug, locale),
  } as const;

  let chapters;
  try {
    chapters = await getBookChapterList(book.id, locale);
  } catch {
    return {
      ...base,
      chapter_title: chapterSlug,
      reading_time_minutes: null,
      headings: [],
      body_available: false,
      body_truncated: false,
      markdown: null,
      note: `The chapter index for this book is not readable in this deployment. Read the book at ${url}.`,
    };
  }

  const meta = chapters.find((entry) => entry.slug === chapterSlug);
  if (!meta) notFound("unknown_chapter", "chapter", "get_course");

  try {
    const chapter = await loadBookChapter(book.id, chapterSlug, locale);
    const body = capText(chapter.rawMarkdown, CHAPTER_BODY_MAX_BYTES);
    return {
      ...base,
      chapter_title: chapter.meta.title,
      reading_time_minutes: chapter.readingTimeMinutes,
      headings: chapter.headings.map((heading) => ({
        text: heading.text,
        level: heading.level,
      })),
      body_available: true,
      body_truncated: body.truncated,
      markdown: body.text,
      note: body.truncated
        ? `The chapter exceeds the response ceiling and was cut. Read the rest at ${url}.`
        : null,
    };
  } catch {
    return {
      ...base,
      chapter_title: meta.title,
      reading_time_minutes: meta.readingTimeMinutes ?? null,
      headings: [],
      body_available: false,
      body_truncated: false,
      markdown: null,
      note: `The chapter text is not readable in this deployment. Read it at ${url}.`,
    };
  }
}

/** Markdown rendering of one chapter, used by the book:// resource. */
export async function bookChapterMarkdown(
  bookSlug: string,
  chapterSlug: string,
  locale: Locale,
): Promise<string> {
  const chapter = await getBookChapter(bookSlug, chapterSlug, locale);
  if (!chapter.body_available || chapter.markdown === null) {
    return [
      `# ${chapter.chapter_title}`,
      "",
      chapter.note ?? `Read this chapter at ${chapter.url}.`,
      "",
    ].join("\n");
  }
  return [
    `# ${chapter.chapter_title}`,
    "",
    `From ${chapter.book_title}. Source: ${chapter.url}`,
    "",
    chapter.markdown,
    ...(chapter.body_truncated ? ["", chapter.note ?? ""] : []),
    "",
  ].join("\n");
}
