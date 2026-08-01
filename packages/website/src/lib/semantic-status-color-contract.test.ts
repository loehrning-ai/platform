import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = join(process.cwd(), "src");
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);
const ARBITRARY_RED_TEXT = /\btext-red-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g;

function productionSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return productionSourceFiles(path);
    }

    const extension = entry.name.slice(entry.name.lastIndexOf("."));
    if (!SOURCE_EXTENSIONS.has(extension) || /\.test\.[^.]+$/.test(entry.name)) {
      return [];
    }
    return [path];
  });
}

describe("semantic status color contract", () => {
  it("uses the contrast-tested destructive token instead of arbitrary red text utilities", () => {
    const violations = productionSourceFiles(SOURCE_ROOT).flatMap((path) => {
      const matches = readFileSync(path, "utf8").match(ARBITRARY_RED_TEXT) ?? [];
      return matches.map((utility) => `${relative(SOURCE_ROOT, path)}: ${utility}`);
    });

    expect(violations).toEqual([]);
  });
});
