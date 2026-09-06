import { describe, expect, it } from "vitest";
import {
  AI_RETRIEVAL_AGENTS,
  AI_TRAINING_CRAWLERS,
  CRAWL_CONTRACT,
  getCrawlRoute,
  isProtectedRoute,
  isPublicRoute,
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
      "/kurse/open-source/codex",
      "/open-source/lizenzrichtlinie",
      "/open-source/tools/example-tool",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.auth, path).toBe("public");
      expect(isProtectedRoute(path), path).toBe(false);
    }
  });

  it("keeps account, state APIs, and the 4 native certified courses' lesson content protected", () => {
    for (const path of [
      "/konto",
      "/konto/datenschutz",
      "/api/account/delete",
      "/api/progress",
      "/api/ai-native/practice",
      "/api/course-workspace/terminal",
      "/api/demos/example/future-write",
      "/ki-fuehrerschein/kurs",
      "/ki-fuehrerschein/kurs/block-1",
      "/eu-ai-act-kurs/kurs",
      "/ai-native/kurs",
      "/ai-native/kurs/modul_1",
      "/ki-und-gesellschaft/kurs",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("protected");
      expect(entry.xRobotsTag, path).toContain("noindex");
    }
  });

  it("keeps the exact book PDF private while delegating auth to its route", () => {
    const path = "/api/buecher/ki-landschaft/download.pdf";
    const entry = getCrawlRoute(path);

    expect(entry.pattern).toBe("/api/buecher/:slug/download.pdf");
    expect(entry.routeClass).toBe("protected");
    expect(entry.auth).toBe("route-level");
    expect(entry.robots).toBe("disallow");
    expect(entry.cache).toBe("private-no-store");
    expect(entry.xRobotsTag).toContain("noindex");
    expect(isPublicRoute(path)).toBe(false);
    expect(isProtectedRoute(path)).toBe(false);

    const nearMiss = getCrawlRoute(`${path}/extra`);
    expect(nearMiss.routeClass).toBe("protected");
    expect(nearMiss.auth).toBe("protected");
  });

  it("keeps public noindex routes crawlable", () => {
    for (const path of [
      "/feedback",
      "/api/demos/excel/briefing.pdf",
      "/api/ai-native/grade-exercise",
      "/ki-fuehrerschein/verifizierung",
      "/ai-native/verifizierung",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("public-noindex");
      expect(entry.robots, path).toBe("allow");
      expect(entry.xRobotsTag, path).toContain("noindex");
    }
  });

  it("keeps exact course utilities ahead of public reader catch-alls", () => {
    for (const path of [
      "/kurse/open-source/claude/kurs/quiz",
      "/kurse/open-source/claude/kurs/zertifikat",
      "/kurse/open-source/codex/kurs/zertifikat",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("public-noindex");
      expect(entry.xRobotsTag, path).toContain("noindex");
    }
  });

  it("classifies the Claude Course routes registered ahead of their pages ", () => {
    for (const path of [
      "/kurse/open-source/claude/kurs",
      "/kurse/open-source/claude/kurs/mental-model",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("public-access");
      expect(entry.auth, path).toBe("public");
      expect(entry.includeInSitemap, path).toBe(false);
    }
    for (const path of [
      "/kurse/open-source/claude/kurs/quiz",
      "/kurse/open-source/claude/kurs/zertifikat",
      "/kurse/open-source/claude/verifizierung",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("public-noindex");
      expect(entry.xRobotsTag, path).toContain("noindex");
    }
  });

  it("classifies the Codex Course routes registered ahead of their pages ", () => {
    for (const path of [
      "/kurse/open-source/codex/kurs",
      "/kurse/open-source/codex/kurs/L01",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("public-access");
      expect(entry.auth, path).toBe("public");
      expect(entry.includeInSitemap, path).toBe(false);
    }
    // Codex has no separate gating quiz (all-lessons-completion cert path),
    // so unlike claude there is no "/kurs/quiz" noindex entry here.
    for (const path of [
      "/kurse/open-source/codex/kurs/zertifikat",
      "/kurse/open-source/codex/verifizierung",
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
    ["/wie-ki-funktioniert", "/einstieg"],
    ["/wie-ki-funktioniert/lektion-1-vorhersage", "/einstieg"],
    ["/bekannte-grenzen", "/hilfe#grenzen"],
    ["/ueber-die-plattform", "/ueber-mich"],
    ["/glossar", "/ai-native/glossar"],
    ["/blog/deepfake-erkennen", "/blog"],
    ["/blog/eu-ai-act-update-2026-06", "/blog/eu-ai-act-grundlagen"],
    ["/blog/ki-und-arbeit", "/blog"],
  ])("301s the split-retired route %s to %s", (from, to) => {
    const entry = getCrawlRoute(from);
    expect(entry.routeClass).toBe("retired");
    expect(entry.redirectTo).toBe(to);
    expect(entry.status).toBe(301);
    expect(entry.robots).toBe("allow");
    expect(entry.xRobotsTag).toBeUndefined();
  });

  it("keeps every permanent redirect origin crawlable", () => {
    const redirects = CRAWL_CONTRACT.filter(
      (entry) => entry.auth === "redirect" && entry.status === 301,
    );
    expect(redirects.length).toBeGreaterThan(0);
    for (const entry of redirects) {
      expect(entry.robots, entry.pattern).toBe("allow");
      expect(entry.xRobotsTag, entry.pattern).toBeUndefined();
      expect(entry.includeInSitemap, entry.pattern).toBe(false);
    }

    const disallow = robotsDisallowPaths();
    for (const path of [
      "/leistungen",
      "/en/leistungen",
      "/wie-ki-funktioniert",
      "/en/wie-ki-funktioniert",
      "/bekannte-grenzen",
      "/en/bekannte-grenzen",
      "/ueber-die-plattform",
      "/en/ueber-die-plattform",
      "/kontakt",
      "/en/kontakt",
      "/glossar",
      "/en/glossar",
      "/blog/digify",
      "/en/blog/digify",
    ]) {
      expect(disallow, path).not.toContain(path);
    }
  });

  it.each([
    "/api/scan",
    "/api/journey/scan-insight",
    "/api/journey/leads",
  ])("returns an explicit retired 410 contract for %s", (path) => {
    const entry = getCrawlRoute(path);
    expect(entry.pattern).toBe(path);
    expect(entry.routeClass).toBe("retired");
    expect(entry.auth).toBe("gone");
    expect(entry.status).toBe(410);
    expect(entry.robots).toBe("disallow");
    expect(entry.xRobotsTag).toContain("noindex");
    expect(isPublicRoute(path)).toBe(false);
    expect(isProtectedRoute(path)).toBe(false);
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

  it("classifies every stored artifact file as a public static asset", () => {
    for (const path of [
      "/artifacts/projects/example-project/LICENSE.txt",
      "/artifacts/projects/example-project/screenshot.webp",
      "/artifacts/videos/example-video/transcript.md",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.pattern, path).toBe("/artifacts/:path*");
      expect(entry.routeClass, path).toBe("public-assets");
      expect(entry.auth, path).toBe("public");
      expect(entry.robots, path).toBe("allow");
      expect(entry.includeInSitemap, path).toBe(false);
      expect(entry.cache, path).toBe("public-static");
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
    expect(allow).toContain("/artifacts/");
    expect(allow).toContain("/api/knowledge-graph.json");
    expect(allow).toContain("/schema/knowledge-graph/v1");
    for (const slug of [
      "claude",
      "codex",
      "data-infrastructure",
      "data-engineering-fundamentals",
      "data-science",
      "ai-native-operator",
    ]) {
      expect(allow).toContain(`/kurse/open-source/${slug}`);
    }
    expect(allow).toContain("/open-source/");
    expect(disallow).toContain("/konto/");
    expect(disallow).toContain("/api/progress");
    expect(disallow).toContain("/api/buecher/*/download.pdf");
    expect(disallow).toContain("/api/scan");
    expect(disallow).toContain("/api/journey/scan-insight");
    expect(disallow).toContain("/api/journey/leads");
    expect(disallow).toContain("/downloads/");
  });

  it("does not contain duplicate route patterns", () => {
    const patterns = CRAWL_CONTRACT.map((entry) => entry.pattern);
    expect(new Set(patterns).size).toBe(patterns.length);
  });

  it("classifies the agent access endpoints, catalogs, and metadata as public machine surfaces", () => {
    for (const path of [
      "/api/mcp",
      "/api/courses.json",
      "/api/workshops.json",
      "/.well-known/oauth-protected-resource",
      "/.well-known/oauth-protected-resource/api/mcp",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.pattern, path).toBe(path);
      expect(entry.routeClass, path).toBe("public-machine");
      expect(entry.auth, path).toBe("public");
      expect(entry.robots, path).toBe("allow");
      expect(entry.includeInSitemap, path).toBe(false);
      expect(entry.cache, path).toBe("public-short");
      expect(entry.xRobotsTag, path).toBeUndefined();
      expect(isPublicRoute(path), path).toBe(true);
      expect(isProtectedRoute(path), path).toBe(false);
    }
  });

  it("classifies exactly the skill documents as public machine surfaces", () => {
    const served = getCrawlRoute("/skills/loehrning-plattform/SKILL.md");
    expect(served.pattern).toBe("/skills/:name/SKILL.md");
    expect(served.routeClass).toBe("public-machine");
    expect(served.auth).toBe("public");
    expect(served.robots).toBe("allow");
    expect(served.includeInSitemap).toBe(false);
    expect(served.xRobotsTag).toBeUndefined();

    // A sibling path is not a skill document and must not inherit the class:
    // it reaches the fail-closed default, whose pattern echoes the path.
    for (const path of [
      "/skills",
      "/skills/loehrning-plattform",
      "/skills/loehrning-plattform/README.md",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.pattern, path).toBe(path);
      expect(entry.routeClass, path).toBe("public-noindex");
    }
  });

  it("keeps the OAuth consent page and its decision route protected in both locales", () => {
    for (const path of [
      "/oauth/consent",
      "/en/oauth/consent",
      "/oauth/consent/entscheidung",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("protected");
      expect(entry.auth, path).toBe("protected");
      expect(entry.robots, path).toBe("disallow");
      expect(entry.cache, path).toBe("private-no-store");
      expect(entry.xRobotsTag, path).toContain("noindex");
      expect(isProtectedRoute(path), path).toBe(true);
    }
    expect(getCrawlRoute("/en/oauth/consent")).toBe(
      getCrawlRoute("/oauth/consent"),
    );
  });

  it("keeps the agent account page and routes behind the existing protected wildcards", () => {
    for (const path of [
      "/konto/ki",
      "/en/konto/ki",
      "/api/account/agent-tokens",
      "/api/account/llm-key",
      "/api/account/chat",
      "/api/account/oauth-grants",
    ]) {
      const entry = getCrawlRoute(path);
      expect(entry.routeClass, path).toBe("protected");
      expect(entry.auth, path).toBe("protected");
      expect(entry.cache, path).toBe("private-no-store");
      expect(entry.xRobotsTag, path).toContain("noindex");
    }
  });

  it("aligns robots and the sitemap with the agent access classes", () => {
    const allow = robotsAllowPaths();
    const disallow = robotsDisallowPaths();
    for (const path of [
      "/api/mcp",
      "/api/courses.json",
      "/api/workshops.json",
      "/.well-known/oauth-protected-resource",
      "/.well-known/oauth-protected-resource/api/mcp",
      "/skills/",
    ]) {
      expect(allow, path).toContain(path);
      expect(disallow, path).not.toContain(path);
    }
    for (const path of [
      "/oauth/consent",
      "/en/oauth/consent",
      "/oauth/consent/",
      "/en/oauth/consent/",
      "/konto/",
      "/api/account/",
    ]) {
      expect(disallow, path).toContain(path);
      expect(allow, path).not.toContain(path);
    }
    // No route-matcher literal may ever ship in robots.txt.
    for (const path of [...allow, ...disallow]) {
      expect(path, path).not.toContain(":");
    }
    const sitemap = sitemapStaticPaths();
    for (const path of [
      "/api/mcp",
      "/api/courses.json",
      "/api/workshops.json",
      "/.well-known/oauth-protected-resource",
      "/oauth/consent",
      "/konto",
    ]) {
      expect(sitemap, path).not.toContain(path);
    }
  });

  it("records the AI agent policy: retrieval agents allowed, training crawlers blocked", () => {
    for (const agent of [
      "Claude-User",
      "Claude-SearchBot",
      "ChatGPT-User",
      "OAI-SearchBot",
      "PerplexityBot",
      "Perplexity-User",
    ]) {
      expect(AI_RETRIEVAL_AGENTS, agent).toContain(agent);
    }
    for (const crawler of [
      "ClaudeBot",
      "anthropic-ai",
      "GPTBot",
      "CCBot",
      "Bytespider",
      "Google-Extended",
      "Applebot-Extended",
    ]) {
      expect(AI_TRAINING_CRAWLERS, crawler).toContain(crawler);
    }
    // The two decisions are independent, so no agent may sit in both lists,
    // and neither list may repeat a name.
    const retrieval = new Set<string>(AI_RETRIEVAL_AGENTS);
    for (const crawler of AI_TRAINING_CRAWLERS) {
      expect(retrieval.has(crawler), crawler).toBe(false);
    }
    expect(retrieval.size).toBe(AI_RETRIEVAL_AGENTS.length);
    expect(new Set(AI_TRAINING_CRAWLERS).size).toBe(
      AI_TRAINING_CRAWLERS.length,
    );
  });
});
