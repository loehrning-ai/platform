import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { GET as getKnowledgeGraph } from "@/app/api/knowledge-graph.json/route";
import { GITHUB_ORG, SAME_AS_URLS } from "../entity";
import { JsonLd } from "../json-ld";
import { SITE_GRAPH } from "../site-graph";

const ORG_URL_PATTERN = /github\.com\/loehrning-ai/;

function renderedSiteJsonLd(): string {
  const { container } = render(<JsonLd data={SITE_GRAPH} id="site-jsonld-under-test" />);
  const script = container.querySelector('script#site-jsonld-under-test[type="application/ld+json"]');
  expect(script, "site JSON-LD script must render").not.toBeNull();
  const json = script?.innerHTML ?? "";
  expect(() => JSON.parse(json), "site JSON-LD must serialize to valid JSON").not.toThrow();
  return json;
}

describe("GitHub organization links", () => {
  it("rendered site JSON-LD links the verified GitHub organization", () => {
    expect(renderedSiteJsonLd()).toMatch(ORG_URL_PATTERN);
  });

  it("sameAs lists the verified GitHub organization", () => {
    expect(SAME_AS_URLS.some((url) => ORG_URL_PATTERN.test(url))).toBe(true);
  });

  it("knowledge-graph payload links the verified GitHub organization without repository-status placeholders", async () => {
    const res = await getKnowledgeGraph();
    const body = (await res.json()) as {
      openSource: { organization: string; orgUrl: string; sourcePolicy: string };
    };
    expect(body.openSource.organization).toBe(GITHUB_ORG.slug);
    expect(body.openSource.orgUrl).toBe(GITHUB_ORG.url);
    expect(body.openSource.sourcePolicy).toMatch(/pinned commit/i);
    expect(JSON.stringify(body.openSource)).not.toMatch(/targetRepo|repository status/i);
  });
});

describe("Organization logo", () => {
  it("references the dedicated square logo asset, not the OG image", () => {
    const org = SITE_GRAPH["@graph"].find((node) => node["@type"] === "Organization");
    expect(org, "Organization node must exist in the site graph").toBeDefined();
    expect(org?.logo).toBe("https://loehrning.ai/logo-square-512.png");
  });

  it("ships the 512x512 square logo asset in public/", () => {
    expect(existsSync(join(process.cwd(), "public", "logo-square-512.png"))).toBe(true);
  });
});
