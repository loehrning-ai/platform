import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The data book "Von außen gesehen" as the specs see it. Chapter slugs, titles and
 * counts come from the manifest on disk (content/books/ki-landschaft), never from
 * a copy in a spec, so a content refresh cannot leave a spec pointing at a chapter
 * that is gone. What the specs assert is structure and stable strings, not prose.
 */

export const BOOK = "ki-landschaft";
export const BOOK_PATH = `/buecher/${BOOK}`;

export interface ManifestChapter {
  readonly slug: string;
  readonly title: string;
  readonly sourceFile: string;
}

interface Manifest {
  readonly title: string;
  readonly chapters: readonly ManifestChapter[];
}

function read(locale: "de" | "en"): Manifest {
  const file = join(process.cwd(), "content", "books", BOOK, locale === "de" ? "" : "en", "manifest.json");
  return JSON.parse(readFileSync(file, "utf-8")) as Manifest;
}

export const manifest = (locale: "de" | "en" = "de"): Manifest => read(locale);
export const chapters = (locale: "de" | "en" = "de"): readonly ManifestChapter[] => read(locale).chapters;
export const chapterPath = (slug: string): string => `${BOOK_PATH}/${slug}`;

/** The insight spine of INSIGHT-SPEC section 2. */
export const SPINE = [
  "01_zweimal_gemessen",
  "02_textmenge",
  "03_schaufenster",
  "04_stellen_namen",
  "05_land",
  "06_stimmen",
  "07_schluessel",
  "08_dein_zug",
  "09_quellen",
] as const;

/** True once the manifest is the insight spine. Specs that assert the spine skip until then, and say so. */
export const spineLanded = (): boolean => {
  const slugs = chapters().map((c) => c.slug);
  return SPINE.every((slug) => slugs.includes(slug)) && slugs.length === SPINE.length;
};

/** Chapters whose markdown places a pinned stage or the explorer, read from the source files. */
export function chaptersWith(directive: "stage" | "explorer"): readonly ManifestChapter[] {
  const dir = join(process.cwd(), "content", "books", BOOK);
  return chapters().filter((chapter) => {
    const file = join(dir, chapter.sourceFile);
    return existsSync(file) && new RegExp(`^::${directive}\\{`, "m").test(readFileSync(file, "utf-8"));
  });
}

/** The markdown source of a chapter in one locale. */
export function chapterSource(slug: string, locale: "de" | "en" = "de"): string {
  const chapter = chapters(locale).find((c) => c.slug === slug);
  if (!chapter) throw new Error(`no chapter ${slug} in the ${locale} manifest`);
  return readFileSync(join(process.cwd(), "content", "books", BOOK, locale === "de" ? "" : "en", chapter.sourceFile), "utf-8");
}

/**
 * A plain sentence start from the first prose paragraph of a chapter, for "the body is in the server
 * markup" checks: no tokens, links, emphasis, tables, directives or headings in the first 50 characters.
 */
export function proseSnippet(slug: string, locale: "de" | "en" = "de"): string | null {
  for (const line of chapterSource(slug, locale).split("\n")) {
    const text = line.trim();
    if (text.length < 50 || /^[#>|:`\-*\d]/.test(text)) continue;
    const head = text.slice(0, 50);
    if (/[{}[\]*_`|]/.test(head)) continue;
    return head;
  }
  return null;
}

/** First header cell of the first GFM table of a chapter, or null. */
export function firstTableHeader(slug: string, locale: "de" | "en" = "de"): string | null {
  const match = /^\|\s*([^|]+?)\s*\|.*\|\s*\n\|\s*:?-{3,}/m.exec(chapterSource(slug, locale));
  return match ? (match[1] as string) : null;
}

/** Chapters whose markdown matches. */
export function chaptersMatching(pattern: RegExp): readonly ManifestChapter[] {
  return chapters().filter((chapter) => pattern.test(chapterSource(chapter.slug)));
}

/** True when the manifest carries a landing block (facts and explainer for the cover). */
export function hasLanding(): boolean {
  const file = join(process.cwd(), "content", "books", BOOK, "manifest.json");
  return Boolean((JSON.parse(readFileSync(file, "utf-8")) as { landing?: unknown }).landing);
}

/** Labels of the bold-label blockquotes of a chapter ("> **Was du tun kannst:** ..."). */
export function calloutLabels(slug: string): string[] {
  return [...chapterSource(slug).matchAll(/^>\s*\*\*([^*]+?):?\*\*/gm)].map((m) => (m[1] as string).trim());
}
