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
    // The route must reach the curriculum through the data-only module. Going
    // via the chapter loader map put all 26 chapter server components — and the
    // 34 client simulators they import — into this page's eager client entry,
    // measured at ~63 KB gzipped for a page that renders none of them.
    expect(routeSource).toContain("localized-core-meta");
    expect(routeSource).toContain("getDsOverviewComponent");
    expect(routeSource).not.toContain("localized-core-content");
    expect(routeSource).not.toContain("getDsLocaleRegistry");
    expect(routeSource).not.toContain("getDsChapterComponent");
    expect(routeSource).toContain("prefetch={false}");
    expect(source.match(/prefetch=\{false\}/g)).toHaveLength(2);
  });

  it("keeps both locale overviews measured and limited to one start action", () => {
    const englishSource = readFileSync(
      resolve(
        process.cwd(),
        "src/components/data-science/chapters/ch-overview.tsx",
      ),
      "utf8",
    );
    const germanSource = readFileSync(
      resolve(
        process.cwd(),
        "src/components/data-science/chapters/de/ch-overview.tsx",
      ),
      "utf8",
    );

    for (const source of [englishSource, germanSource]) {
      expect(source.match(/btn btn-primary ov-cta-btn/g)).toHaveLength(1);
      expect(source).not.toContain('className="ov-cta-band"');
    }

    expect(englishSource).not.toMatch(
      /the honest number|the only proof|without flailing|like a pro|No proprietary gatekeeping|not a wall of text/,
    );
  });
});
