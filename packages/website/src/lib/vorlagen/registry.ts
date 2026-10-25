/**
 * Templates (CC BY 4.0) under content/vorlagen/, of two kinds:
 *
 * - "question-sheet": a sheet the page named in `hostPaths` renders from the
 *   structure `parseQuestionSheet` returns.
 * - "template": a plain Markdown file a workshop demo hands out in its
 *   "Für deinen Claude" block; `hostPaths` are /demos/<slug> and
 *   /en/demos/<slug>. Templates are never parsed.
 *
 * One entry per file pair, one Markdown file per locale. The files are the
 * single source: the download route at /vorlagen/<file>.md serves their bytes
 * unchanged. A template that also ships inside a workshop kit names that copy
 * in `inKit`; a test asserts both are byte-identical.
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

export type VorlageKind = "question-sheet" | "template";

export interface VorlageEntry {
  readonly slug: string;
  readonly kind: VorlageKind;
  /** Paths relative to content/vorlagen. */
  readonly files: Readonly<Record<SheetLocale, string>>;
  /** Public file names under /vorlagen/. Also the route segment. */
  readonly downloadNames: Readonly<Record<SheetLocale, string>>;
  /** The page that publishes the file (a question sheet's frontmatter hostPath; a demo page for a template). */
  readonly hostPaths: Readonly<Record<SheetLocale, string>>;
  /**
   * Templates only: the same file inside a workshop kit zip. `zip` is the
   * public path of the archive (/workshops/<slug>/<kit>.zip), `paths` the
   * entry per locale. A test asserts the bytes are identical.
   */
  readonly inKit?: {
    readonly zip: string;
    readonly paths: Readonly<Partial<Record<SheetLocale, string>>>;
  };
}

export const VORLAGEN: readonly VorlageEntry[] = [
  {
    slug: "ki-in-der-ausbildung-fragen",
    kind: "question-sheet",
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
  {
    // Workshop 01: the release rule the demo "Die Fehlerliste" fills in (beat "Regel").
    slug: "pruefregel",
    kind: "template",
    files: {
      de: "pruefregel.md",
      en: "en/release-rule.md",
    },
    downloadNames: {
      de: "pruefregel.md",
      en: "release-rule.en.md",
    },
    hostPaths: {
      de: "/demos/ki-prognosen-einschaetzen",
      en: "/en/demos/ki-prognosen-einschaetzen",
    },
    inKit: {
      zip: "/workshops/ki-prognosen-einschaetzen/prognose-pruefen.zip",
      paths: { de: "prognose-pruefen/pruefregel.md" },
    },
  },
  {
    slug: "kennzahlen-steckbrief-vorlage",
    kind: "template",
    files: {
      de: "kennzahlen-steckbrief-vorlage.md",
      en: "en/metric-card-template.md",
    },
    downloadNames: {
      de: "kennzahlen-steckbrief-vorlage.md",
      en: "metric-card-template.en.md",
    },
    hostPaths: {
      de: "/demos/geschaeftsberichte-mit-ki-lesen",
      en: "/en/demos/geschaeftsberichte-mit-ki-lesen",
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

/** The entries of one kind, in registry order. */
export function vorlagenOfKind(kind: VorlageKind): readonly VorlageEntry[] {
  return VORLAGEN.filter((entry) => entry.kind === kind);
}

/** The parsed sheet. A parse or read failure is not cached, so it surfaces again. */
export function loadQuestionSheet(
  slug: string,
  locale: SheetLocale,
): Promise<QuestionSheet> {
  const key = `${slug}:${locale}`;
  try {
    if (entryFor(slug).kind !== "question-sheet") {
      return Promise.reject(new Error(`not a question sheet: ${slug}`));
    }
  } catch (error) {
    return Promise.reject(error);
  }
  const cached = cache.get(key);
  if (cached) return cached;
  const pending = readVorlageSource(slug, locale).then((raw) =>
    parseQuestionSheet(raw, locale),
  );
  cache.set(key, pending);
  pending.catch(() => cache.delete(key));
  return pending;
}
