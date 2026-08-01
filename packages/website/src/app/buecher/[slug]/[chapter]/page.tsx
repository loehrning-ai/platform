export const runtime = "nodejs";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { books, getBookById } from "@/lib/books";
import {
  getBookChapterList,
  loadBookChapter,
  getChapterNeighbours,
  type BookChapterMeta,
} from "@/lib/book-reader-content";
import { ChapterReader } from "@/components/book-reader/chapter-reader";
import { ResourceContextBanner } from "@/components/learning/resource-context-banner";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

interface Params {
  readonly params: Promise<{
    readonly slug: string;
    readonly chapter: string;
  }>;
}

/** Pre-build all slug + chapter combinations at build time. */
export async function generateStaticParams() {
  const results: { slug: string; chapter: string }[] = [];
  for (const book of books) {
    try {
      const chapters = await getBookChapterList(book.id);
      for (const ch of chapters) {
        results.push({ slug: book.id, chapter: ch.slug });
      }
    } catch {
      // If manifest doesn't exist yet, skip (shouldn't happen in production)
    }
  }
  return results;
}

// Fixed, curated slug+chapter pairs — a combination outside
// generateStaticParams must hard-404, not fall through to a dynamically
// rendered notFound() page that some hosts cache/serve with status 200.
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, chapter } = await params;
  const book = getBookById(slug);
  if (!book) return {};

  try {
    const loaded = await loadBookChapter(slug, chapter);
    return createPublicPageMetadata({
      title: `${loaded.meta.title} | ${book.title}`,
      description: loaded.meta.description ?? `${book.subtitle}.`,
      path: `/buecher/${slug}/${chapter}`,
    });
  } catch {
    return {};
  }
}

export default async function ChapterPage({ params }: Params) {
  const { slug, chapter } = await params;
  const book = getBookById(slug);
  if (!book) notFound();

  let loaded;
  try {
    loaded = await loadBookChapter(slug, chapter);
  } catch {
    notFound();
  }

  let neighbours;
  try {
    neighbours = await getChapterNeighbours(slug, chapter);
  } catch {
    neighbours = { prev: null, next: null };
  }

  let allChapters: BookChapterMeta[];
  try {
    allChapters = await getBookChapterList(slug);
  } catch {
    allChapters = [];
  }

  return (
    <>
      <ResourceContextBanner nodeId={`book:${book.id}`} />
      <ChapterReader
        book={book}
        chapter={loaded}
        neighbours={neighbours}
        allChapters={allChapters}
      />
    </>
  );
}
