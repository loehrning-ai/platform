import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");

function read(relativePath: string): string {
  return readFileSync(join(SRC, relativePath), "utf8");
}

describe("website motion policy", () => {
  it("keeps the global reduced-motion fallback static", () => {
    const globalCss = read("app/globals.css");
    expect(globalCss).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(globalCss).toMatch(/animation-iteration-count:\s*1\s*!important/);
    expect(globalCss).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });
});
