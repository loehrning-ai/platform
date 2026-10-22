import { describe, expect, it } from "vitest";
import { getCrawlRoute } from "@/lib/crawl/contract";
import { RETIRED_DEMO_REDIRECTS } from "@/lib/demo-redirects";
import { DEMO_SLUGS, isDemoSlug } from "@/lib/demos";

/** Every slug the twelve-demo gallery ever published. */
const OLD_SLUGS = [
  "excel",
  "word",
  "outbound-workflow",
  "agent-pipeline",
  "n8n-supply-chain",
  "rag-vertragsassistent",
  "rechnung-zu-sap",
  "prompt-scanner",
  "cost-drift-observability",
  "fine-tune-playground",
  "roi-rechner",
  "llm-observability",
] as const;

describe("retired demo redirects", () => {
  it("cover every old slug exactly once, and no new slug", () => {
    const from = RETIRED_DEMO_REDIRECTS.map((entry) => entry.from);
    expect([...from].sort()).toEqual([...OLD_SLUGS].sort());
    expect(new Set(from).size).toBe(from.length);
    for (const slug of from) expect(isDemoSlug(slug), slug).toBe(false);
  });

  it("point only at the hub or a live demo", () => {
    for (const { from, to } of RETIRED_DEMO_REDIRECTS) {
      if (to === "/demos") continue;
      const slug = to.replace(/^\/demos\//, "");
      expect(DEMO_SLUGS as readonly string[], `${from} -> ${to}`).toContain(slug);
    }
  });

  it.each(RETIRED_DEMO_REDIRECTS.flatMap(({ from, to }) => [
    [`/demos/${from}`, to],
    [`/en/demos/${from}`, to],
  ]))("308s %s to %s instead of a 404", (path, to) => {
    const entry = getCrawlRoute(path);
    expect(entry.routeClass).toBe("retired");
    expect(entry.auth).toBe("redirect");
    expect(entry.status).toBe(308);
    expect(entry.redirectTo).toBe(to);
    expect(entry.robots).toBe("allow");
    expect(entry.includeInSitemap).toBe(false);
  });

  it("keeps every target an indexable page", () => {
    for (const { to } of RETIRED_DEMO_REDIRECTS) {
      expect(getCrawlRoute(to).routeClass, to).toBe("public-indexable");
    }
  });

  it("keeps the new demo pages out of the retired list", () => {
    for (const slug of DEMO_SLUGS) {
      expect(getCrawlRoute(`/demos/${slug}`).routeClass, slug).toBe("public-indexable");
      expect(getCrawlRoute(`/en/demos/${slug}`).routeClass, slug).toBe("public-indexable");
    }
  });

  it("answers 410 for the retired briefing API", () => {
    const entry = getCrawlRoute("/api/demos/excel/briefing.pdf");
    expect(entry.routeClass).toBe("retired");
    expect(entry.status).toBe(410);
  });
});
