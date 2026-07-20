import { describe, expect, it } from "vitest";
import {
  CRAWL_CONTRACT,
  getCrawlRoute,
  isProtectedRoute,
  matchesPattern,
  robotsAllowPaths,
  robotsDisallowPaths,
  sitemapStaticPaths,
} from "./contract";

describe("crawl contract", () => {
  it("matches dynamic and catch-all patterns", () => {
    expect(matchesPattern("/buecher/ki-landschaft", "/buecher/:slug")).toBe(true);
    expect(matchesPattern("/ai-native/kurs/modul_1/lesson_1", "/ai-native/kurs/:path*")).toBe(true);
    expect(matchesPattern("/downloads/book.pdf", "/downloads/:path*.pdf")).toBe(true);
  });

  it("classifies public learning resources without auth", () => {
    for (const path of [
      "/buecher",
      "/buecher/ki-arbeitsalltag",
      "/demos",
      "/demos/excel",
      "/ki-fuehrerschein/kurs/block-1",
      "/kurse/open-source/codex",
      "/open-source/lizenzrichtlinie",
      "/open-source/tools/example-tool",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.auth, path).toBe("public");
      expect(isProtectedRoute(path), path).toBe(false);
    }
  });

  it("keeps account and state APIs protected", () => {
    for (const path of [
      "/konto",
      "/konto/datenschutz",
      "/api/account/delete",
      "/api/progress",
      "/api/ai-native/practice",
      "/api/demos/example/future-write",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("protected");
      expect(entry.xRobotsTag, path).toContain("noindex");
    }
  });

  it("keeps public noindex routes crawlable", () => {
    for (const path of [
      "/feedback",
      "/api/demos/excel/briefing.pdf",
      "/api/ai-native/grade-exercise",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("public-noindex");
      expect(entry.robots, path).toBe("allow");
      expect(entry.xRobotsTag, path).toContain("noindex");
    }
  });

  it("keeps exact course utilities ahead of public reader catch-alls", () => {
    for (const path of [
      "/ki-fuehrerschein/kurs/quiz",
      "/eu-ai-act-kurs/kurs/zertifikat",
      "/ai-native/kurs/quiz",
      "/ki-und-gesellschaft/kurs/quiz",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("public-noindex");
      expect(entry.xRobotsTag, path).toContain("noindex");
    }
  });

  it("keeps retired blog slugs ahead of the broad blog pattern", () => {
    const retired = getCrawlRoute("/blog/digify");
    expect(retired.routeClass).toBe("retired");
    expect(retired.redirectTo).toBe("/blog");
  });

  // Routes dropped in the open-source split (2026-07-16). All four were
  // previously indexable, so a bare 404 would strand real inbound links.
  it.each([
    ["/glossar", "/ai-native/glossar"],
    ["/blog/deepfake-erkennen", "/blog"],
    ["/blog/eu-ai-act-update-2026-06", "/blog/eu-ai-act-grundlagen"],
    ["/blog/ki-und-arbeit", "/blog"],
  ])("301s the split-retired route %s to %s", (from, to) => {
    const entry = getCrawlRoute(from);
    expect(entry.routeClass).toBe("retired");
    expect(entry.redirectTo).toBe(to);
    expect(entry.status).toBe(301);
  });

  it("classifies imported course details as indexable discovery pages", () => {
    const imported = getCrawlRoute("/kurse/open-source/codex");
    expect(imported.routeClass).toBe("public-indexable");
    expect(imported.includeInSitemap).toBe(true);
    expect(imported.xRobotsTag).toBeUndefined();
  });

  it("pre-classifies typed tool, project, and video detail conventions", () => {
    for (const path of [
      "/open-source/tools/example-tool",
      "/open-source/projects/example-project",
      "/open-source/videos/example-video",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.pattern, path).toBe("/open-source/:kind/:slug");
      expect(entry.routeClass, path).toBe("public-indexable");
      expect(entry.includeInSitemap, path).toBe(true);
      expect(entry.xRobotsTag, path).toBeUndefined();
    }
  });

  it("lists only indexable static routes in sitemapStaticPaths", () => {
    const paths = sitemapStaticPaths();
    expect(paths).toContain("/");
    expect(paths).toContain("/open-source");
    expect(paths).toContain("/open-source/lizenzrichtlinie");
    expect(paths).toContain("/buecher");
    expect(paths).toContain("/demos");
    expect(paths).not.toContain("/konto");
    expect(paths).not.toContain("/feedback");
    expect(paths).not.toContain("/api/health");
  });

  it("aligns robots allow/disallow with route classes", () => {
    const allow = robotsAllowPaths();
    const disallow = robotsDisallowPaths();
    expect(allow).toContain("/buecher");
    expect(allow).toContain("/book-covers/");
    expect(allow).toContain("/api/knowledge-graph.json");
    expect(allow).toContain("/kurse/open-source/");
    expect(allow).toContain("/open-source/");
    expect(disallow).toContain("/konto/");
    expect(disallow).toContain("/api/progress");
    expect(disallow).toContain("/downloads/");
  });

  it("does not contain duplicate route patterns", () => {
    const patterns = CRAWL_CONTRACT.map((entry) => entry.pattern);
    expect(new Set(patterns).size).toBe(patterns.length);
  });
});
