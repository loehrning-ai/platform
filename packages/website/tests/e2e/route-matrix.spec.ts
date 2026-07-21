/**
 * Route-matrix and no-leak tests (accessibility hardening).
 *
 * Verifies the complete route/auth/discoverability contract for the platform:
 * - Public routes return HTTP 200 without auth redirect
 * - Gated routes redirect anonymous requests to /login
 * - Protected API routes return 401 for anonymous requests
 * - Sitemap, llms.txt, and robots.txt do NOT expose gated content
 *
 * These tests use raw page.request.get() for HTTP-level checks and do NOT
 * require the authenticated fixture. They run in both chromium and mobile
 * projects.
 *
 * Route contract: /ueber-mich, /ueber-die-plattform, and public resources are public.
 * Route contract: /arbeitsweise is retired and redirects to /ueber-die-plattform.
 * Route contract: /foerdermittel is 410 Gone (deleted by public-content transition).
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Public routes: expect 200, no login redirect
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES = [
  "/",
  "/einstieg",
  "/wie-ki-funktioniert",
  "/ki-check",
  "/kurse",
  "/ki-fuehrerschein",
  "/eu-ai-act-kurs",
  "/ai-native",
  "/ki-und-gesellschaft",
  //: claude's landing (nested under /kurse/open-source/,
  // unlike the four top-level German courses above).
  "/kurse/open-source/claude",
  //: codex's landing, same nested convention as claude.
  "/kurse/open-source/codex",
  //: data-infrastructure's landing, same nested convention.
  "/kurse/open-source/data-infrastructure",
  //: data-engineering-fundamentals's landing, same nested
  // convention — note its chapter tree has no "/kurs" segment (unlike the
  // three courses above), see the sitemap no-leak test below.
  "/kurse/open-source/data-engineering-fundamentals",
  //: data-science's landing, same nested convention and
  // no-"/kurs"-segment chapter tree as data-engineering-fundamentals above
  // — its Overview additionally renders AT this exact route (not a
  // separate "/home" chapter), see the sitemap no-leak test below.
  "/kurse/open-source/data-science",
  //: ai-native-operator's landing, sixth and last
  // imported course to flip. Same nested convention and no-"/kurs"-segment
  // module/lesson tree as data-engineering-fundamentals/data-science above.
  "/kurse/open-source/ai-native-operator",
  "/blog",
  "/open-source",
  "/open-source/lizenzrichtlinie",
  "/buecher",
  "/demos",
  "/neuigkeiten",
  "/hilfe",
  "/bekannte-grenzen",
  "/feedback",
  "/login",
  "/impressum",
  "/datenschutz",
  "/ueber-mich",
  "/ueber-die-plattform",
  // Note: /foerdermittel is 410 Gone (deleted by public-content transition) — not tested as 200
] as const;

test.describe("public routes return 200", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} is accessible without auth`, async ({ page }) => {
      const browserErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });
      page.on("pageerror", (error) => browserErrors.push(error.message));
      const response = await page.goto(route, { waitUntil: "load" });
      expect(
        response?.status(),
        `Expected 200 for ${route}`,
      ).toBe(200);
      if (route === "/login") {
        expect(new URL(page.url()).pathname).toBe("/login");
      } else {
        expect(
          page.url(),
          `${route} must not redirect to login`,
        ).not.toContain("/login");
      }
      expect(
        browserErrors,
        `Browser errors on ${route}:\n${browserErrors.join("\n")}`,
      ).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// Blog posts: check a known post slug
// ---------------------------------------------------------------------------

test("blog post is accessible without auth", async ({ page }) => {
  const response = await page.goto("/blog/eu-ai-act-grundlagen");
  expect(response?.status()).toBe(200);
  expect(page.url()).not.toContain("/login");
});

// ---------------------------------------------------------------------------
// Course landing pages (no auth wall on landing)
// ---------------------------------------------------------------------------

test("ki-und-gesellschaft landing is public", async ({ page }) => {
  const response = await page.goto("/ki-und-gesellschaft");
  expect(response?.status()).toBe(200);
  expect(page.url()).not.toContain("/login");
});

// ---------------------------------------------------------------------------
// Gated routes: anonymous request must redirect to /login
// ---------------------------------------------------------------------------

const GATED_ROUTES = ["/konto"] as const;

test.describe("gated routes redirect anonymous users", () => {
  for (const route of GATED_ROUTES) {
    test(`${route} redirects to /login without auth`, async ({ page }) => {
      await page.goto(route);
      // After following all redirects, should land on /login
      expect(
        page.url(),
        `${route} must redirect to /login for anonymous user`,
      ).toContain("/login");
    });
  }
});

// ---------------------------------------------------------------------------
// API auth gates: 401 for anonymous requests
// ---------------------------------------------------------------------------

test("GET /api/progress returns 401 for anonymous user", async ({ request }) => {
  const response = await request.get("/api/progress");
  expect([401, 503]).toContain(response.status());
});

test("GET /api/books.json returns 200 (public)", async ({ request }) => {
  const response = await request.get("/api/books.json");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.library_requires_login).toBe(false);
  expect(Array.isArray(body.books)).toBe(true);
});

test("GET /api/knowledge-graph.json returns 200 (public)", async ({ request }) => {
  const response = await request.get("/api/knowledge-graph.json");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.site.url).toBe("https://loehrning.ai");
});

// ---------------------------------------------------------------------------
// No-leak assertions: sitemap, llms.txt, robots.txt
// ---------------------------------------------------------------------------

test.describe("sitemap lists only contract-included paths", () => {
  test("sitemap.xml does not contain /konto", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body, "sitemap must not expose /konto").not.toContain("/konto");
  });

  test("sitemap.xml lists /buecher/<slug> detail pages but not chapter reader paths", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    // public-content contract decision: /buecher/<slug> detail pages are public,
    // indexable, and listed in the sitemap; /buecher/<slug>/<chapter> reader
    // paths stay out by explicit contract flag (includeInSitemap: false).
    expect(body, "sitemap must list book detail pages").toMatch(
      /\/buecher\/[a-z0-9-]+</,
    );
    expect(body, "sitemap must not list chapter reader paths").not.toMatch(
      /\/buecher\/[a-z0-9-]+\/[^<]/,
    );
  });

  test("sitemap.xml does not contain /ki-fuehrerschein/kurs", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).not.toContain("/ki-fuehrerschein/kurs");
  });

  test("sitemap.xml does not contain /eu-ai-act-kurs/kurs", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).not.toContain("/eu-ai-act-kurs/kurs");
  });

  test("sitemap.xml does not contain /ai-native/kurs", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).not.toContain("/ai-native/kurs");
  });

  //: claude's reader tree is public-access (not indexed),
  // same convention as the other three courses' /kurs subtrees above.
  test("sitemap.xml does not contain /kurse/open-source/claude/kurs", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).not.toContain("/kurse/open-source/claude/kurs");
  });

  //: codex's reader tree is public-access (not indexed),
  // same convention as claude's above.
  test("sitemap.xml does not contain /kurse/open-source/codex/kurs", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).not.toContain("/kurse/open-source/codex/kurs");
  });

  //: data-infrastructure's reader tree is public-access
  // (not indexed), same convention as claude/codex above.
  test("sitemap.xml does not contain /kurse/open-source/data-infrastructure/kurs", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).not.toContain("/kurse/open-source/data-infrastructure/kurs");
  });

  //: data-engineering-fundamentals's chapter tree has no
  // "/kurs" segment (unlike claude/codex/data-infrastructure above) — the
  // no-leak check instead confirms a real chapter path never appears,
  // while the bare course root DOES appear (public-indexable via the
  // generic "/kurse/open-source/:slug" pattern).
  test("sitemap.xml lists the data-engineering-fundamentals landing but not its chapter routes", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/kurse/open-source/data-engineering-fundamentals<");
    expect(body).not.toContain("/kurse/open-source/data-engineering-fundamentals/home");
    expect(body).not.toContain("/kurse/open-source/data-engineering-fundamentals/fund");
  });

  //: data-science's chapter tree has no "/kurs" segment
  // either, and unlike data-engineering-fundamentals its Overview renders
  // directly AT the bare course root (no "/home" sub-path at all) — the
  // no-leak check confirms a real numbered-chapter path never appears,
  // while the bare course root DOES appear.
  test("sitemap.xml lists the data-science landing but not its chapter routes", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/kurse/open-source/data-science<");
    expect(body).not.toContain("/kurse/open-source/data-science/fund");
    expect(body).not.toContain("/kurse/open-source/data-science/cap");
  });

  //: ai-native-operator's module/lesson tree has no
  // "/kurs" segment either — the no-leak check confirms a real module or
  // lesson path never appears, while the bare course root DOES appear.
  test("sitemap.xml lists the ai-native-operator landing but not its module/lesson routes", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).toContain("/kurse/open-source/ai-native-operator<");
    expect(body).not.toContain("/kurse/open-source/ai-native-operator/mindset");
    expect(body).not.toContain("/kurse/open-source/ai-native-operator/measurement");
  });

  test("sitemap.xml does not contain /ki-transformation-check", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();
    expect(body).not.toContain("/ki-transformation-check");
  });
});

test.describe("llms.txt does not expose gated content", () => {
  test("llms.txt does not contain /konto", async ({ request }) => {
    const response = await request.get("/llms.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body, "llms.txt must not expose /konto").not.toContain("/konto");
  });

  test("llms.txt does not contain /ki-transformation-check", async ({
    request,
  }) => {
    const response = await request.get("/llms.txt");
    const body = await response.text();
    expect(body).not.toContain("/ki-transformation-check");
  });
});

test.describe("robots.txt contains required disallow rules", () => {
  test("robots.txt disallows /konto", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body, "robots.txt must Disallow /konto").toContain("/konto");
  });

  test("robots.txt disallows /api/ paths", async ({ request }) => {
    const response = await request.get("/robots.txt");
    const body = await response.text();
    // At minimum, /api/progress must be disallowed
    expect(body, "robots.txt must Disallow /api/progress").toContain(
      "/api/progress",
    );
  });
});

// ---------------------------------------------------------------------------
// Middleware header contract (public-content contract): the matcher excludes
// _next/image, _next/data, and static asset extensions, so these tests prove
// crawl-contract headers still apply to HTML routes and retired routes.
// ---------------------------------------------------------------------------

test.describe("middleware applies crawl-contract headers", () => {
  test("provider-free runtime ships restrictive security headers", async ({
    request,
  }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    const headers = response.headers();
    const csp = headers["content-security-policy"] ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("supabase.co");
    expect(csp).not.toContain("sentry.io");
    expect(csp).not.toContain("vercel-scripts.com");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("/feedback (public-noindex HTML route) carries X-Robots-Tag noindex", async ({
    request,
  }) => {
    const response = await request.get("/feedback");
    expect(response.status()).toBe(200);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  });

  test("/ (public-indexable HTML route) carries no X-Robots-Tag", async ({
    request,
  }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    expect(response.headers()["x-robots-tag"]).toBeUndefined();
  });

  test("retired /downloads PDF returns 410 with contract headers", async ({
    request,
  }) => {
    const response = await request.head("/downloads/ki-landschaft-2026.pdf");
    expect(response.status()).toBe(410);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    expect(response.headers()["cache-control"]).toContain("public");
    expect(response.headers()["cache-control"]).toContain("max-age=3600");
  });
});

// ---------------------------------------------------------------------------
// Overflow test at 320px (WCAG 1.4.10 Reflow)
// covered here as a lightweight check without authenticated content
// ---------------------------------------------------------------------------

const REFLOW_ROUTES = ["/", "/kurse", "/ki-fuehrerschein", "/impressum"] as const;

test.describe("no horizontal overflow at 320px (WCAG 1.4.10)", () => {
  for (const route of REFLOW_ROUTES) {
    test(`${route} has no overflow at 320px width`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto(route);
      // Wait for layout to settle
      await page.waitForTimeout(500);
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      expect(
        scrollWidth,
        `${route}: scrollWidth ${scrollWidth} exceeds 320px — horizontal overflow at 320px`,
      ).toBeLessThanOrEqual(320);
    });
  }
});
