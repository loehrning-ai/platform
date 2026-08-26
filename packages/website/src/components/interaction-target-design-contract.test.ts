import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const STANDALONE_FILES = [
  "ai-native/demos/chat-demo.tsx",
  "course-projects/course-project-studio.tsx",
  "course-projects/lesson-mission-control.tsx",
  "widgets/claude/_run-console.tsx",
  "widgets/claude/prompt-compare.tsx",
  "widgets/claude/rewrite-arena.tsx",
  "widgets/tier-a/matrix-grid.tsx",
  "widgets/tier-a/self-rate.tsx",
  "imported-courses/claude/hero-transform.tsx",
  "imported-courses/claude/hero-orrery.tsx",
  "open-source/command-copy-button.tsx",
] as const;

const EXPECTED_CODEX_FILES = [
  "codex/bespoke/l01-three-body-contract.tsx",
  "codex/bespoke/l02-sandbox-box.tsx",
  "codex/bespoke/l03-agents-crystal.tsx",
  "codex/bespoke/l04-spec-surgeon.tsx",
  "codex/bespoke/l05-scope-slider.tsx",
  "codex/bespoke/l06-done-checklist.tsx",
  "codex/bespoke/l07-pr-xray.tsx",
  "codex/bespoke/l08-decision-branch.tsx",
  "codex/bespoke/l09-toolbelt-builder.tsx",
  "codex/bespoke/l10-git-graph-orchestrator.tsx",
  "codex/bespoke/l11-pattern-cards-lab.tsx",
  "codex/bespoke/l12-daily-loop.tsx",
] as const;

const EXPECTED_DATA_INFRASTRUCTURE_FILES = [
  "data-infrastructure/widgets/backfill-dag.tsx",
  "data-infrastructure/widgets/bloom-filter.tsx",
  "data-infrastructure/widgets/cap-triangle.tsx",
  "data-infrastructure/widgets/cdc-flow.tsx",
  "data-infrastructure/widgets/interview-move.tsx",
  "data-infrastructure/widgets/kafka-topic.tsx",
  "data-infrastructure/widgets/partition-sim.tsx",
  "data-infrastructure/widgets/row-column.tsx",
  "data-infrastructure/widgets/sla-dash.tsx",
  "data-infrastructure/widgets/snapshot-timeline.tsx",
  "data-infrastructure/widgets/stack-flow.tsx",
  "data-infrastructure/widgets/watermark.tsx",
] as const;

const CONTROL_TAGS = new Set([
  "button",
  "input",
  "select",
  "summary",
  "textarea",
]);
const TARGET_HEIGHT =
  /\b(?:min-h-11|h-(?:1[1-9]|[2-9]\d)|min-h-\[(?:4[4-9]|[5-9]\d|\d{3,})px\]|min-h-\[(?:2\.(?:7[5-9]|[89]\d)|[3-9](?:\.\d+)?)rem\])(?![\w-])/;

function productionFiles(directory: string, prefix: string): string[] {
  return readdirSync(join(__dirname, directory), { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".tsx") &&
        !entry.name.endsWith(".test.tsx"),
    )
    .map((entry) => `${prefix}/${entry.name}`)
    .toSorted();
}

const CODEX_FILES = productionFiles("codex/bespoke", "codex/bespoke").filter(
  (file) => /\/l\d{2}-/.test(file),
);
const DATA_INFRASTRUCTURE_FILES = productionFiles(
  "data-infrastructure/widgets",
  "data-infrastructure/widgets",
);
const AUDITED_FILES = [
  ...STANDALONE_FILES,
  ...CODEX_FILES,
  ...DATA_INFRASTRUCTURE_FILES,
] as const;

function classSource(
  node: ts.JsxOpeningLikeElement,
  sourceFile: ts.SourceFile,
): string {
  const attribute = node.attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) &&
      property.name.getText(sourceFile) === "className",
  );
  return attribute?.initializer?.getText(sourceFile) ?? "";
}

function wrappingLabelClass(node: ts.Node, sourceFile: ts.SourceFile): string {
  let parent: ts.Node | undefined = node.parent;
  while (parent) {
    if (
      ts.isJsxElement(parent) &&
      parent.openingElement.tagName.getText(sourceFile) === "label"
    ) {
      return classSource(parent.openingElement, sourceFile);
    }
    parent = parent.parent;
  }
  return "";
}

function undersizedControls(file: string): string[] {
  const contents = readFileSync(join(__dirname, file), "utf8");
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
        const targetSource = `${classSource(node, sourceFile)} ${wrappingLabelClass(node, sourceFile)}`;
        if (!TARGET_HEIGHT.test(targetSource)) {
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

describe("learner interaction target design contract", () => {
  it("derives the complete 12-lesson Codex control set", () => {
    expect(CODEX_FILES).toEqual(EXPECTED_CODEX_FILES);
  });

  it("derives the complete Data Infrastructure widget control set", () => {
    expect(DATA_INFRASTRUCTURE_FILES).toEqual(
      EXPECTED_DATA_INFRASTRUCTURE_FILES,
    );
  });

  it("locks the bounded audit to all 35 production learner interaction files", () => {
    expect(AUDITED_FILES).toHaveLength(35);
  });

  it.each(AUDITED_FILES)(
    "gives every learner control a 44px minimum target in %s",
    (file) => {
      expect(undersizedControls(file)).toEqual([]);
    },
  );

  it("keeps compact independent controls at least 44px wide", () => {
    for (const file of [
      "widgets/claude/_run-console.tsx",
      "widgets/tier-a/matrix-grid.tsx",
      "imported-courses/claude/hero-transform.tsx",
    ]) {
      expect(readFileSync(join(__dirname, file), "utf8"), file).toContain(
        "min-w-11",
      );
    }
  });
});
