import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");
const BOUNDED_SVG_ANNOTATIONS = new Set([
  "components/data-infrastructure/widgets/backfill-dag.tsx",
  "components/data-infrastructure/widgets/cdc-flow.tsx",
  "components/ki-readiness/radar-chart.tsx",
]);
const SUB_TWELVE_SIZE =
  /\btext-\[(?:[0-9](?:\.\d+)?|1[01](?:\.\d+)?)px\]|\btext-\[0\.(?:[0-6]\d*|7[0-4]?)rem\]/;

function productionTsx(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : productionTsx(absolute);
    }
    return entry.name.endsWith(".tsx") &&
      !/\.(?:test|spec)\.tsx$/.test(entry.name)
      ? [absolute]
      : [];
  });
}

describe("production interface typography floor", () => {
  it.each(productionTsx(SRC))(
    "keeps visible UI text at 12px or larger in %s",
    (absolute) => {
      const path = relative(SRC, absolute);
      let source = readFileSync(absolute, "utf8");

      if (BOUNDED_SVG_ANNOTATIONS.has(path)) {
        source = source.replace(/<text\b[\s\S]*?<\/text>/g, "");
      }

      expect(source).not.toMatch(SUB_TWELVE_SIZE);
    },
  );
});
