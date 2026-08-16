import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("data-science landing performance", () => {
  it("uses the intent-gated landing shell instead of the eager chapter shell", () => {
    const routeSource = readFileSync(join(__dirname, "page.tsx"), "utf8");
    const shellSource = readFileSync(
      join(__dirname, "landing-reader-shell.tsx"),
      "utf8",
    );

    expect(routeSource).toContain("DataScienceLandingReaderShell");
    expect(routeSource).not.toContain("@/components/data-science/reader-shell");
    expect(shellSource).toContain("lazy(async () =>");
    expect(shellSource).not.toMatch(
      /import\s*\{\s*CourseProjectStudio\s*\}\s*from/,
    );
  });
});
