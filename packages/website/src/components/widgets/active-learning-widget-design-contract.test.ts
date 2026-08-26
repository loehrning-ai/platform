import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ACTIVE_WIDGET_FILES = [
  "interactive-diagram.tsx",
  "claude/prompt-grader.tsx",
  "claude/fill-blank.tsx",
  "claude/prompt-library-shaper.tsx",
  "claude/claude-md-builder.tsx",
  "claude/socratic-tutor.tsx",
  "claude/tokenizer.tsx",
  "claude/agent-loop.tsx",
  "claude/prompt-sandbox.tsx",
  "tier-a/flashcards.tsx",
  "tier-a/task-spec.tsx",
  "tier-a/terminal-replay.tsx",
  "tier-a/slot-fill.tsx",
  "tier-a/plays.tsx",
  "tier-a/failure-tagger.tsx",
  "tier-a/drag-reorder.tsx",
  "tier-a/redaction-drill.tsx",
  "tier-a/quiz.tsx",
  "practice/prompt-orrery.tsx",
  "practice/prompt-transform.tsx",
  "practice/semantic-space.tsx",
] as const;

const CONTROL_TAGS = new Set([
  "button",
  "input",
  "select",
  "summary",
  "textarea",
]);
const TARGET_SIZE =
  /\b(?:min-h-11|h-11|h-12|min-h-\[(?:4[4-9]|[5-9]\d|\d{3,})px\]|min-h-\[(?:2\.(?:7[5-9]|[89]\d)|[3-9](?:\.\d+)?)rem\])(?![\w-])/;

function source(file: (typeof ACTIVE_WIDGET_FILES)[number]): string {
  return readFileSync(join(__dirname, file), "utf8");
}

function productionWidgetFiles(directory = __dirname): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionWidgetFiles(path);
    return entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")
      ? [path]
      : [];
  });
}

function undersizedControls(
  file: (typeof ACTIVE_WIDGET_FILES)[number],
): string[] {
  const contents = source(file);
  const sourceFile = ts.createSourceFile(
    file,
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const classConstants = new Map<string, string>();
  const failures: string[] = [];

  function visitConstants(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    ) {
      classConstants.set(node.name.text, node.initializer.getText(sourceFile));
    }
    ts.forEachChild(node, visitConstants);
  }

  function visitControls(node: ts.Node): void {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sourceFile);
      if (CONTROL_TAGS.has(tag)) {
        const classAttribute = node.attributes.properties.find(
          (property): property is ts.JsxAttribute =>
            ts.isJsxAttribute(property) &&
            property.name.getText(sourceFile) === "className",
        );
        const initializer = classAttribute?.initializer;
        let classes = initializer?.getText(sourceFile) ?? "";

        if (
          initializer &&
          ts.isJsxExpression(initializer) &&
          initializer.expression &&
          ts.isIdentifier(initializer.expression)
        ) {
          classes += classConstants.get(initializer.expression.text) ?? "";
        }

        if (!TARGET_SIZE.test(classes)) {
          const line =
            sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
              .line + 1;
          failures.push(`${tag} at line ${line}`);
        }
      }
    }
    ts.forEachChild(node, visitControls);
  }

  visitConstants(sourceFile);
  visitControls(sourceFile);
  return failures;
}

describe("active learning widget design contract", () => {
  it("covers the complete active widget audit set", () => {
    expect(ACTIVE_WIDGET_FILES).toHaveLength(21);
  });

  it.each(ACTIVE_WIDGET_FILES)(
    "keeps every explicit visible type size at 12px or larger in %s",
    (file) => {
      expect(source(file)).not.toMatch(
        /\btext-\[(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\]/,
      );
    },
  );

  it("keeps the complete production widget registry free of sub-12px text", () => {
    const failures = productionWidgetFiles().flatMap((path) => {
      const contents = readFileSync(path, "utf8");
      return /\btext-\[(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\]/.test(contents)
        ? [relative(__dirname, path)]
        : [];
    });

    expect(failures).toEqual([]);
  });

  it.each(ACTIVE_WIDGET_FILES)(
    "gives learner-operated controls a 44px minimum height in %s",
    (file) => {
      expect(undersizedControls(file)).toEqual([]);
    },
  );

  it("keeps compact icon and inline-token controls at least 44px wide", () => {
    expect(source("tier-a/drag-reorder.tsx")).toContain("min-w-11");
    expect(source("tier-a/redaction-drill.tsx")).toContain("min-w-11");
    expect(source("claude/claude-md-builder.tsx")).toContain("min-w-11");
  });
});
