import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const REGISTRY_FILE = "demo-component-registry.ts";
const CONTROL_TAGS = new Set([
  "button",
  "input",
  "select",
  "textarea",
  "a",
  "Link",
]);
const TAILWIND_TARGET_FLOOR =
  /\b(?:min-h-11|h-11|h-12|min-h-12|min-h-\[(?:4[4-9]|[5-9]\d|\d{3,})px\]|min-h-\[(?:2\.(?:7[5-9]|[89]\d)|[3-9](?:\.\d+)?)rem\])(?![\w-])/;
const INLINE_TARGET_FLOOR =
  /\bminHeight\s*:\s*(?:(?:4[4-9]|[5-9]\d|\d{3,})|["'](?:4[4-9]|[5-9]\d|\d{3,})px["'])\b/;

function source(file: string): string {
  return readFileSync(join(__dirname, file), "utf8");
}

function stringPropertyName(name: ts.PropertyName): string | undefined {
  return ts.isIdentifier(name) || ts.isStringLiteral(name)
    ? name.text
    : undefined;
}

function registeredSlugs(): string[] {
  const contents = source(REGISTRY_FILE);
  const sourceFile = ts.createSourceFile(
    REGISTRY_FILE,
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const slugs: string[] = [];

  function visit(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "demoComponents" &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (ts.isPropertyAssignment(property)) {
          const slug = stringPropertyName(property.name);
          if (slug) slugs.push(slug);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return slugs.sort();
}

function importedEngineFiles(): string[] {
  const registry = source(REGISTRY_FILE);
  const loaderFiles = [
    ...registry.matchAll(/from\s+["']\.\/([^"']+-loader)["']/g),
  ].map((match) => `${match[1]}.tsx`);
  const importSources = [registry, ...loaderFiles.map(source)];

  return [
    ...new Set(
      importSources.flatMap((contents) =>
        [...contents.matchAll(/import\(["']\.\/([^"']+-demo)["']\)/g)].map(
          (match) => `${match[1]}.tsx`,
        ),
      ),
    ),
  ].sort();
}

function stripHiddenSvg(contents: string): string {
  return contents.replace(
    /<svg\b(?=[^>]*\baria-hidden(?:\s*=|\s|>))[^>]*>[\s\S]*?<\/svg>/g,
    "",
  );
}

function undersizedControls(file: string): string[] {
  const contents = source(file);
  const sourceFile = ts.createSourceFile(
    file,
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const failures: string[] = [];

  function visit(node: ts.Node): void {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sourceFile);
      if (CONTROL_TAGS.has(tag)) {
        const attributes = node.attributes.getText(sourceFile);
        const isHiddenInput =
          tag === "input" && /\btype=["']hidden["']/.test(attributes);

        if (
          !isHiddenInput &&
          !TAILWIND_TARGET_FLOOR.test(attributes) &&
          !INLINE_TARGET_FLOOR.test(attributes)
        ) {
          const line =
            sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
              .line + 1;
          failures.push(`${tag} at line ${line}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return failures;
}

const ACTIVE_ENGINE_FILES = importedEngineFiles();

describe("active public demo interface floor", () => {
  it("derives one real engine from every public registry entry", () => {
    expect(
      ACTIVE_ENGINE_FILES.map((file) => file.replace(/-demo\.tsx$/, "")),
    ).toEqual(registeredSlugs());
  });

  it.each(ACTIVE_ENGINE_FILES)(
    "keeps visible type at 12px or larger in %s",
    (file) => {
      const contents = stripHiddenSvg(source(file));

      expect(contents).not.toMatch(
        /\bfontSize\s*:\s*(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)\b|\bfont-size\s*:\s*(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\b|\btext-\[(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\]/,
      );
      expect(contents).not.toMatch(
        /\bfontSize\s*:\s*["']clamp\((?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px/,
      );
    },
  );

  it.each(ACTIVE_ENGINE_FILES)(
    "gives every learner-operated control a 44px minimum height in %s",
    (file) => {
      expect(undersizedControls(file)).toEqual([]);
    },
  );

  it("keeps the prompt scanner textarea keyboard focus visible", () => {
    expect(source("prompt-scanner-demo.tsx")).not.toContain('outline: "none"');
  });
});
