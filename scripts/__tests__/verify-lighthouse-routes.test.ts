import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { CRAWL_CONTRACT } from "../../packages/website/src/lib/crawl/contract";
import {
  buildPublishedDynamicCandidates,
  verifyLighthouseRouteConfig,
} from "../verify-lighthouse-routes";

type Config = {
  ci: {
    collect: {
      startServerCommand: string;
      url: string[];
    };
    assert: {
      aggregationMethod: string;
    };
  };
};

async function fixture(): Promise<{
  config: Config;
  dynamicCandidates: Awaited<ReturnType<typeof buildPublishedDynamicCandidates>>;
}> {
  const config = JSON.parse(await readFile("lighthouserc.json", "utf8")) as Config;
  return { config, dynamicCandidates: await buildPublishedDynamicCandidates() };
}

describe("Lighthouse route contract", () => {
  it("builds fresh before the lockfile-owned LHCI binary runs", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(packageJson.devDependencies?.["@lhci/cli"]).toBe("0.15.1");
    expect(packageJson.scripts?.["lighthouse:local"]).toBe(
      "node packages/website/scripts/run-provider-free.mjs bun run build && bun run lighthouse:local:built",
    );
    expect(packageJson.scripts?.["lighthouse:local:built"]).toBe(
      "node packages/website/scripts/run-provider-free.mjs bun run lighthouse:local:built:internal",
    );
    expect(packageJson.scripts?.["lighthouse:local:built:internal"]).toBe(
      "node packages/website/scripts/run-built-gate.mjs lhci autorun --config=lighthouserc.json",
    );
    expect(packageJson.scripts?.["lighthouse:release:built"]).toBe(
      "node packages/website/scripts/run-provider-free.mjs node packages/website/scripts/run-built-gate.mjs lhci autorun --config=lighthouserc.json",
    );
    expect(packageJson.scripts?.["lighthouse:ci:built"]).toContain(
      "--collect.numberOfRuns=1",
    );
    expect(packageJson.scripts?.["lighthouse:ci:built"]).toContain(
      "--collect.url=http://localhost:3000/kurse/open-source/data-science",
    );

    const { config } = await fixture();
    expect(config.ci.collect.startServerCommand).toBe(
      "cd packages/website && node scripts/run-provider-free.mjs bun run start",
    );
    expect(config.ci.assert.aggregationMethod).toBe("pessimistic");
  });

  it("makes stable performance guardrails blocking", async () => {
    const raw = JSON.parse(await readFile("lighthouserc.json", "utf8")) as {
      ci: {
        assert: {
          assertions: Record<string, [string, Record<string, number>]>;
        };
      };
    };
    const assertions = raw.ci.assert.assertions;

    for (const audit of [
      "categories:performance",
      "largest-contentful-paint",
      "cumulative-layout-shift",
      "total-blocking-time",
      "resource-summary:script:size",
      "resource-summary:total:size",
      "resource-summary:third-party:count",
    ]) {
      expect(assertions[audit]?.[0]).toBe("error");
    }
    expect(assertions["categories:performance"]?.[1].minScore).toBe(0.8);
    expect(assertions["largest-contentful-paint"]?.[1].maxNumericValue).toBe(
      4500,
    );
    expect(assertions["total-blocking-time"]?.[1].maxNumericValue).toBe(200);
    expect(assertions["resource-summary:script:size"]?.[1].maxNumericValue).toBe(
      368640,
    );
    expect(assertions["resource-summary:total:size"]?.[1].maxNumericValue).toBe(
      1048576,
    );
  });

  it("accepts the committed config against the live crawl and publication catalogs", async () => {
    const { config, dynamicCandidates } = await fixture();
    const summary = verifyLighthouseRouteConfig({
      config,
      crawlContract: CRAWL_CONTRACT,
      dynamicCandidates,
    });
    expect(summary.configuredRoutes).toBeGreaterThan(25);
    expect(summary.staticRoutes).toBeGreaterThan(20);
    // 7 dynamic public-indexable patterns: /wie-ki-funktioniert/:lektionId,
    // /blog/:slug, /buecher/:slug, /demos/:slug, /workshops/:slug,
    // /open-source/:kind/:slug, /buecher/:slug/:chapter.
    expect(summary.dynamicPatterns).toBe(7);
  });

  it("fails when a static public page is omitted", async () => {
    const { config, dynamicCandidates } = await fixture();
    config.ci.collect.url = config.ci.collect.url.filter(
      (url) => url !== "http://localhost:3000/datenschutz",
    );
    expect(() =>
      verifyLighthouseRouteConfig({
        config,
        crawlContract: CRAWL_CONTRACT,
        dynamicCandidates,
      }),
    ).toThrow(/missing static public-indexable route: \/datenschutz/);
  });

  it("fails on a stale dynamic slug even when the crawl pattern still matches", async () => {
    const { config, dynamicCandidates } = await fixture();
    config.ci.collect.url = config.ci.collect.url.map((url) =>
      url === "http://localhost:3000/blog/eu-ai-act-grundlagen"
        ? "http://localhost:3000/blog/not-in-the-publication-catalog"
        : url,
    );
    expect(() =>
      verifyLighthouseRouteConfig({
        config,
        crawlContract: CRAWL_CONTRACT,
        dynamicCandidates,
      }),
    ).toThrow(/configured dynamic route is not present in its publication catalog/);
  });

  it("fails closed when a new dynamic crawl pattern has no publication source", async () => {
    const { config, dynamicCandidates } = await fixture();
    const incompleteCandidates = new Map(dynamicCandidates);
    incompleteCandidates.delete("/blog/:slug");
    expect(() =>
      verifyLighthouseRouteConfig({
        config,
        crawlContract: CRAWL_CONTRACT,
        dynamicCandidates: incompleteCandidates,
      }),
    ).toThrow(/dynamic public-indexable pattern has no candidate source: \/blog\/:slug/);
  });

  it("fails closed when a dynamic publication source is empty", async () => {
    const { config, dynamicCandidates } = await fixture();
    const emptyCandidates = new Map(dynamicCandidates);
    emptyCandidates.set("/blog/:slug", []);
    expect(() =>
      verifyLighthouseRouteConfig({
        config,
        crawlContract: CRAWL_CONTRACT,
        dynamicCandidates: emptyCandidates,
      }),
    ).toThrow(/dynamic public-indexable pattern has an empty candidate source: \/blog\/:slug/);
  });

  it("rejects duplicate, non-indexable, and non-canonical measurement URLs", async () => {
    const { config, dynamicCandidates } = await fixture();
    config.ci.collect.url.push(
      config.ci.collect.url[0]!,
      "http://localhost:3000/feedback",
      "http://localhost:3000/impressum?local=1",
    );
    let error: unknown;
    try {
      verifyLighthouseRouteConfig({
        config,
        crawlContract: CRAWL_CONTRACT,
        dynamicCandidates,
      });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(Error);
    const message = (error as Error).message;
    expect(message).toMatch(/duplicate Lighthouse route/);
    expect(message).toMatch(/got public-noindex/);
    expect(message).toMatch(/without credentials, query, hash/);
  });

  it("keeps blocking axe representatives for every published dynamic family", async () => {
    const [mainA11y, readerA11y] = await Promise.all([
      readFile("packages/website/tests/e2e/a11y.spec.ts", "utf8"),
      readFile("packages/website/tests/e2e/a11y-reader.spec.ts", "utf8"),
    ]);
    const axeSources = `${mainA11y}\n${readerA11y}`;
    for (const route of [
      "/wie-ki-funktioniert/lektion-1-vorhersage",
      "/kurse/open-source/data-engineering-fundamentals",
      "/blog/eu-ai-act-grundlagen",
      "/buecher/ki-landschaft",
      "/buecher/ki-landschaft/02_methodik",
      "/demos/prompt-scanner",
      "/workshops/geschaeftsberichte-mit-ki-lesen",
    ]) {
      expect(axeSources).toContain(JSON.stringify(route));
    }
    expect(mainA11y).toContain("...OPEN_SOURCE_DETAIL_ROUTES");
  });
});
