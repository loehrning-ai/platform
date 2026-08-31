import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { GET as getKnowledgeGraph } from "@/app/api/knowledge-graph.json/route";
import {
  GITHUB_ORG,
  LOEHRNING_LINKEDIN_URL,
  ORGANIZATION_SAME_AS_URLS,
  PERSON_SAME_AS_URLS,
  TIM_ENTITY,
} from "../entity";
import { JsonLd } from "../json-ld";
import { SITE_GRAPH } from "../site-graph";

const EXPECTED_GITHUB_ORG_URL = new URL(GITHUB_ORG.url);

function isExactGitHubOrgUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === EXPECTED_GITHUB_ORG_URL.protocol &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.hostname === EXPECTED_GITHUB_ORG_URL.hostname &&
      parsed.port === "" &&
      parsed.pathname === EXPECTED_GITHUB_ORG_URL.pathname &&
      parsed.search === "" &&
      parsed.hash === ""
    );
  } catch {
    return false;
  }
}

function renderedSiteJsonLd(): typeof SITE_GRAPH {
  const { container } = render(<JsonLd data={SITE_GRAPH} id="site-jsonld-under-test" />);
  const script = container.querySelector('script#site-jsonld-under-test[type="application/ld+json"]');
  expect(script, "site JSON-LD script must render").not.toBeNull();
  const json = script?.innerHTML ?? "";
  expect(() => JSON.parse(json), "site JSON-LD must serialize to valid JSON").not.toThrow();
  return JSON.parse(json) as typeof SITE_GRAPH;
}

function organizationSameAs(graph: typeof SITE_GRAPH): unknown[] {
  const org = graph["@graph"].find((node) => node["@type"] === "Organization");
  expect(org, "Organization node must exist in the site graph").toBeDefined();
  expect(Array.isArray(org?.sameAs), "Organization sameAs must be an array").toBe(true);
  return Array.isArray(org?.sameAs) ? org.sameAs : [];
}

function personSameAs(graph: typeof SITE_GRAPH): unknown[] {
  const person = graph["@graph"].find((node) => node["@type"] === "Person");
  expect(person, "Person node must exist in the site graph").toBeDefined();
  expect(Array.isArray(person?.sameAs), "Person sameAs must be an array").toBe(true);
  return Array.isArray(person?.sameAs) ? person.sameAs : [];
}

describe("GitHub organization links", () => {
  it("rendered site JSON-LD links the verified GitHub organization", () => {
    const orgLinks = organizationSameAs(renderedSiteJsonLd());
    expect(orgLinks.filter(isExactGitHubOrgUrl)).toEqual([GITHUB_ORG.url]);
  });

  it("Organization sameAs lists the verified GitHub organization and company LinkedIn", () => {
    expect(ORGANIZATION_SAME_AS_URLS).toEqual([
      GITHUB_ORG.url,
      LOEHRNING_LINKEDIN_URL,
    ]);
    expect(organizationSameAs(renderedSiteJsonLd())).toEqual([
      GITHUB_ORG.url,
      LOEHRNING_LINKEDIN_URL,
    ]);
  });

  it("Person sameAs lists personal profiles and excludes the organization", () => {
    expect(PERSON_SAME_AS_URLS).toEqual([
      TIM_ENTITY.linkedInUrl,
      TIM_ENTITY.personalGithubUrl,
    ]);
    expect(personSameAs(renderedSiteJsonLd())).toEqual([
      TIM_ENTITY.linkedInUrl,
      TIM_ENTITY.personalGithubUrl,
    ]);
    expect(personSameAs(renderedSiteJsonLd()).filter(isExactGitHubOrgUrl)).toEqual(
      [],
    );
  });

  it.each([
    "https://evil.example/github.com/loehrning-ai",
    "https://github.com.evil.example/loehrning-ai",
    "https://github.com/loehrning-ai.evil",
    "https://attacker@github.com/loehrning-ai",
    "http://github.com/loehrning-ai",
    "https://github.com:444/loehrning-ai",
    "https://github.com/loehrning-ai/repos",
    "https://github.com/loehrning-ai?redirect=evil",
    "https://github.com/loehrning-ai#spoof",
  ])("rejects GitHub organization URL lookalike %s", (lookalike) => {
    expect(isExactGitHubOrgUrl(lookalike)).toBe(false);
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

describe("site languages", () => {
  it("declares the reviewed German and English website languages", () => {
    const website = SITE_GRAPH["@graph"].find(
      (node) => node["@type"] === "WebSite",
    );
    expect(website?.inLanguage).toEqual(["de-DE", "en-GB"]);
  });
});
