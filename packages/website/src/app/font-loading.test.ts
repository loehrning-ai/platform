import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("global font loading contract", () => {
  it("keeps brand and monospace fonts off every route's preload path", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    const globalStyles = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    expect(source).toMatch(/display:\s*"optional"/);
    expect(source).toMatch(/preload:\s*false/);
    expect(source).not.toContain('from "geist/font/mono"');
    expect(source).not.toContain("GeistMono.variable");
    expect(globalStyles).toMatch(
      /--font-geist-mono:\s*ui-monospace,[\s\S]*?"Courier New", monospace;/,
    );
  });
});
