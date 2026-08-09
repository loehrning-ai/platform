import { describe, it, expect } from "vitest";
import robots from "../robots";

describe("robots()", () => {
  const result = robots();

  it("declares the sitemap location", () => {
    expect(result.sitemap).toBe("https://loehrning.ai/sitemap.xml");
  });

  it("disallows protected APIs and allows public metadata APIs", () => {
    expect(Array.isArray(result.rules)).toBe(true);
    const rules = result.rules as Array<{ userAgent: string; allow?: string | string[]; disallow?: string | string[] }>;
    const wildcard = rules.find((r) => r.userAgent === "*");
    expect(wildcard).toBeDefined();
    const allow = Array.isArray(wildcard?.allow) ? wildcard?.allow : [wildcard?.allow];
    const disallow = Array.isArray(wildcard?.disallow) ? wildcard?.disallow : [wildcard?.disallow];
    expect(allow).toContain("/api/books.json");
    expect(disallow).toContain("/api/progress");
    expect(disallow).toContain("/api/buecher/*/download.pdf");
    expect(disallow).toContain("/api/scan");
    expect(disallow).toContain("/api/journey/scan-insight");
    expect(disallow).toContain("/api/journey/leads");
    expect(disallow).toContain("/konto/");
    expect(disallow).toContain("/en/konto/");
    expect(disallow).toContain("/ki-fuehrerschein/kurs/");
    expect(disallow).toContain("/en/ki-fuehrerschein/kurs/");
    expect(disallow).not.toContain("/en/api/progress");
    expect(disallow).not.toContain("/en/auth/callback");
    expect(allow).not.toContain("/api/buecher/*/download.pdf");
    expect(allow).not.toContain("/api/scan");
    expect(allow).not.toContain("/api/journey/scan-insight");
    expect(allow).not.toContain("/api/journey/leads");
    expect(allow).toContain("/buecher");
    expect(allow).toContain("/book-covers/");
    expect(allow).toContain("/schema/knowledge-graph/v1");
  });

  it("keeps permanent redirect origins crawlable in both locale spaces", () => {
    const rules = result.rules as Array<{
      userAgent: string;
      allow?: string | string[];
      disallow?: string | string[];
    }>;
    const wildcard = rules.find((rule) => rule.userAgent === "*");
    const allow = Array.isArray(wildcard?.allow)
      ? wildcard.allow
      : [wildcard?.allow];
    const disallow = Array.isArray(wildcard?.disallow)
      ? wildcard.disallow
      : [wildcard?.disallow];

    expect(allow).toContain("/leistungen");
    for (const path of [
      "/leistungen",
      "/en/leistungen",
      "/kontakt",
      "/en/kontakt",
      "/glossar",
      "/en/glossar",
    ]) {
      expect(disallow).not.toContain(path);
    }
  });

  it.each([
    "OAI-SearchBot",
    "ChatGPT-User",
    "PerplexityBot",
    "Perplexity-User",
    "Claude-User",
    "Claude-SearchBot",
  ])("allows the current AI search or user agent %s on public routes", (userAgent) => {
    const rules = result.rules as Array<{
      userAgent: string;
      allow?: string | string[];
      disallow?: string | string[];
    }>;
    const found = rules.find((rule) => rule.userAgent === userAgent);
    const allow = Array.isArray(found?.allow) ? found.allow : [found?.allow];
    const disallow = Array.isArray(found?.disallow)
      ? found.disallow
      : [found?.disallow];

    expect(found).toBeDefined();
    expect(allow).toContain("/");
    expect(disallow).toContain("/api/progress");
    expect(disallow).not.toContain("/");
  });

  it.each([
    "GPTBot",
    "CCBot",
    "Bytespider",
    "Google-Extended",
    "Applebot-Extended",
    "ClaudeBot",
    "anthropic-ai",
  ])("blocks the AI training agent %s from the entire site", (userAgent) => {
    const rules = result.rules as Array<{
      userAgent: string;
      allow?: string | string[];
      disallow?: string | string[];
    }>;
    const found = rules.find((rule) => rule.userAgent === userAgent);
    const disallow = Array.isArray(found?.disallow)
      ? found.disallow
      : [found?.disallow];

    expect(found).toBeDefined();
    expect(found?.allow).toBeUndefined();
    expect(disallow).toEqual(["/"]);
  });

  it("does NOT contain /api/og in PUBLIC_PATHS (deleted by public-content transition)", () => {
    const rules = result.rules as Array<{ userAgent: string; allow?: string | string[]; disallow?: string | string[] }>;
    const wildcard = rules.find((r) => r.userAgent === "*");
    const allow = Array.isArray(wildcard?.allow) ? wildcard?.allow : [wildcard?.allow];
    expect(allow).not.toContain("/api/og");
  });

  it("keeps /ueber-mich public and out of disallow", () => {
    const rules = result.rules as Array<{ userAgent: string; allow?: string | string[]; disallow?: string | string[] }>;
    const wildcard = rules.find((r) => r.userAgent === "*");
    const allow = Array.isArray(wildcard?.allow) ? wildcard?.allow : [wildcard?.allow];
    const disallow = Array.isArray(wildcard?.disallow) ? wildcard?.disallow : [wildcard?.disallow];
    expect(allow).toContain("/ueber-mich");
    expect(disallow).not.toContain("/ueber-mich");
  });
});
