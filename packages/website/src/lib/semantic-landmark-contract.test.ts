import { readFileSync, readdirSync } from "node:fs";
import { relative, join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");

function productionTsx(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionTsx(path);
    return entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")
      ? [path]
      : [];
  });
}

describe("semantic landmark contract", () => {
  it("keeps the root layout as the sole main landmark owner", () => {
    const owners = productionTsx(SRC).flatMap((path) => {
      const openingTags = readFileSync(path, "utf8")
        .split("\n")
        .filter((line) => line.trimStart().startsWith("<main"));
      return openingTags.map(() => relative(SRC, path));
    });

    expect(owners).toEqual(["app/layout.tsx"]);
  });
});
