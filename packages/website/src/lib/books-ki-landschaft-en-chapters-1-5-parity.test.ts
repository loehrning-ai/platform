import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

type MarkdownNode = Root | RootContent;

const BOOK_ROOT = "content/books/ki-landschaft";
const CHAPTER_FILES = [
  "01_eisberg.md",
  "02_methodik.md",
  "03_reifegrad_ueberblick.md",
  "04_bundesland.md",
  "05_branchen.md",
] as const;

const MANIFEST_COPY_KEYS = new Set([
  "adaptationNote",
  "publicationReason",
  "title",
]);

const GERMAN_TERM_ALLOWLIST: Readonly<Record<string, readonly string[]>> = {
  "03_reifegrad_ueberblick.md": ["DPA/AVV"],
  "04_bundesland.md": [
    "Förderdatenbank des Bundes",
    "Mittelstand-Digital-Zentren",
  ],
};

const GERMAN_PROSE_PATTERN =
  /\b(?:aber|auch|auf|aus|bei|das|dass|den|der|des|die|durch|eine|einem|einen|einer|eines|für|gegen|ihre?|ist|kann|keine?|mit|nicht|noch|oder|ohne|prüfe|prüfen|sind|über|und|vom|von|werden|wie|wird|zur|zum)\b/giu;

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
  if ("checked" in node) {
    structure.checked = node.checked ?? null;
  }
  if ("align" in node) {
    structure.align =
      node.align?.map((alignment) => alignment ?? null) ?? null;
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

function collectLinkTargets(root: Root): string[] {
  const targets: string[] = [];
  walk(root, (node) => {
    if (node.type === "link") {
      targets.push(node.url);
    }
  });
  return targets;
}

function collectExternalSourceLinks(
  root: Root,
): readonly { label: string; url: string }[] {
  const links: { label: string; url: string }[] = [];
  walk(root, (node) => {
    if (node.type === "link" && /^https:\/\//u.test(node.url)) {
      links.push({ label: nodeText(node), url: node.url });
    }
  });
  return links;
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

function collectExplicitAnchors(markdown: string): string[] {
  return [
    ...(markdown.match(/href=["']#[^"']+["']/gu) ?? []),
    ...(markdown.match(/id=["'][^"']+["']/gu) ?? []),
    ...(markdown.match(/\]\(#[^)]+\)/gu) ?? []),
  ];
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
  let checkedText = text;
  for (const allowedTerm of allowlist) {
    checkedText = checkedText.replaceAll(allowedTerm, "<allowed-term>");
  }

  return [...checkedText.matchAll(GERMAN_PROSE_PATTERN)].map(
    (match) => match[0],
  );
}

describe("AI in German SMEs English source bundle, chapters 1 to 5", () => {
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

  for (const filename of CHAPTER_FILES) {
    it(`${filename} preserves Markdown structure, headings, tables, links, source labels, anchors, and numerics`, () => {
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
      expect(collectExternalSourceLinks(translation)).toEqual(
        collectExternalSourceLinks(source),
      );
      expect(collectExplicitAnchors(translationText)).toEqual(
        collectExplicitAnchors(sourceText),
      );
      expect(collectNumerics(translation)).toEqual(collectNumerics(source));
      expect(translationText).not.toBe(sourceText);
    });

    it(`${filename} contains English prose and content-lint-safe punctuation`, () => {
      const translation = read(`${BOOK_ROOT}/en/${filename}`);

      expect(
        germanLeaks(translation, GERMAN_TERM_ALLOWLIST[filename] ?? []),
      ).toEqual([]);
      expect(translation).not.toMatch(/[—–]/u);
    });
  }
});
