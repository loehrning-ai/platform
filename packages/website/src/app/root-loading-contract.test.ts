import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP_DIR = join(process.cwd(), "src", "app");

function findLoadingFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findLoadingFiles(path);
    return entry.name === "loading.tsx" ? [path] : [];
  });
}

describe("initial page rendering contract", () => {
  it("does not gate semantic page content behind JavaScript-replaced loading fallbacks", () => {
    expect(
      findLoadingFiles(APP_DIR).map((path) => path.slice(APP_DIR.length)),
    ).toEqual([]);
  });
});
