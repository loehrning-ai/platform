/**
 * book-reader-content.ts
 *
 * Build-time Markdown import pipeline for the open book reader.
 * Reads authored public-reader material from content/books/<slug>/.
 *
 * Node.js fs — must NOT run on Edge Runtime.
 * All book reader pages must declare: export const runtime = 'nodejs';
 */

import { promises as fs } from "fs";
import path from "path";
import type { Locale } from "@/lib/i18n/locale";
import { loadBookFigures, FigureLoadError, FIXTURE_FIGURE_IDS } from "@/lib/book-figures";
import { figureKey, listDirectives, replaceDirectives, type Directive } from "@/lib/book-directives";
import { hasToken, resolveToken, resolveTokens, TokenError } from "@/lib/figures";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TocHeading {
  readonly id: string;
  readonly text: string;
  readonly level: 2 | 3;
}

/**
 * The band of an insight chapter (docs: book chapter anatomy): the hero number,
 * the one-line claim and nothing else. Both strings may hold number tokens
 * ({{h01.ratio}}); the loader resolves them from the frozen figure JSON, so a
 * number on the band cannot drift from the chart.
 */
export interface ChapterBand {
  /** The hero number as printed, for example "62x" or "35 bis 49". */
  readonly numeral: string;
  /** One line, the finding. */
  readonly claim: string;
}

export interface BookChapterMeta {
  readonly slug: string;
  readonly title: string;
  readonly description?: string;
  readonly sourceFile: string;
  readonly readingTimeMinutes?: number;
  /** Optional: the band of an insight chapter. Chapters without it get a title-only band. */
  readonly band?: ChapterBand;
}

export interface DroppedChapter {
  readonly sourceFile: string;
  readonly reason: string;
}

/**
 * What the cover page of an insight book needs beyond the chapter list. All
 * strings may hold number tokens ({{h05.n}}); the loader resolves them from the
 * frozen figure JSON, so the cover cannot print a number the chart does not hold.
 */
export interface BookLanding {
  /** Number token without braces, for the share the cover field shows. Default "c4.weighted_share". */
  readonly headlineRef?: string;
  /** Text after the headline number ("der Firmen mit auffindbarer Website schreiben KI auf ihre Startseite."). */
  readonly headlineTail?: string;
  /** One visible source line under the headline number (a caveat that must sit next to the claim, never in a drawer). */
  readonly sourceLine?: string;
  /** The three facts under the stage: value and label, for example "25.581" and "Firmen mit eigener Domain". */
  readonly facts?: readonly { readonly value: string; readonly label: string }[];
  /** Heading and two sentences of the visible explainer. */
  readonly explainer?: { readonly heading: string; readonly text: string };
  /** Chapter slug that holds the explorer "Wo stehe ich?" (the secondary link of the stage). Default "08_dein_zug". */
  readonly explorerChapter?: string;
}

export interface BookManifest {
  readonly bookSlug: string;
  readonly title: string;
  readonly adaptationNote?: string;
  readonly landing?: BookLanding;
  readonly chapters: readonly BookChapterMeta[];
  readonly droppedChapters?: readonly DroppedChapter[];
}

export interface LoadedChapter {
  readonly meta: BookChapterMeta;
  readonly rawMarkdown: string;
  readonly headings: TocHeading[];
  readonly readingTimeMinutes: number;
}

// ── Paths ────────────────────────────────────────────────────────────────────

function contentRoot(): string {
  // Works both in development (cwd = packages/website) and
  // in Next.js production build (cwd = project root).
  const cwd = process.cwd();
  const candidate = path.join(cwd, "content", "books");
  return candidate;
}

function assertSafeContentSegment(value: string, label: string): void {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(value)) {
    throw new Error(`Invalid ${label} "${value}".`);
  }
}

function bookDir(bookSlug: string, locale: Locale): string {
  assertSafeContentSegment(bookSlug, "book slug");
  const baseDirectory = path.join(contentRoot(), bookSlug);
  return locale === "de" ? baseDirectory : path.join(baseDirectory, locale);
}

// ── Manifest ─────────────────────────────────────────────────────────────────

export async function loadBookManifest(
  bookSlug: string,
  locale: Locale,
): Promise<BookManifest> {
  const manifestPath = path.join(bookDir(bookSlug, locale), "manifest.json");
  const raw = await fs.readFile(manifestPath, "utf-8");
  const manifest = JSON.parse(raw) as BookManifest;
  if (manifest.bookSlug !== bookSlug || !Array.isArray(manifest.chapters)) {
    throw new Error(
      `Invalid ${locale} manifest for book "${bookSlug}".`,
    );
  }
  return manifest;
}

// ── Chapter list (metadata only) ─────────────────────────────────────────────

export async function getBookChapterList(
  bookSlug: string,
  locale: Locale,
): Promise<BookChapterMeta[]> {
  const manifest = await loadBookManifest(bookSlug, locale);
  return [...manifest.chapters];
}

// ── Heading extraction ───────────────────────────────────────────────────────

function extractHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  // Match `## text` and `### text` lines (ATX style)
  const re = /^(#{2,3})\s+(.+?)(?:\s+#+)?$/gm;
  let match: RegExpExecArray | null;

  while ((match = re.exec(markdown)) !== null) {
    const level = (match[1].length as 2 | 3);
    const text = match[2].trim();
    // Generate slug id mirroring rehype-slug (github-slugger): lowercase,
    // strip punctuation, spaces to dashes, and KEEP unicode letters. The old
    // ae/oe/ue transliteration produced ids like "der-schluessel" while the
    // DOM renders id="der-schlüssel", silently breaking every TOC link to an
    // umlaut heading (regression coverage mobile finding).
    const id = text
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-");
    headings.push({ id, text, level });
  }

  return headings;
}

// ── Word count → reading time ────────────────────────────────────────────────

function computeReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.floor(words / 200));
}

// ── Figure tokens and directives ─────────────────────────────────────────────

/** Splits a ticker ref "c4.weighted_share.range" into figure id, key and field. */
export function parseTickerRef(ref: string): { figure: string; key: string; field?: string } | null {
  const m = /^([a-z0-9][a-z0-9_-]*)\.([A-Za-z0-9_]+)(?:\.(value|num|lo|hi|range|n))?$/.exec(ref.trim());
  return m ? { figure: m[1] as string, key: m[2] as string, field: m[3] } : null;
}

/**
 * Resolves {{figure.key}} number tokens from the book's figure JSON and checks
 * that every ::figure and ::ticker line points at something that exists. A
 * typo fails the build here, never prints a placeholder on a page.
 */
async function resolveChapterFigures(
  bookSlug: string,
  chapterSlug: string,
  locale: Locale,
  markdown: string,
): Promise<string> {
  if (!/\{\{|^::[a-z]/m.test(markdown)) return markdown;
  const figures = await loadBookFigures(bookSlug);
  let resolved: string;
  try {
    resolved = resolveTokens(markdown, figures.lookup, locale);
  } catch (error) {
    if (error instanceof TokenError) throw new TokenError(`${bookSlug}/${chapterSlug}: ${error.message}`);
    throw error;
  }
  if (hasToken(resolved)) {
    const left = /\{\{[^}]*\}\}/.exec(resolved)?.[0] ?? "";
    throw new TokenError(`${bookSlug}/${chapterSlug}: cannot read the token ${left}. Write {{figure.key}}.`);
  }
  for (const directive of listDirectives(resolved)) {
    if (directive.name === "figure" || directive.name === "stage") {
      const id = figureKey(directive.attrs["id"] as string);
      if (!figures.specs.has(id) && !FIXTURE_FIGURE_IDS.includes(id)) {
        throw new FigureLoadError(`${bookSlug}/${chapterSlug}: ${directive.source} has no figure. Known: ${[...figures.specs.keys(), ...FIXTURE_FIGURE_IDS].join(", ")}`);
      }
    } else if (directive.name === "ticker") {
      const ref = parseTickerRef(directive.attrs["ref"] as string);
      const spec = ref ? figures.specs.get(ref.figure.toLowerCase()) : undefined;
      if (!ref || !spec) throw new FigureLoadError(`${bookSlug}/${chapterSlug}: ${directive.source}: ref must be figure.key of a known figure`);
      resolveToken(spec, ref.key, "value", undefined, locale);
    }
  }
  return resolved;
}

/** Resolves the number tokens of a manifest band against the frozen figure JSON. Undefined stays undefined. */
async function resolveChapterBand(
  bookSlug: string,
  chapterSlug: string,
  locale: Locale,
  band: ChapterBand | undefined,
): Promise<ChapterBand | undefined> {
  if (!band) return undefined;
  if (typeof band.numeral !== "string" || typeof band.claim !== "string" || band.numeral.trim() === "" || band.claim.trim() === "") {
    throw new Error(`${bookSlug}/${chapterSlug}: band needs a numeral and a claim, both text.`);
  }
  const figures = await loadBookFigures(bookSlug);
  try {
    return {
      numeral: resolveTokens(band.numeral, figures.lookup, locale),
      claim: resolveTokens(band.claim, figures.lookup, locale),
    };
  } catch (error) {
    if (error instanceof TokenError) throw new TokenError(`${bookSlug}/${chapterSlug} band: ${error.message}`);
    throw error;
  }
}

/**
 * The chapter as plain Markdown for readers that cannot show a figure (agent
 * tools, text PDF): a figure line becomes its title and caption, a ticker line
 * its number and tail.
 */
export async function plainChapterMarkdown(bookSlug: string, rawMarkdown: string, locale: Locale): Promise<string> {
  if (!/^::[a-z]/m.test(rawMarkdown)) return rawMarkdown;
  const figures = await loadBookFigures(bookSlug);
  const describe = (d: Directive): string | null => {
    if (d.name === "figure" || d.name === "stage") {
      const spec = figures.specs.get(figureKey(d.attrs["id"] as string));
      return spec ? `*Abbildung: ${spec.title}. ${spec.caption}*` : null;
    }
    if (d.name === "explorer") return "*Werkzeug: Wo stehe ich? Die Schätzung rechnet der Browser, online unter dem Kapitel.*";
    if (d.name === "ticker") {
      const ref = parseTickerRef(d.attrs["ref"] as string);
      const spec = ref ? figures.specs.get(ref.figure.toLowerCase()) : undefined;
      return ref && spec ? `**${resolveToken(spec, ref.key, "value", undefined, locale)}** ${d.attrs["tail"] as string}` : null;
    }
    return null;
  };
  return replaceDirectives(rawMarkdown, describe);
}

// ── Chapter loader ───────────────────────────────────────────────────────────

export async function loadBookChapter(
  bookSlug: string,
  chapterSlug: string,
  locale: Locale,
): Promise<LoadedChapter> {
  assertSafeContentSegment(chapterSlug, "chapter slug");
  const manifest = await loadBookManifest(bookSlug, locale);
  const meta = manifest.chapters.find((c) => c.slug === chapterSlug);
  if (!meta) {
    throw new Error(
      `Chapter "${chapterSlug}" not found in manifest for book "${bookSlug}".`
    );
  }

  if (path.basename(meta.sourceFile) !== meta.sourceFile) {
    throw new Error(
      `Invalid source file "${meta.sourceFile}" for chapter "${chapterSlug}".`,
    );
  }
  const filePath = path.join(bookDir(bookSlug, locale), meta.sourceFile);
  const fileContents = await fs.readFile(filePath, "utf-8");
  // The reader chrome renders its own <h1> from the manifest title, while the
  // chapter markdown files also carry a `# Titel` line near the top (after an
  // optional adaptation-note paragraph). Rendering both produced a duplicate
  // h1 on every chapter (WCAG structure defect found by regression coverage
  // tests). Strip exactly the first ATX h1 within the opening lines; the TOC
  // is unaffected (extractHeadings only collects level 2-3) and `#` comments
  // inside later code fences stay out of reach of the 10-line guard.
  const lines = fileContents.split("\n");
  const h1Index = lines.findIndex((line) => /^#\s+/.test(line));
  const withoutH1 =
    h1Index >= 0 && h1Index < 10
      ? [...lines.slice(0, h1Index), ...lines.slice(h1Index + 1)].join("\n")
      : fileContents;
  const rawMarkdown = await resolveChapterFigures(bookSlug, chapterSlug, locale, withoutH1);
  const headings = extractHeadings(rawMarkdown);
  const readingTimeMinutes = computeReadingTime(rawMarkdown);
  const band = await resolveChapterBand(bookSlug, chapterSlug, locale, meta.band);

  return {
    meta: { ...meta, readingTimeMinutes, band },
    rawMarkdown,
    headings,
    readingTimeMinutes,
  };
}

// ── Neighbour chapters (prev / next) ─────────────────────────────────────────

export interface ChapterNeighbours {
  readonly prev: BookChapterMeta | null;
  readonly next: BookChapterMeta | null;
}

export async function getChapterNeighbours(
  bookSlug: string,
  chapterSlug: string,
  locale: Locale,
): Promise<ChapterNeighbours> {
  const chapters = await getBookChapterList(bookSlug, locale);
  const idx = chapters.findIndex((c) => c.slug === chapterSlug);
  return {
    prev: idx > 0 ? (chapters[idx - 1] ?? null) : null,
    next: idx >= 0 && idx < chapters.length - 1 ? (chapters[idx + 1] ?? null) : null,
  };
}

// ── Cover page content (tokens resolved) ─────────────────────────────────────

export interface ResolvedLanding {
  readonly headlineRef: string;
  readonly headlineTail: string | null;
  readonly sourceLine: string | null;
  readonly facts: readonly { readonly value: string; readonly label: string }[];
  readonly explainer: { readonly heading: string; readonly text: string } | null;
  readonly explorerChapter: string;
}

export const DEFAULT_HEADLINE_REF = "c4.weighted_share";
export const DEFAULT_EXPLORER_CHAPTER = "08_dein_zug";

/** The landing block of a manifest with every number token resolved from the frozen figure JSON. */
export async function resolveLanding(
  bookSlug: string,
  manifest: BookManifest,
  locale: Locale,
): Promise<ResolvedLanding> {
  const landing = manifest.landing;
  const figures = await loadBookFigures(bookSlug);
  const fill = (text: string, where: string): string => {
    try {
      return resolveTokens(text, figures.lookup, locale);
    } catch (error) {
      if (error instanceof TokenError) throw new TokenError(`${bookSlug} landing ${where}: ${error.message}`);
      throw error;
    }
  };
  return {
    headlineRef: landing?.headlineRef ?? DEFAULT_HEADLINE_REF,
    headlineTail: landing?.headlineTail ? fill(landing.headlineTail, "headlineTail") : null,
    sourceLine: landing?.sourceLine ? fill(landing.sourceLine, "sourceLine") : null,
    facts: (landing?.facts ?? []).map((fact, i) => ({
      value: fill(fact.value, `facts[${i}].value`),
      label: fill(fact.label, `facts[${i}].label`),
    })),
    explainer: landing?.explainer
      ? { heading: fill(landing.explainer.heading, "explainer.heading"), text: fill(landing.explainer.text, "explainer.text") }
      : null,
    explorerChapter: landing?.explorerChapter ?? DEFAULT_EXPLORER_CHAPTER,
  };
}

/** The chapter list with the band numbers resolved, for the cover's contents list. */
export async function getBookChapterListResolved(
  bookSlug: string,
  locale: Locale,
): Promise<BookChapterMeta[]> {
  const chapters = await getBookChapterList(bookSlug, locale);
  return Promise.all(
    chapters.map(async (chapter) => ({ ...chapter, band: await resolveChapterBand(bookSlug, chapter.slug, locale, chapter.band) })),
  );
}
