import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

type JsonValue =
  null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type MarkdownNode = Root | RootContent;

const BOOK_ROOT = "content/books/ki-landschaft";
const CHAPTER_FILES = [
  "06_eu_ki_verordnung.md",
  "07_schnellstart.md",
  "08_fahrplan.md",
  "09_ausblick.md",
  "10_anhang.md",
] as const;

const GERMAN_TERM_ALLOWLIST: Readonly<Record<string, readonly string[]>> = {
  "07_schnellstart.md": ["DPA/AVV"],
  "08_fahrplan.md": ["Förderdatenbank des Bundes"],
  "10_anhang.md": [
    "Digitalisierung-der-Wirtschaft-Unternehmen-beschaeftigen-sich-mit-KI",
  ],
};

const GERMAN_PROSE_PATTERN =
  /\b(?:aber|auch|auf|aus|bei|das|dass|den|der|des|die|durch|eine|einem|einen|einer|eines|für|gegen|ihre?|ist|kann|keine?|mit|nicht|noch|oder|ohne|prüfe|prüfen|sind|über|und|vom|von|werden|wie|wird|zur|zum)\b/giu;

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
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

function collectLinks(root: Root): readonly { label: string; url: string }[] {
  const links: { label: string; url: string }[] = [];
  walk(root, (node) => {
    if (node.type === "link") {
      links.push({ label: nodeText(node), url: node.url });
    }
  });
  return links;
}

function collectLinkTargets(root: Root): readonly string[] {
  return collectLinks(root).map((link) => link.url);
}

function normalizeLocalizedLinkTarget(url: string): string {
  return url.replace(
    /\/legal-content\/(?:DE|EN)\/TXT\//u,
    "/legal-content/{locale}/TXT/",
  );
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

function germanLeaks(text: string, allowlist: readonly string[]): string[] {
  let checkedText = text;
  for (const allowedTerm of allowlist) {
    checkedText = checkedText.replaceAll(allowedTerm, "<allowed-term>");
  }

  return [...checkedText.matchAll(GERMAN_PROSE_PATTERN)].map(
    (match) => match[0],
  );
}

describe("AI in German SMEs English source bundle, chapters 6 to 10", () => {
  for (const filename of CHAPTER_FILES) {
    it(`${filename} preserves Markdown structure, headings, tables, link targets, anchors, and numerics`, () => {
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
      expect(
        collectLinkTargets(translation).map(normalizeLocalizedLinkTarget),
      ).toEqual(collectLinkTargets(source).map(normalizeLocalizedLinkTarget));
      expect(
        collectLinks(translation).every((link) => link.label.length > 0),
      ).toBe(true);
      expect(collectExplicitAnchors(translationText)).toEqual(
        collectExplicitAnchors(sourceText),
      );
      expect(collectNumerics(translation)).toEqual(collectNumerics(source));
      expect(translationText).not.toBe(sourceText);
      expect(translationText).not.toContain("/legal-content/DE/TXT/");
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
