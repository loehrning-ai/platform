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
 * Matching reuses the contract's own matchesPattern() on probe paths
 * synthesized from the discovered patterns, so this test cannot drift from
 * the runtime matching semantics.
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { CRAWL_CONTRACT, getCrawlRoute, matchesPattern } from "./contract";

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
      (pattern) => !CRAWL_CONTRACT.some((entry) => matchesPattern(probePathFor(pattern), entry.pattern)),
    );
    expect(
      unmatched,
      `Routes without an explicit CRAWL_CONTRACT entry (add a deliberate class in src/lib/crawl/contract.ts): ${unmatched.join(", ")}`,
    ).toEqual([]);
  });

  it("classifies book chapter readers as indexable but deliberately out of the sitemap", () => {
    const entry = getCrawlRoute("/buecher/ki-landschaft/01-einleitung");
    expect(entry.pattern).toBe("/buecher/:slug/:chapter");
    expect(entry.routeClass).toBe("public-indexable");
    expect(entry.includeInSitemap).toBe(false);
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
