/**
 * Which books use the insight experience (poster band, pinned hero stage,
 * visible source lines, the placement instrument) instead of the plain reader.
 * One place, so the chapter page, the book landing and the tests agree. A book
 * joins by being listed here; its manifest and figure files do the rest.
 */

export const INSIGHT_BOOKS: readonly string[] = ["ki-landschaft"];

export function isInsightBook(bookId: string): boolean {
  return INSIGHT_BOOKS.includes(bookId);
}
