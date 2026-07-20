import { describe, expect, it } from "vitest";
import { CRAWL_CONTRACT, getCrawlRoute, NOINDEX_HEADER } from "./contract";

// regression coverage (part a): the getCrawlRoute() fallback is fail-closed.
// A route NOT enumerated in CRAWL_CONTRACT must default to noindex, so a new
// or unknown path cannot be silently indexed before it earns an explicit
// contract class. This locks the fallback and guards against a regression to
// the old default-open behaviour (public-access, no X-Robots-Tag).

// Synthetic paths that match NO explicit CRAWL_CONTRACT pattern: there is no
// top-level single-segment :param entry and no top-level /:path* catch-all,
// so these can only reach the fallback branch of getCrawlRoute().
const UNLISTED_PATHS = ["/this-route-does-not-exist", "/void/definitely/unlisted-9f3a2b"] as const;

// Synthetic API paths with no explicit contract entry: they must reach the
// fail-closed /api/* fallback, which defaults to auth "protected".
const UNLISTED_API_PATHS = ["/api/this-endpoint-does-not-exist", "/api/void/unlisted-9f3a2b"] as const;

describe("crawl contract fail-closed fallback (regression coverage)", () => {
  it("has no explicit contract entry for the probe paths (they truly reach the fallback)", () => {
    for (const path of [...UNLISTED_PATHS, ...UNLISTED_API_PATHS]) {
      expect(
        CRAWL_CONTRACT.some((entry) => entry.pattern === path),
        path,
      ).toBe(false);
    }
  });

  it("defaults an unlisted route to noindex", () => {
    for (const path of UNLISTED_PATHS) {
      const entry = getCrawlRoute(path);
      // Fallback signature: it echoes the requested pathname as its pattern,
      // so an entry.pattern === path result can only be the fallback.
      expect(entry.pattern, path).toBe(path);
      expect(entry.routeClass, path).toBe("public-noindex");
      expect(entry.xRobotsTag, path).toBe(NOINDEX_HEADER);
      expect(entry.xRobotsTag, path).toContain("noindex");
      // Access is preserved: the route still resolves as public, only the
      // index signal is closed.
      expect(entry.auth, path).toBe("public");
    }
  });

  it("defaults an unlisted /api/* route to protected (fail-closed auth gate)", () => {
    for (const path of UNLISTED_API_PATHS) {
      const entry = getCrawlRoute(path);
      // Fallback signature: it echoes the requested pathname as its pattern.
      expect(entry.pattern, path).toBe(path);
      expect(entry.routeClass, path).toBe("protected");
      // Auth closed: middleware (isProtectedPlatformPath) must gate the route
      // so a future authenticated API route cannot ship without an auth check.
      expect(entry.auth, path).toBe("protected");
      expect(entry.robots, path).toBe("disallow");
      expect(entry.cache, path).toBe("private-no-store");
      expect(entry.xRobotsTag, path).toBe(NOINDEX_HEADER);
    }
  });

  it("leaves explicit indexable routes as-is (no noindex header)", () => {
    for (const path of ["/", "/buecher", "/blog"]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("public-indexable");
      expect(entry.robots, path).toBe("allow");
      expect(entry.xRobotsTag, path).toBeUndefined();
    }
  });

  it("does not flip the explicit public-access class to noindex", () => {
    // The fallback flip must not leak into listed public-access routes, which
    // deliberately carry NO X-Robots-Tag (their noindex lives in page-level
    // Next.js metadata; see src/app/__tests__/course-reader-noindex.test.ts).
    const entry = getCrawlRoute("/ki-fuehrerschein/kurs");
    expect(entry.routeClass).toBe("public-access");
    expect(entry.auth).toBe("public");
    expect(entry.xRobotsTag).toBeUndefined();
  });
});
