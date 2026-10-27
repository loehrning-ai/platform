import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every lab widget of the lesson engine announces its result through a live
 * region and reports completion to the reader.
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

describe("lesson-engine lab widgets", () => {
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
      "widgets/lab/scenario-run.tsx",
      "widgets/lab/sequence-order.tsx",
      "widgets/lab/threshold-lab.tsx",
      "widgets/lab/timeline-check.tsx",
      "widgets/lab/triage-matrix.tsx",
    ]);
  });

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
});
