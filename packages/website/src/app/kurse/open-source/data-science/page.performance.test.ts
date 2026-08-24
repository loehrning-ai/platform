import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("data-science landing performance", () => {
  it("uses the landing shell without loading the checkpoint studio", () => {
    const routeSource = readFileSync(join(__dirname, "page.tsx"), "utf8");
    const shellSource = readFileSync(
      join(__dirname, "landing-reader-shell.tsx"),
      "utf8",
    );

    expect(routeSource).toContain("DataScienceLandingReaderShell");
    expect(routeSource).not.toContain("@/components/data-science/reader-shell");
    expect(shellSource).not.toContain("course-project-studio");
    expect(shellSource).not.toContain("lazy(async () =>");
  });
});
