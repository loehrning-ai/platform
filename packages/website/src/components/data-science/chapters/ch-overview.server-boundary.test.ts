import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("data-science overview server boundary", () => {
  it("keeps the static curriculum outside the client bundle", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/components/data-science/chapters/ch-overview.tsx",
      ),
      "utf8",
    );

    expect(source.trimStart()).not.toMatch(/^["']use client["'];/);
    expect(source).toContain("<LazyFlowingPipeline />");

    const routeSource = readFileSync(
      resolve(process.cwd(), "src/app/kurse/open-source/data-science/page.tsx"),
      "utf8",
    );
    expect(routeSource).toContain("getDsLocaleRegistry");
    expect(routeSource).toContain(
      "const OverviewComponent = overview.component",
    );
    expect(routeSource).not.toContain("getDsChapterComponent");
    expect(routeSource).toContain("prefetch={false}");
    expect(source.match(/prefetch=\{false\}/g)).toHaveLength(5);
  });
});
