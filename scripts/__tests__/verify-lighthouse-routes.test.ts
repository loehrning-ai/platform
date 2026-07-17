import { describe, expect, it } from "bun:test";
import { readFile } from "node:fs/promises";
import { CRAWL_CONTRACT } from "../../packages/simplified-website/src/lib/crawl/contract";
import {
  buildPublishedDynamicCandidates,
  verifyLighthouseRouteConfig,
} from "../verify-lighthouse-routes";

type Config = {
  ci: {
    collect: {
      url: string[];
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
  it("accepts the committed config against the live crawl and publication catalogs", async () => {
    const { config, dynamicCandidates } = await fixture();
    const summary = verifyLighthouseRouteConfig({
      config,
      crawlContract: CRAWL_CONTRACT,
      dynamicCandidates,
    });
    expect(summary.configuredRoutes).toBeGreaterThan(25);
    expect(summary.staticRoutes).toBeGreaterThan(20);
    expect(summary.dynamicPatterns).toBe(9);
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
});
