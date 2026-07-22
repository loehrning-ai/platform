import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo/entity";

export type CrawlClass =
  | "public-indexable"
  | "public-access"
  | "public-noindex"
  | "public-machine"
  | "public-assets"
  | "protected"
  | "retired";

export type AuthBehavior = "public" | "protected" | "gone" | "redirect";
export type RobotsBehavior = "allow" | "disallow";
export type CachePolicy = "public-static" | "public-short" | "private-no-store";

export interface CrawlRoute {
  readonly pattern: string;
  readonly routeClass: CrawlClass;
  readonly auth: AuthBehavior;
  readonly robots: RobotsBehavior;
  readonly includeInSitemap: boolean;
  readonly cache: CachePolicy;
  readonly xRobotsTag?: string;
  readonly redirectTo?: string;
  readonly status?: 301 | 410;
  readonly explanation: string;
  readonly owner: string;
  readonly priority?: number;
  readonly changeFrequency?: "daily" | "weekly" | "monthly" | "yearly";
}

export const NOINDEX_HEADER = "noindex, nofollow, noarchive";

const PUBLIC_INDEXABLE_PATHS = [
  "/",
  "/einstieg",
  "/wie-ki-funktioniert",
  "/wie-ki-funktioniert/:lektionId",
  "/ki-check",
  "/kurse",
  // The 6 imported courses' own landing pages. Each is now a real static
  // route (its own page.tsx), not a match of the generic dynamic
  // "/kurse/open-source/:slug" pattern below — these must precede that
  // wildcard so verify-lighthouse-routes.ts's dynamic-candidates check
  // (built from IMPORTED_COURSE_CATALOG, which no longer lists any of
  // these 6 since they all flipped to nativeStatus "live") is not asked to
  // vouch for a URL that isn't a dynamic-route candidate anymore.
  "/kurse/open-source/claude",
  "/kurse/open-source/codex",
  "/kurse/open-source/data-infrastructure",
  "/kurse/open-source/data-engineering-fundamentals",
  "/kurse/open-source/data-science",
  "/kurse/open-source/ai-native-operator",
  "/kurse/open-source/:slug",
  "/ki-fuehrerschein",
  "/eu-ai-act-kurs",
  "/ai-native",
  "/ki-und-gesellschaft",
  "/blog",
  "/blog/:slug",
  "/buecher",
  "/buecher/:slug",
  "/demos",
  "/demos/:slug",
  "/workshops",
  "/workshops/:slug",
  "/open-source",
  "/open-source/lizenzrichtlinie",
  "/open-source/:kind/:slug",
  "/ueber-mich",
  "/ueber-die-plattform",
  "/neuigkeiten",
  "/hilfe",
  "/bekannte-grenzen",
  "/impressum",
  "/datenschutz",
] as const;

const PUBLIC_NOINDEX_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/logout",
  "/feedback",
  "/api/feedback",
  "/api/ai-native/grade-exercise",
  "/api/demos/:slug/briefing.pdf",
  // The 4 native certified courses' verification routes stay public-noindex
  // even though their /kurs* lesson content is now login-gated (below) —
  // verification exists for third parties (e.g. an employer) checking a
  // certificate is real, who have no loehrning.ai account and should not
  // need one.
  "/ki-fuehrerschein/verifizierung",
  "/eu-ai-act-kurs/verifizierung",
  "/ai-native/verifizierung",
  "/ki-und-gesellschaft/verifizierung",
  // Claude Course — added ahead of the routes themselves
  // (stage 9) so contract-completeness.test.ts never goes red mid-plan.
  "/kurse/open-source/claude/kurs/quiz",
  "/kurse/open-source/claude/kurs/zertifikat",
  "/kurse/open-source/claude/verifizierung",
  // Codex Course — added ahead of the routes themselves so
  // contract-completeness.test.ts never goes red mid-migration.
  // No "/kurs/quiz" entry: codex has no separate gating quiz, it uses the
  // generic all-lessons-completed "completion" eligibility path, so no such
  // route is ever built.
  "/kurse/open-source/codex/kurs/zertifikat",
  "/kurse/open-source/codex/verifizierung",
  // Data Infrastructure course — added ahead of the
  // routes themselves (stage 10) so contract-completeness.test.ts never
  // goes red mid-plan. No "/kurs/quiz" entry: this course has no separate
  // gating quiz either, it uses the same generic all-lessons-completed
  // "completion" eligibility path as codex.
  "/kurse/open-source/data-infrastructure/kurs/zertifikat",
  "/kurse/open-source/data-infrastructure/verifizierung",
  // Data Engineering Fundamentals course (, corrected stage
  // 10): unlike claude/codex/data-infrastructure, this course's Done
  // Criteria puts all 12 chapters directly under
  // data-engineering-fundamentals/[chapterId] — no "/kurs" segment, since
  // source has no natural index-vs-reader split (its own "Overview" chapter
  // already plays that role, ported as chapterId "home"). No "/quiz" entry:
  // this course has no quiz mechanism in source at all, it uses the same
  // generic all-lessons-completed "completion" eligibility path as codex/
  // data-infrastructure.
  "/kurse/open-source/data-engineering-fundamentals/zertifikat",
  "/kurse/open-source/data-engineering-fundamentals/verifizierung",
  // Data Science course — added ahead of the routes
  // themselves (stage 5) so contract-completeness.test.ts never goes red
  // mid-plan. Same shape as data-engineering-fundamentals: chapters live
  // directly under data-science/[chapterSlug] — no "/kurs" segment — and
  // no "/quiz" entry, since this course has no quiz mechanism in source at
  // all and uses the generic all-lessons-completed "completion"
  // eligibility path.
  "/kurse/open-source/data-science/zertifikat",
  "/kurse/open-source/data-science/verifizierung",
  // AI-Native Operator course — added ahead of the real
  // routes (stages 7-10) so contract-completeness.test.ts never goes red
  // mid-plan. Same flat-course-root shape as data-engineering-fundamentals/
  // data-science (no "/kurs" segment): 9 modules x 39 lessons live directly
  // under the course root. Unlike those two, this course DOES have a real
  // quiz gate (9 module knowledge-checks pooled into one workshop quiz), so
  // it gets its own "/quiz" entry, matching claude's precedent.
  "/kurse/open-source/ai-native-operator/quiz",
  "/kurse/open-source/ai-native-operator/zertifikat",
  "/kurse/open-source/ai-native-operator/verifizierung",
] as const;

// ─── Adding a new course's routes ───────────────────
//
// contract-completeness.test.ts walks the real src/app tree and fails the
// build the moment ANY page.tsx/route.ts lands without a matching entry
// below — this is not optional documentation, it is a CI gate. Every course
// plan (008-013) adding real native routes must add its contract entries in
// the SAME commit as the routes themselves, not as an afterthought once CI
// already failed.
//
// Mirror the existing Claude Course entries as the template:
//   - the course-reader tree (lesson pages, block index, etc.) goes in
//     PUBLIC_ACCESS_PATHS below, as a "/:course/kurs" + "/:course/kurs/:path*"
//     pair — see "/kurse/open-source/claude/kurs" +
//     "/kurse/open-source/claude/kurs/:path*". Public learning content,
//     intentionally accessible without login, but deliberately NOT in the
//     sitemap (courses are discovered via /kurse, not indexed lesson-by-lesson).
//   - the workshop-quiz and certificate screens go in PUBLIC_NOINDEX_PATHS
//     as exact (non-wildcard) entries — see
//     "/kurse/open-source/claude/kurs/quiz" and
//     "/kurse/open-source/claude/kurs/zertifikat". Crawlable so crawlers can
//     SEE the noindex tag (never blocked via robots.txt), but never indexed:
//     a quiz/certificate page has no content value for search or AI
//     retrieval and the certificate route encodes a QR payload in the URL
//     hash that must never end up in a search snippet.
//   - the verification route (if the course issues a certificate) is also
//     PUBLIC_NOINDEX_PATHS — see "/kurse/open-source/claude/verifizierung" —
//     for the same QR-payload-in-URL reason.
// Any other bespoke top-level route a course plan builds (a glossary, a
// demo gallery, ...) follows the same PUBLIC_ACCESS_PATHS pattern as
// "/ai-native/glossar"/"/ai-native/demos" above: public, accessible, out of
// the sitemap unless there is a specific reason to index it.
//
// Exception — the 4 native certified courses (ki-fuehrerschein,
// eu-ai-act-kurs, ai-native, ki-und-gesellschaft): their lesson content
// (/:course/kurs + /:course/kurs/:path*, which also covers their nested
// quiz/zertifikat pages) is login-gated in PROTECTED_PATHS instead of this
// template — see the comment there. Only their landing pages and
// /verifizierung stay public.

const PUBLIC_ACCESS_PATHS = [
  "/ai-native/demos",
  "/ai-native/demos/:path*",
  "/ai-native/fluency-test",
  "/ai-native/glossar",
  "/ai-native/capstone-gallery",
  // Claude Course — see the noindex entries above.
  "/kurse/open-source/claude/kurs",
  "/kurse/open-source/claude/kurs/:path*",
  // Codex Course — see the noindex entries above.
  "/kurse/open-source/codex/kurs",
  "/kurse/open-source/codex/kurs/:path*",
  // Data Infrastructure course — see the noindex entries above.
  "/kurse/open-source/data-infrastructure/kurs",
  "/kurse/open-source/data-infrastructure/kurs/:path*",
  // Data Engineering Fundamentals course — see the
  // noindex-block comment above: the 12 chapters live directly under the
  // course root, so one wildcard covers them all instead of the "/kurs" +
  // "/kurs/:path*" pair every other course uses. The bare course root
  // itself has its own explicit static entry in PUBLIC_INDEXABLE_PATHS
  // above (it is a real page.tsx now, not the dynamic [slug] route).
  "/kurse/open-source/data-engineering-fundamentals/:path*",
  // Data Science course 
  // — same flat-chapter shape as data-engineering-fundamentals above.
  "/kurse/open-source/data-science/:path*",
  // AI-Native Operator course (, ahead of stages 7-8's real
  // routes) — one wildcard covers both the "/:moduleId" module-hub routes
  // and the "/:moduleId/:lessonNum" lesson routes (no "/kurs" segment),
  // same flat-course-root shape as data-engineering-fundamentals/data-science.
  "/kurse/open-source/ai-native-operator/:path*",
] as const;

const PUBLIC_MACHINE_PATHS = [
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/api/books.json",
  "/api/knowledge-graph.json",
  "/api/health",
] as const;

const PUBLIC_ASSET_PATHS = [
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-192-maskable.png",
  "/icon-512-maskable.png",
  "/og-image.png",
  "/logo.svg",
  "/logo-white.svg",
  "/logo-square-512.png",
  "/site.webmanifest",
  "/book-covers/:path*",
  "/imported-courses/:path*",
  "/ueber-mich/tim-loehr.jpg",
  "/logo/:path*",
  "/workshops/:slug/:path*",
  "/_next/:path*",
  "/opengraph-image",
] as const;

// File-convention OG/Twitter images emit as .png, both at the root and under
// dynamic page prefixes (e.g. /blog/<slug>/opengraph-image.png). They must be
// classified before the broad dynamic page patterns (/blog/:slug etc.) or
// they would be shadowed into public-indexable/public-access.
const OG_IMAGE_ASSET_PATHS = [
  "/opengraph-image.png",
  "/twitter-image.png",
  "/:path*/opengraph-image.png",
  "/:path*/twitter-image.png",
] as const;

const PROTECTED_PATHS = [
  "/konto",
  "/konto/:path*",
  "/api/account/:path*",
  "/api/progress",
  "/api/progress/:path*",
  "/api/ai-native/:path*",
  "/api/demos/:path*",
  "/api/buecher/:slug/download.pdf",
  // The 4 native certified courses' lesson content requires login (unlike
  // every other course, which stays optional-account per policy D1 — see
  // src/lib/auth/routes.test.ts). Each course's "/kurs/:path*" wildcard also
  // covers its nested quiz/zertifikat pages, so no separate entries are
  // needed for those. Landing pages and /verifizierung stay public — see
  // PUBLIC_INDEXABLE_PATHS / PUBLIC_NOINDEX_PATHS above.
  "/ki-fuehrerschein/kurs",
  "/ki-fuehrerschein/kurs/:path*",
  "/eu-ai-act-kurs/kurs",
  "/eu-ai-act-kurs/kurs/:path*",
  "/ai-native/kurs",
  "/ai-native/kurs/:path*",
  "/ki-und-gesellschaft/kurs",
  "/ki-und-gesellschaft/kurs/:path*",
] as const;

const RETIRED_ROUTES: readonly CrawlRoute[] = [
  route("/downloads/:path*.pdf", "retired", "Retired PDF downloads return 410.", {
    auth: "gone",
    robots: "disallow",
    cache: "public-short",
    status: 410,
  }),
  route("/foerdermittel", "retired", "Commercial funding page removed.", {
    auth: "gone",
    robots: "disallow",
    cache: "public-short",
    status: 410,
  }),
  route("/leistungen", "retired", "Commercial service page redirects to platform trust.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/ueber-die-plattform",
    status: 301,
  }),
  route("/leistungen/:path*", "retired", "Commercial service pages redirect to platform trust.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/ueber-die-plattform",
    status: 301,
  }),
  route("/kontakt", "retired", "Contact funnel retired; feedback is the public input path.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/feedback",
    status: 301,
  }),
  route("/ki-transformation-check", "retired", "Commercial diagnostic route retired.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/ki-check",
    status: 301,
  }),
  route("/arbeitsweise", "retired", "Legacy platform route renamed.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/ueber-die-plattform",
    status: 301,
  }),
  route("/standortbestimmung", "retired", "Route renamed to /ki-check.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/ki-check",
    status: 301,
  }),
  route("/daten-audit", "retired", "Commercial audit route retired.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/ueber-die-plattform",
    status: 301,
  }),
  route("/digifyde", "retired", "Legacy diagnostic brand route retired.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/ki-check",
    status: 301,
  }),
  route("/ki-readiness", "retired", "Legacy readiness route retired.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/ki-check",
    status: 301,
  }),
  route("/eu-ai-act-check", "retired", "Legacy diagnostic route retired.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/ki-check",
    status: 301,
  }),
  route("/eu-ai-act-check/:path*", "retired", "Legacy diagnostic route retired.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/ki-check",
    status: 301,
  }),
  route("/methodik", "retired", "Legacy methodology route consolidated into blog.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/blog",
    status: 301,
  }),
  route("/blog/digify", "retired", "Retired commercial blog post.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/blog",
    status: 301,
  }),
  route("/blog/ki-beratungsluecke", "retired", "Retired commercial blog post.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/blog/eu-ai-act-grundlagen",
    status: 301,
  }),
  // Retired in the open-source split (2026-07-16). These four were previously
  // indexable, so they need 301s rather than bare 404s: /glossar was in
  // PUBLIC_INDEXABLE_PATHS, and the three posts shipped with OG images.
  route("/glossar", "retired", "Glossary moved under the AI-native course.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/ai-native/glossar",
    status: 301,
  }),
  route("/blog/deepfake-erkennen", "retired", "Retired blog post.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/blog",
    status: 301,
  }),
  route("/blog/eu-ai-act-update-2026-06", "retired", "Superseded by the definitive EU AI Act post.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/blog/eu-ai-act-grundlagen",
    status: 301,
  }),
  route("/blog/ki-und-arbeit", "retired", "Retired blog post.", {
    auth: "redirect",
    robots: "disallow",
    cache: "public-short",
    redirectTo: "/blog",
    status: 301,
  }),
];

function route(
  pattern: string,
  routeClass: CrawlClass,
  explanation: string,
  overrides: Partial<CrawlRoute> = {},
): CrawlRoute {
  const protectedRoute = routeClass === "protected";
  const retiredRoute = routeClass === "retired";
  const noindex = routeClass === "public-noindex" || protectedRoute || retiredRoute;
  return {
    pattern,
    routeClass,
    auth: protectedRoute ? "protected" : retiredRoute ? "gone" : "public",
    robots: protectedRoute || retiredRoute ? "disallow" : "allow",
    // Sitemap membership is explicit per pattern (public-content contract):
    // public-indexable patterns default to inclusion; ":"-patterns are
    // enumerated per known slug in src/app/sitemap.ts. Keeping a pattern out
    // of the sitemap requires an explicit includeInSitemap: false override
    // (e.g. /buecher/:slug/:chapter), never a silent ":"-filter.
    includeInSitemap: routeClass === "public-indexable",
    cache: protectedRoute ? "private-no-store" : routeClass === "public-assets" ? "public-static" : "public-short",
    xRobotsTag: noindex ? NOINDEX_HEADER : undefined,
    explanation,
    owner: "crawl-contract",
    ...overrides,
  };
}

export const CRAWL_CONTRACT: readonly CrawlRoute[] = [
  // Specific retired routes must precede broad dynamic patterns such as
  // /blog/:slug so redirects and 410 responses cannot be shadowed.
  ...RETIRED_ROUTES,
  ...OG_IMAGE_ASSET_PATHS.map((path) =>
    route(path, "public-assets", "Public OG/Twitter image asset.", {
      includeInSitemap: false,
    }),
  ),
  ...PUBLIC_INDEXABLE_PATHS.map((path) =>
    route(path, "public-indexable", "Public canonical HTML for search and AI retrieval.", {
      priority: path === "/" ? 1 : path === "/kurse" ? 0.85 : 0.6,
      changeFrequency: path === "/" || path === "/kurse" || path === "/blog" ? "weekly" : "monthly",
    }),
  ),
  // Book chapter readers carry index metadata (see src/app/buecher/[slug]/[chapter]/page.tsx)
  // but stay out of the sitemap by deliberate per-pattern flag; public-content contract
  // owns sitemap semantics for detail pages.
  route("/buecher/:slug/:chapter", "public-indexable", "Public book chapter reader for search and AI retrieval.", {
    includeInSitemap: false,
    priority: 0.6,
    changeFrequency: "monthly",
  }),
  // Exact noindex utility routes must precede course-reader catch-alls.
  ...PUBLIC_NOINDEX_PATHS.map((path) =>
    route(path, "public-noindex", "Public utility page; crawlable so crawlers can see noindex."),
  ),
  ...PUBLIC_ACCESS_PATHS.map((path) =>
    route(path, "public-access", "Public learning content intentionally accessible without login but not listed in sitemap."),
  ),
  ...PUBLIC_MACHINE_PATHS.map((path) =>
    route(path, "public-machine", "Public machine-readable surface.", {
      includeInSitemap: false,
    }),
  ),
  ...PUBLIC_ASSET_PATHS.map((path) =>
    route(path, "public-assets", "Public static proof or platform asset.", {
      includeInSitemap: false,
    }),
  ),
  ...PROTECTED_PATHS.map((path) =>
    route(path, "protected", "Private account, state, or provider-backed API surface."),
  ),
];

export function matchesPattern(pathname: string, pattern: string): boolean {
  if (pattern === pathname) return true;
  const regex = pattern
    .split("/")
    .map((segment) => {
      if (segment === "") return "";
      if (segment === ":path*") return ".*";
      if (segment === ":path*.pdf") return ".*\\.pdf";
      if (segment.startsWith(":")) return "[^/]+";
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return new RegExp(`^${regex}$`).test(pathname);
}

export function getCrawlRoute(pathname: string): CrawlRoute {
  const explicit = CRAWL_CONTRACT.find((entry) =>
    matchesPattern(pathname, entry.pattern),
  );
  if (explicit) return explicit;
  // Fail-closed defaults: an unlisted route is noindex until it earns an
  // explicit CRAWL_CONTRACT class. An unlisted /api/* path additionally
  // defaults to auth "protected" so a future authenticated API route added
  // without a contract entry still gets the middleware auth gate
  // (src/middleware.ts via isProtectedPlatformPath). Page paths keep the
  // public default so they still resolve, with X-Robots-Tag: noindex.
  if (pathname.startsWith("/api/")) {
    return route(
      pathname,
      "protected",
      "Unlisted API route defaults to protected + noindex (fail-closed). Add an explicit contract class.",
    );
  }
  return route(
    pathname,
    "public-noindex",
    "Unlisted route defaults to noindex (fail-closed). Add an explicit contract class before indexing.",
  );
}

export function isPublicRoute(pathname: string): boolean {
  const entry = getCrawlRoute(pathname);
  return entry.auth === "public";
}

export function isProtectedRoute(pathname: string): boolean {
  return getCrawlRoute(pathname).auth === "protected";
}

export function isRetiredRoute(pathname: string): boolean {
  return getCrawlRoute(pathname).routeClass === "retired";
}

// Static (non-":") sitemap URLs only. Dynamic ":"-patterns with
// includeInSitemap: true are not silently dropped: src/app/sitemap.ts
// enumerates their known slugs from the catalogs.
export function sitemapStaticPaths(): readonly string[] {
  return CRAWL_CONTRACT
    .filter((entry) => entry.includeInSitemap && !entry.pattern.includes(":"))
    .map((entry) => entry.pattern);
}

export function robotsAllowPaths(): readonly string[] {
  return Array.from(
    new Set(
      CRAWL_CONTRACT
        .filter((entry) => entry.robots === "allow")
        .map((entry) => robotsPattern(entry.pattern)),
    ),
  );
}

export function robotsDisallowPaths(): readonly string[] {
  return Array.from(
    new Set(
      CRAWL_CONTRACT
        .filter((entry) => entry.robots === "disallow")
        .map((entry) => robotsPattern(entry.pattern)),
    ),
  );
}

function robotsPattern(pattern: string): string {
  if (pattern.startsWith("/api/") && pattern.includes("/:slug/")) {
    return pattern.replace("/:slug/", "/*/");
  }
  const collapsed = pattern
    .replace(/\/:path\*\.pdf$/, "/")
    .replace(/\/:path\*$/, "/")
    .replace(/\/:kind\/:slug$/, "/")
    .replace(/\/:slug\/:chapter$/, "/")
    .replace(/\/:slug$/, "/")
    .replace(/\/:lektionId$/, "/");
  // Strip any residual interior route-matcher segment (e.g. /workshops/:slug/)
  // so no ":"-parameter literal ever ships in robots.txt.
  const interiorParam = collapsed.indexOf("/:");
  return interiorParam === -1
    ? collapsed
    : `${collapsed.slice(0, interiorParam)}/`;
}

export function canonicalFor(pathname: string): string {
  return absoluteUrl(pathname);
}

export function cacheHeaderFor(entry: CrawlRoute): string {
  if (entry.cache === "private-no-store") return "private, no-store";
  if (entry.cache === "public-static") return "public, max-age=31536000, immutable";
  return "public, max-age=3600, s-maxage=3600";
}

export { SITE_ORIGIN };
