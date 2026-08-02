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
    expect(allow).not.toContain("/api/buecher/*/download.pdf");
    expect(allow).not.toContain("/api/scan");
    expect(allow).not.toContain("/api/journey/scan-insight");
    expect(allow).not.toContain("/api/journey/leads");
    expect(allow).toContain("/buecher");
    expect(allow).toContain("/book-covers/");
  });

  it("emits an explicit rule for OAI-SearchBot", () => {
    const rules = result.rules as Array<{ userAgent: string }>;
    const found = rules.find((r) => r.userAgent === "OAI-SearchBot");
    expect(found).toBeDefined();
  });

  it("emits an explicit rule for PerplexityBot", () => {
    const rules = result.rules as Array<{ userAgent: string }>;
    const found = rules.find((r) => r.userAgent === "PerplexityBot");
    expect(found).toBeDefined();
  });

  it("emits an explicit rule for ClaudeBot", () => {
    const rules = result.rules as Array<{ userAgent: string }>;
    const found = rules.find((r) => r.userAgent === "ClaudeBot");
    expect(found).toBeDefined();
  });

  it("emits an explicit rule for Google-Extended", () => {
    const rules = result.rules as Array<{ userAgent: string }>;
    const found = rules.find((r) => r.userAgent === "Google-Extended");
    expect(found).toBeDefined();
  });

  it("does not block AI crawlers from public pages", () => {
    const rules = result.rules as Array<{ userAgent: string; allow?: string | string[]; disallow?: string | string[] }>;
    const ai = rules.find((r) => r.userAgent === "OAI-SearchBot");
    const allow = Array.isArray(ai?.allow) ? ai?.allow : [ai?.allow];
    expect(allow).toContain("/");
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
