import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ACTIVE_ENGINE_FILES = [
  "chat-demo.tsx",
  "compliance-demo.tsx",
  "roi-demo.tsx",
  "doc-demo.tsx",
  "agent-demo.tsx",
  "workflow-demo.tsx",
  "excel-demo.tsx",
  "word-demo.tsx",
  "finetune-demo.tsx",
] as const;

const INTENTIONALLY_INACTIVE_ENGINE_FILES = [
  "logistics-demo.tsx",
  "maturity-demo.tsx",
  "observ-demo.tsx",
] as const;

const TYPOGRAPHY_SURFACES = [...ACTIVE_ENGINE_FILES, "_shared.tsx"] as const;

function source(file: (typeof TYPOGRAPHY_SURFACES)[number]): string {
  return readFileSync(join(__dirname, file), "utf8");
}

const CONTROL_TAGS = new Set(["button", "input", "select", "textarea"]);
const TARGET_HEIGHT =
  /\b(?:min-h-11|h-11|h-12|min-h-12|min-h-\[(?:4[4-9]|[5-9]\d|\d{3,})px\]|minHeight\s*:\s*(?:4[4-9]|[5-9]\d|\d{3,}))(?![\w-])/;

function undersizedControls(file: (typeof ACTIVE_ENGINE_FILES)[number]) {
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
      if (
        CONTROL_TAGS.has(tag) &&
        !TARGET_HEIGHT.test(node.attributes.getText(sourceFile))
      ) {
        const line =
          sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
            .line + 1;
        failures.push(`${tag} at line ${line}`);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return failures;
}

describe("active AI-native demo typography floor", () => {
  it("covers exactly the nine gallery engines and excludes intentionally inactive alternatives", () => {
    expect(ACTIVE_ENGINE_FILES).toHaveLength(9);
    expect(ACTIVE_ENGINE_FILES).toEqual([
      "chat-demo.tsx",
      "compliance-demo.tsx",
      "roi-demo.tsx",
      "doc-demo.tsx",
      "agent-demo.tsx",
      "workflow-demo.tsx",
      "excel-demo.tsx",
      "word-demo.tsx",
      "finetune-demo.tsx",
    ]);

    for (const inactive of INTENTIONALLY_INACTIVE_ENGINE_FILES) {
      expect(ACTIVE_ENGINE_FILES).not.toContain(inactive);
    }
  });

  it.each(TYPOGRAPHY_SURFACES)(
    "keeps every explicit visible type size at 12px or larger in %s",
    (file) => {
      const contents = source(file);

      expect(contents).not.toMatch(
        /\btext-\[(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\]/,
      );
      expect(contents).not.toMatch(
        /\bfontSize\s*=\s*["'](?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)["']/,
      );
      expect(contents).not.toMatch(
        /\bfontSize\s*:\s*(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)\b/,
      );
    },
  );

  it.each(ACTIVE_ENGINE_FILES)(
    "keeps every learner control at least 44px high in %s",
    (file) => {
      expect(undersizedControls(file)).toEqual([]);
    },
  );
});
