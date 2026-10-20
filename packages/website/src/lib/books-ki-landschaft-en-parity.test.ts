import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

/**
 * Parity of the English source bundle of "ki-landschaft" with the German
 * original. Both languages hold the same Markdown structure (headings, lists,
 * tables, links, figure markers, number tokens, numerals in the same order),
 * so a chapter cannot drift in one language only. Wording is free.
 */

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

type MarkdownNode = Root | RootContent;

const BOOK_ROOT = "content/books/ki-landschaft";

/** Manifest strings that are translated copy: titles, notes, the band claims and the cover texts. Numerals and ids must stay equal. */
const MANIFEST_COPY_KEYS = new Set([
  "adaptationNote",
  "publicationReason",
  "title",
  "claim",
  "numeral",
  "headlineTail",
  "sourceLine",
  "label",
  "heading",
  "text",
]);

/** German terms that may stay in the English text (proper names and quoted sources). */
const GERMAN_TERM_ALLOWLIST: Readonly<Record<string, readonly string[]>> = {};

const GERMAN_PROSE_PATTERN =
  /\b(?:aber|auch|auf|aus|bei|das|dass|den|der|des|die|durch|eine|einem|einen|einer|eines|für|gegen|ihre?|ist|kann|keine?|mit|nicht|noch|oder|ohne|prüfe|prüfen|sind|über|und|vom|von|werden|wie|wird|zur|zum)\b/giu;

const TOKEN_PATTERN = /\{\{[^}]*\}\}/gu;
const DIRECTIVE_PATTERN = /^::[a-z][a-z-]*\{[^{}\n]*\}$/gmu;

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function loadJson(relativePath: string): JsonValue {
  return JSON.parse(read(relativePath)) as JsonValue;
}

function parseMarkdown(markdown: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(markdown);
}

function walk(node: MarkdownNode, visit: (node: MarkdownNode) => void): void {
  visit(node);
  if ("children" in node) {
    node.children.forEach((child) => walk(child, visit));
  }
}

function markdownStructure(node: MarkdownNode): JsonValue {
  const structure: { [key: string]: JsonValue } = { type: node.type };

  if ("depth" in node && typeof node.depth === "number") {
    structure.depth = node.depth;
  }
  if ("ordered" in node) {
    structure.ordered = node.ordered ?? null;
  }
  if ("start" in node) {
    structure.start = node.start ?? null;
  }
  if ("align" in node) {
    structure.align = node.align?.map((alignment) => alignment ?? null) ?? null;
  }
  if ("children" in node) {
    structure.children = node.children.map(markdownStructure);
  }

  return structure;
}

function nodeText(node: MarkdownNode): string {
  if ("value" in node && typeof node.value === "string") {
    return node.value;
  }
  if ("children" in node) {
    return node.children.map(nodeText).join("");
  }
  return "";
}

/** The EUR-Lex pages differ only in the language segment of the path. */
function normalizeLocalizedLinkTarget(url: string): string {
  return url.replace(
    /\/legal-content\/(?:DE|EN)\/TXT\//u,
    "/legal-content/{locale}/TXT/",
  );
}

function collectLinkTargets(root: Root): string[] {
  const targets: string[] = [];
  walk(root, (node) => {
    if (node.type === "link") {
      targets.push(normalizeLocalizedLinkTarget(node.url));
    }
  });
  return targets;
}

function collectLinkLabels(root: Root): string[] {
  const labels: string[] = [];
  walk(root, (node) => {
    if (node.type === "link") {
      labels.push(nodeText(node));
    }
  });
  return labels;
}

function collectHeadingDepths(root: Root): number[] {
  const depths: number[] = [];
  walk(root, (node) => {
    if (node.type === "heading") {
      depths.push(node.depth);
    }
  });
  return depths;
}

function collectTableDimensions(root: Root): readonly number[][] {
  const dimensions: number[][] = [];
  walk(root, (node) => {
    if (node.type === "table") {
      dimensions.push(node.children.map((row) => row.children.length));
    }
  });
  return dimensions;
}

/** Numerals in text, with the decimal comma and the thousands dot of German turned into one form. */
function collectNumerics(root: Root): string[] {
  const numerics: string[] = [];
  walk(root, (node) => {
    if (node.type === "text" || node.type === "inlineCode") {
      numerics.push(
        ...(node.value.match(/\d+(?:[.,]\d+)*/gu) ?? []).map((value) =>
          value.replaceAll(",", "."),
        ),
      );
    }
  });
  return numerics;
}

function collectTokens(markdown: string): string[] {
  return markdown.match(TOKEN_PATTERN) ?? [];
}

/** The words of a ticker directive (tail="...") are translated copy, the rest of the line must match. */
function collectDirectives(markdown: string): string[] {
  return (markdown.match(DIRECTIVE_PATTERN) ?? []).map((line) => line.replace(/tail="[^"]*"/u, 'tail=""'));
}

function collectTickerTails(markdown: string): string[] {
  return [...markdown.matchAll(/^::ticker\{[^{}\n]*?tail="([^"]*)"/gmu)].map((m) => m[1] ?? "");
}

function maskManifestCopy(value: JsonValue, key?: string): JsonValue {
  if (key && MANIFEST_COPY_KEYS.has(key)) {
    return "<translated-copy>";
  }
  if (Array.isArray(value)) {
    return value.map((child) => maskManifestCopy(child));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, child]) => [
        entryKey,
        maskManifestCopy(child, entryKey),
      ]),
    );
  }
  return value;
}

function collectManifestCopy(
  value: JsonValue,
  key?: string,
  result: string[] = [],
): string[] {
  if (key && MANIFEST_COPY_KEYS.has(key) && typeof value === "string") {
    result.push(value);
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((child) => collectManifestCopy(child, undefined, result));
  } else if (value !== null && typeof value === "object") {
    Object.entries(value).forEach(([entryKey, child]) =>
      collectManifestCopy(child, entryKey, result),
    );
  }
  return result;
}

function germanLeaks(text: string, allowlist: readonly string[]): string[] {
  // Link targets are addresses and may hold German words; only the prose counts.
  let checkedText = text.replace(/\]\([^)\s]*\)/gu, "]");
  for (const allowedTerm of allowlist) {
    checkedText = checkedText.replaceAll(allowedTerm, "<allowed-term>");
  }

  return [...checkedText.matchAll(GERMAN_PROSE_PATTERN)].map(
    (match) => match[0],
  );
}

const germanManifest = loadJson(`${BOOK_ROOT}/manifest.json`) as {
  chapters: Array<{ sourceFile: string }>;
};
const CHAPTER_FILES = germanManifest.chapters.map(
  (chapter) => chapter.sourceFile,
);

describe("English source bundle of the data book matches the German original", () => {
  it("preserves manifest structure, slugs, filenames, dates, and machine metadata", () => {
    const source = loadJson(`${BOOK_ROOT}/manifest.json`);
    const translation = loadJson(`${BOOK_ROOT}/en/manifest.json`);

    expect(maskManifestCopy(translation)).toEqual(maskManifestCopy(source));
    expect(translation).not.toEqual(source);
  });

  it("contains English manifest copy without unapproved German prose", () => {
    const manifestCopy = collectManifestCopy(
      loadJson(`${BOOK_ROOT}/en/manifest.json`),
    ).join("\n");

    expect(germanLeaks(manifestCopy, [])).toEqual([]);
  });

  it("keeps the number tokens of every band, cover fact and cover text equal in both languages", () => {
    const tokensOf = (value: JsonValue, key?: string, out: string[] = []): string[] => {
      if (typeof value === "string") {
        if (key && MANIFEST_COPY_KEYS.has(key)) out.push(...(value.match(TOKEN_PATTERN) ?? []), "|");
      } else if (Array.isArray(value)) {
        value.forEach((child) => tokensOf(child, undefined, out));
      } else if (value !== null && typeof value === "object") {
        Object.entries(value).forEach(([k, child]) => tokensOf(child, k, out));
      }
      return out;
    };
    expect(tokensOf(loadJson(`${BOOK_ROOT}/en/manifest.json`))).toEqual(tokensOf(loadJson(`${BOOK_ROOT}/manifest.json`)));
  });

  for (const filename of CHAPTER_FILES) {
    it(`${filename} preserves Markdown structure, headings, tables, links, figure markers, tokens, and numerics`, () => {
      const sourceText = read(`${BOOK_ROOT}/${filename}`);
      const translationText = read(`${BOOK_ROOT}/en/${filename}`);
      const source = parseMarkdown(sourceText);
      const translation = parseMarkdown(translationText);

      expect(markdownStructure(translation)).toEqual(markdownStructure(source));
      expect(collectHeadingDepths(translation)).toEqual(
        collectHeadingDepths(source),
      );
      expect(collectTableDimensions(translation)).toEqual(
        collectTableDimensions(source),
      );
      expect(collectLinkTargets(translation)).toEqual(
        collectLinkTargets(source),
      );
      expect(
        collectLinkLabels(translation).every((label) => label.trim() !== ""),
      ).toBe(true);
      expect(collectDirectives(translationText)).toEqual(
        collectDirectives(sourceText),
      );
      expect(collectTokens(translationText)).toEqual(
        collectTokens(sourceText),
      );
      expect(collectNumerics(translation)).toEqual(collectNumerics(source));
      expect(translationText).not.toBe(sourceText);
    });

    it(`${filename} contains English prose and content-lint-safe punctuation`, () => {
      const translation = read(`${BOOK_ROOT}/en/${filename}`);

      expect(
        germanLeaks(translation, GERMAN_TERM_ALLOWLIST[filename] ?? []),
      ).toEqual([]);
      expect(germanLeaks(collectTickerTails(translation).join("\n"), [])).toEqual([]);
      expect(translation).not.toMatch(/[—–]/u);
    });
  }
});
