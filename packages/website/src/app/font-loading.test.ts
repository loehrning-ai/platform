import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("global font loading contract", () => {
  it("does not preload every Loehrning Sans weight on every route", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );

    expect(source).toMatch(/display:\s*"optional"/);
    expect(source).toMatch(/preload:\s*false/);
  });
});
