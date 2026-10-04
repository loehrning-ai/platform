import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * Design contract for the lesson-engine learning surface (the LessonFlow
 * reader, its module overview and the lab exercise widgets).
 *
 * This surface deliberately leaves the flat poster system: rounded 16-24px
 * sheets and soft layered depth are allowed here, through the named
 * `shadow-lab*` elevation tokens only. What stays non-negotiable is the
 * accessibility and motion floor shared with the rest of the site: 44px
 * targets, 12px minimum text, paper grounds, finite motion through the
 * scoped LazyMotion `m.*` components, and live regions for results.
 */

const ROOT = join(__dirname, "..");
const DIRECTORIES = ["lesson-engine", "widgets/lab"] as const;

function productionFiles(): readonly string[] {
  return DIRECTORIES.flatMap((directory) =>
    readdirSync(join(ROOT, directory))
      .filter((name) => name.endsWith(".tsx") && !name.endsWith(".test.tsx"))
      .map((name) => join(ROOT, directory, name)),
  );
}

const FILES = productionFiles();
const LAB_WIDGETS = FILES.filter(
  (file) => file.includes("widgets/lab/") && !/\/_lab\.tsx$/.test(file),
);
const read = (file: string) => readFileSync(file, "utf8");
const name = (file: string) => relative(ROOT, file);

const CONTROL_TAGS = new Set(["button", "input", "select", "summary", "textarea", "a", "Link"]);
const TARGET_SIZE =
  /\b(?:min-h-11|h-11|h-12|min-h-\[(?:4[4-9]|[5-9]\d|\d{3,})px\])(?![\w-])/;

/** Controls whose className (or the constant it references) lacks a 44px target. */
function undersizedControls(file: string): string[] {
  const contents = read(file);
  const source = ts.createSourceFile(file, contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const constants = new Map<string, string>();
  const failures: string[] = [];
  const collect = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      constants.set(node.name.text, node.initializer.getText(source));
    }
    ts.forEachChild(node, collect);
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      if (CONTROL_TAGS.has(tag)) {
        const attributes = node.attributes.properties.filter(ts.isJsxAttribute);
        const isHidden = attributes.some(
          (attribute) =>
            attribute.name.getText(source) === "type" &&
            attribute.initializer?.getText(source) === '"hidden"',
        );
        const className = attributes.find((attribute) => attribute.name.getText(source) === "className");
        let classes = className?.initializer?.getText(source) ?? "";
        const expression =
          className?.initializer && ts.isJsxExpression(className.initializer)
            ? className.initializer.expression
            : undefined;
        if (expression && ts.isIdentifier(expression)) {
          classes += constants.get(expression.text) ?? "";
        }
        // LabButton carries min-h-11 inside its own definition.
        if (!isHidden && !TARGET_SIZE.test(classes)) {
          failures.push(`${tag} at line ${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  collect(source);
  visit(source);
  return failures;
}

describe("lesson-engine design contract", () => {
  it("covers the reader, the overview and every lab widget", () => {
    expect(FILES.map(name)).toEqual(
      expect.arrayContaining([
        "lesson-engine/lesson-flow.tsx",
        "lesson-engine/lesson-checks.tsx",
        "lesson-engine/module-overview.tsx",
        "lesson-engine/progress-ring.tsx",
        "widgets/lab/_lab.tsx",
      ]),
    );
    expect(LAB_WIDGETS.map(name).sort()).toEqual([
      "widgets/lab/bucket-sort.tsx",
      "widgets/lab/calculator.tsx",
      "widgets/lab/claim-checker.tsx",
      "widgets/lab/decision-wizard.tsx",
      "widgets/lab/doc-builder.tsx",
      "widgets/lab/live-prompt-ab.tsx",
      "widgets/lab/pii-redactor.tsx",
      "widgets/lab/sequence-order.tsx",
      "widgets/lab/threshold-lab.tsx",
      "widgets/lab/timeline-check.tsx",
    ]);
  });

  it.each(FILES.map((file) => [name(file), file]))(
    "gives every learner control a 44px target in %s",
    (_, file) => {
      expect(undersizedControls(file)).toEqual([]);
    },
  );

  it.each(FILES.map((file) => [name(file), file]))(
    "keeps text at 12px or larger in %s",
    (_, file) => {
      expect(read(file)).not.toMatch(/\btext-\[(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\]/);
      expect(read(file)).not.toMatch(/\btext-\[0\.(?:[0-6]\d*|7[0-4]\d*)rem\]/);
    },
  );

  it.each(FILES.map((file) => [name(file), file]))(
    "uses finite motion through m.* only in %s",
    (_, file) => {
      const contents = read(file);
      expect(contents).not.toMatch(/\btransition-all\b/);
      expect(contents).not.toMatch(/\banimate-(?:pulse|bounce|spin|ping)\b/);
      expect(contents).not.toMatch(/repeat:\s*Infinity/);
      expect(contents).not.toMatch(/import\s*\{[^}]*\bmotion\b[^}]*\}\s*from\s*"framer-motion"/);
      expect(contents).not.toMatch(/<motion\./);
      expect(contents).not.toContain("setInterval(");
    },
  );

  it.each(FILES.map((file) => [name(file), file]))(
    "takes depth from the lab elevation tokens and stays on paper in %s",
    (_, file) => {
      const contents = read(file);
      expect(contents).not.toMatch(/\bshadow-\[/);
      expect(contents).not.toMatch(/\bshadow-(?:sm|md|lg|xl|2xl|inner)\b/);
      for (const match of contents.match(/\bshadow-[\w-]+/g) ?? []) {
        expect(["shadow-lab", "shadow-lab-sm", "shadow-lab-lg", "shadow-none"]).toContain(match);
      }
      expect(contents).not.toMatch(/\bbg-(?:black|foreground|graphit|stone-9\d\d|neutral-9\d\d|zinc-9\d\d)\b/);
    },
  );

  it.each(LAB_WIDGETS.map((file) => [name(file), file]))(
    "announces results through a live region in %s",
    (_, file) => {
      expect(read(file)).toMatch(/<LabLive\b|aria-live=/);
    },
  );

  it.each(LAB_WIDGETS.map((file) => [name(file), file]))(
    "reports completion to the reader in %s",
    (_, file) => {
      expect(read(file)).toContain("useLabCompletion(");
    },
  );

  it("tweens numbers only when the learner allows motion", () => {
    const primitives = read(join(ROOT, "widgets/lab/_lab.tsx"));
    expect(primitives).toContain("useReducedMotion()");
    expect(primitives).toMatch(/if \(reduce \|\|/);
  });

  it("defines the lab elevation tokens once, on paper colours", () => {
    const css = readFileSync(join(ROOT, "..", "app", "globals.css"), "utf8");
    expect(css).toMatch(/--shadow-lab-sm:/);
    expect(css).toMatch(/--shadow-lab:/);
    expect(css).toMatch(/--shadow-lab-lg:/);
    expect(css).toMatch(/--color-lab-accent:\s*#2747b5/);
  });
});
