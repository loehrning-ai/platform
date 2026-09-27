/**
 * Question-sheet templates (CC BY 4.0) under content/vorlagen/.
 *
 * One entry per sheet, one Markdown file per locale. The files are the single
 * source: the download route at /vorlagen/<file>.md serves their bytes
 * unchanged, and the page named in `hostPaths` renders the structure that
 * `parseQuestionSheet` returns from the same bytes.
 *
 * Server only: reads the content directory with Node.js fs. The parser in
 * ./question-sheet stays pure so tests and scripts can call it directly.
 */

import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  parseQuestionSheet,
  type QuestionSheet,
  type SheetLocale,
} from "./question-sheet";

export interface VorlageEntry {
  readonly slug: string;
  /** Paths relative to content/vorlagen. */
  readonly files: Readonly<Record<SheetLocale, string>>;
  /** Public file names under /vorlagen/. Also the route segment. */
  readonly downloadNames: Readonly<Record<SheetLocale, string>>;
  /** The page that publishes the sheet; equals frontmatter hostPath. */
  readonly hostPaths: Readonly<Record<SheetLocale, string>>;
}

export const VORLAGEN: readonly VorlageEntry[] = [
  {
    slug: "ki-in-der-ausbildung-fragen",
    files: {
      de: "ki-in-der-ausbildung-fragen.md",
      en: "en/ki-in-der-ausbildung-fragen.md",
    },
    downloadNames: {
      de: "ki-in-der-ausbildung-fragen.md",
      en: "ki-in-der-ausbildung-fragen.en.md",
    },
    hostPaths: {
      de: "/blog/ki-in-der-ausbildung",
      en: "/en/blog/ki-in-der-ausbildung",
    },
  },
];

/**
 * A download name is also the URL segment. Lower-case ASCII words joined by
 * single hyphens, an optional ".en" and the ".md" extension: nothing that
 * could traverse out of the content directory passes.
 */
export const DOWNLOAD_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.en)?\.md$/;

/**
 * Works in development and during the production build, where the working
 * directory is the website package in both cases (same resolution the skills
 * collection uses for content/skills).
 */
export function vorlagenContentRoot(): string {
  return path.join(process.cwd(), "content", "vorlagen");
}

function entryFor(slug: string): VorlageEntry {
  const entry = VORLAGEN.find((item) => item.slug === slug);
  if (!entry) throw new Error(`unknown Vorlage: ${slug}`);
  return entry;
}

/** The public download path. Never localized: the file name carries the locale. */
export function downloadPathFor(slug: string, locale: SheetLocale): string {
  return `/vorlagen/${entryFor(slug).downloadNames[locale]}`;
}

/** Maps a requested file name to its entry, or null for anything unknown. */
export function findByDownloadName(
  name: string,
): { entry: VorlageEntry; locale: SheetLocale } | null {
  if (!DOWNLOAD_NAME_PATTERN.test(name)) return null;
  for (const entry of VORLAGEN) {
    for (const locale of ["de", "en"] as const) {
      if (entry.downloadNames[locale] === name) return { entry, locale };
    }
  }
  return null;
}

/** The authored bytes of one sheet, unchanged. */
export async function readVorlageSource(
  slug: string,
  locale: SheetLocale,
): Promise<string> {
  const entry = entryFor(slug);
  return readFile(path.join(vorlagenContentRoot(), entry.files[locale]), "utf8");
}

const cache = new Map<string, Promise<QuestionSheet>>();

/** The parsed sheet. A parse or read failure is not cached, so it surfaces again. */
export function loadQuestionSheet(
  slug: string,
  locale: SheetLocale,
): Promise<QuestionSheet> {
  const key = `${slug}:${locale}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const pending = readVorlageSource(slug, locale).then((raw) =>
    parseQuestionSheet(raw, locale),
  );
  cache.set(key, pending);
  pending.catch(() => cache.delete(key));
  return pending;
}
