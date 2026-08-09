/**
 * Crawl contract completeness test (public-content contract).
 *
 * Enumerates the real app-router tree (every page.tsx and route.ts below
 * src/app) and asserts every discovered route pattern matches an EXPLICIT
 * CRAWL_CONTRACT entry. The fail-closed fallback in getCrawlRoute() (an
 * unlisted route defaults to public-noindex; regression coverage) stays in code
 * as a runtime safety net, but no shipped route may depend on it: any new route
 * added without a deliberate contract class fails here.
 *
 * Matching reuses getCrawlRoute() on probe paths synthesized from the
 * discovered patterns, so locale mirrors and canonical routes share the same
 * runtime classification semantics.
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { CRAWL_CONTRACT, getCrawlRoute, NOINDEX_HEADER } from "./contract";

const APP_DIR = resolve(process.cwd(), "src/app");

/** Collects every page.tsx / route.ts file below dir. */
function walkRouteFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      // Next.js private folders (_components, __tests__, ...) are not routes.
      if (entry.startsWith("_")) continue;
      results.push(...walkRouteFiles(full));
    } else if (entry === "page.tsx" || entry === "route.ts") {
      results.push(full);
    }
  }
  return results;
}

/** Converts an app-router file into a route pattern such as /buecher/:slug/:chapter. */
function routePatternFor(file: string): string {
  const segments = relative(APP_DIR, file)
    .split(sep)
    .slice(0, -1)
    .filter((segment) => !/^\(.+\)$/.test(segment)) // route groups never reach the URL
    .map((segment) => {
      if (/^\[\[?\.\.\..+\]\]?$/.test(segment)) return ":path*"; // [...param] / [[...param]]
      if (/^\[.+\]$/.test(segment)) return `:${segment.slice(1, -1)}`; // [param]
      return segment;
    });
  return `/${segments.join("/")}`;
}

/**
 * Substitutes concrete probe segments for params so the contract's own
 * matcher decides coverage. A catch-all probes with two segments so only a
 * :path* contract entry can satisfy it, never a single-segment :param entry.
 */
function probePathFor(pattern: string): string {
  return pattern
    .split("/")
    .map((segment) => {
      if (segment === ":path*") return "probe/probe";
      if (segment.startsWith(":")) return "probe";
      return segment;
    })
    .join("/");
}

describe("crawl contract completeness (fail closed)", () => {
  const routeFiles = walkRouteFiles(APP_DIR);
  const discovered = [...new Set(routeFiles.map(routePatternFor))].sort();

  it("enumerates the app-router tree", () => {
    expect(routeFiles.length).toBeGreaterThan(50);
    expect(discovered).toContain("/");
    expect(discovered).toContain("/buecher/:slug/:chapter");
    expect(discovered).toContain("/auth/callback");
    expect(discovered).toContain("/auth/logout");
  });

  it("matches every app route against an explicit contract entry, never the fail-closed fallback", () => {
    const unmatched = discovered.filter(
      (pattern) =>
        !CRAWL_CONTRACT.includes(getCrawlRoute(probePathFor(pattern))),
    );
    expect(
      unmatched,
      `Routes without an explicit CRAWL_CONTRACT entry (add a deliberate class in src/lib/crawl/contract.ts): ${unmatched.join(", ")}`,
    ).toEqual([]);
  });

  it.each([
    ["/en", "/"],
    ["/en/kurse", "/kurse"],
    ["/en/login", "/login"],
    [
      "/en/kurse/open-source/claude/kurs",
      "/kurse/open-source/claude/kurs",
    ],
    ["/en/konto", "/konto"],
    ["/en/leistungen", "/leistungen"],
  ])("classifies %s with the exact canonical contract for %s", (english, canonical) => {
    expect(getCrawlRoute(english)).toBe(getCrawlRoute(canonical));
  });

  it("keeps unknown English paths fail closed", () => {
    const pagePath = "/en/definitely-unlisted";
    const page = getCrawlRoute(pagePath);
    expect(page.pattern).toBe(pagePath);
    expect(page.routeClass).toBe("public-noindex");
    expect(page.xRobotsTag).toBe(NOINDEX_HEADER);

    const apiPath = "/en/api/definitely-unlisted";
    const api = getCrawlRoute(apiPath);
    expect(api.pattern).toBe(apiPath);
    expect(api.routeClass).toBe("protected");
    expect(api.auth).toBe("protected");
    expect(api.xRobotsTag).toBe(NOINDEX_HEADER);
  });

  it("classifies book chapter readers as indexable sitemap entries", () => {
    const entry = getCrawlRoute("/buecher/ki-landschaft/01-einleitung");
    expect(entry.pattern).toBe("/buecher/:slug/:chapter");
    expect(entry.routeClass).toBe("public-indexable");
    expect(entry.includeInSitemap).toBe(true);
    expect(entry.robots).toBe("allow");
    expect(entry.xRobotsTag).toBeUndefined();
  });

  it("classifies auth endpoints as public-noindex, matching middleware authAwarePublicPath", () => {
    for (const path of ["/auth/callback", "/auth/logout"]) {
      const entry = getCrawlRoute(path);
      expect(entry.pattern, path).toBe(path);
      expect(entry.routeClass, path).toBe("public-noindex");
      expect(entry.robots, path).toBe("allow");
      expect(entry.xRobotsTag, path).toContain("noindex");
    }
  });
});
