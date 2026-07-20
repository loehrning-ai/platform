import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * @visual pixel-regression baselines for the platform's key pages (release hardening
 * ). Turns the otherwise-inert threshold in playwright.config.ts
 * (expect.toHaveScreenshot.maxDiffPixelRatio = 0.02) into a REAL gate: a
 * full-page screenshot of each route is diffed against a CI-generated
 * baseline, so an unintended layout or style regression fails while a prose
 * refresh (masked dynamic content aside) does not move enough pixels to trip
 * the 2% ratio.
 *
 * WHY THIS STAYS GREEN WITH NO BASELINES ON DISK
 * Baselines are CI-generated ONLY, never committed from a local machine (a
 * darwin run and the linux CI run produce different platform-suffixed PNGs).
 * So every test here is gated behind RUN_VISUAL and SKIPPED by default. A
 * normal `bunx playwright test` run reports these as skipped, not failed, and
 * no baseline directory is created or needed (the config sets no
 * snapshotPathTemplate, so the default `tests/e2e/visual.spec.ts-snapshots/`
 * applies once baselines exist). CI's baseline job runs
 * `RUN_VISUAL=1 bunx playwright test tests/e2e/visual.spec.ts --update-snapshots`
 * once, then a clean `RUN_VISUAL=1 ...` re-run must be diff-clean.
 *
 * DETERMINISM (what makes a baseline reproducible)
 *  - reducedMotion 'reduce' (test.use) engages MotionConfig reducedMotion=
 *    "user" from motion-provider.tsx: transform and layout tweens resolve to
 *    their final state instantly.
 *  - animations:'disabled' at capture fast-forwards any remaining CSS or Web
 *    Animation to its end state.
 *  - a full scroll-through first TRIGGERS every Framer whileInView reveal.
 *    Reduced motion KEEPS opacity fades, so an off-screen element sits at
 *    opacity:0 until it enters the viewport (the "reduced-motion void" trap
 *    from the plan). Scrolling reveals them; animations:'disabled' then
 *    freezes them at opacity:1. document.fonts.ready plus networkidle settle
 *    web fonts and lazy images (book covers) before pixels are compared.
 *  - dynamic regions are MASKED, never asserted: the hero's live MEZ clock,
 *    scroll-driven globe and parallax ([data-section="hero"]); the
 *    client-derived footer year (the contentinfo landmark); and the
 *    localStorage-backed /kurse progress (pct, dots, certified badge,
 *    gamification banner). Masking, not prose assertions, is what keeps a
 *    content refresh green.
 *  - WebKit caps a raw screenshot at 32767 DEVICE px. Both explicit mobile
 *    projects use iPhone 13 at dpr 3, so the clip height is bounded to
 *    floor(30000 / dpr)
 *    CSS px. For every route here scrollHeight is far below that, so the clip
 *    is a no-op safety net today and only guards against future content growth.
 *
 * Desktop and mobile viewports come from the `chromium`, `mobile-chromium`,
 * and `mobile-webkit` projects in playwright.config.ts; toHaveScreenshot
 * suffixes each baseline with the project and platform.
 *
 * Complements tests/e2e/visual-regression.spec.ts (kept as-is), which is a
 * byte-size "not blank" smoke and deliberately does NOT pixel-diff. This spec
 * adds the real per-pixel baseline the smoke never had.
 */

// Book overview + one content-rich chapter reader, mirroring the slugs used by
// a11y-reader.spec.ts and the buecher-reader specs so the reader surface under
// visual watch matches the reader surface under a11y and interaction watch.
const BOOK = "ki-arbeitsalltag";
const CHAPTER = "02_persoenliches_profil";

/* ── Mask helpers (role / test-id / data-attr, never prose) ──────────────── */

// The site footer (root layout <footer> maps to the contentinfo landmark).
// Its copyright line renders `© {year} loehrning.ai · Tim Löhr` where `year`
// is derived client-side in footer.tsx (new Date().getFullYear() in a
// useEffect), so it is dynamic across a year boundary. footer.test.tsx already
// guards the footer's content; here we mask the whole landmark so the year
// cannot introduce a false diff.
function siteFooter(page: Page): Locator {
  return page.getByRole("contentinfo");
}

// The homepage hero (hero.tsx) is the single [data-section="hero"] element and
// is the most dynamic region on the site: a per-second MEZ/MESZ clock, a
// scroll-driven globe/network, live coordinate readouts and a scroll parallax.
// None of it is reproducible pixel-for-pixel, so the whole section is masked.
function heroSection(page: Page): Locator {
  return page.locator('[data-section="hero"]');
}

// The /kurse course cards expose localStorage-backed progress (course-gallery
// .tsx): the percentage flips from a pre-hydration placeholder to a hydrated
// value, the dot progressbar fills, and the certified badge plus the
// gamification banner appear only
// once there is stored progress. On a fresh Playwright context all of these
// are at their empty/hydration-transitional state, so mask every progress
// surface rather than depend on it. A locator that matches zero elements (the
// badge/banner on a fresh context) is a harmless no-op mask.
function kurseProgress(page: Page): Locator {
  return page.locator(
    '[data-testid^="progress-pct-"], [data-testid^="progress-dots-"], [data-testid^="certified-"], [data-testid="kurse-gamification"]',
  );
}

/* ── Route matrix ────────────────────────────────────────────────────────── */

interface VisualRoute {
  readonly name: string;
  readonly path: string;
  readonly masks: (page: Page) => Locator[];
}

// Six real, stable routes (all verified present under src/app): the homepage,
// the course hub, the books library, a book overview, a chapter reader, and
// the most stable legal page. Every route's masks include the global footer.
const ROUTES: readonly VisualRoute[] = [
  {
    name: "home",
    path: "/",
    masks: (page) => [heroSection(page), siteFooter(page)],
  },
  {
    name: "kurse",
    path: "/kurse",
    masks: (page) => [kurseProgress(page), siteFooter(page)],
  },
  {
    name: "buecher-library",
    path: "/buecher",
    masks: (page) => [siteFooter(page)],
  },
  {
    name: "buecher-overview",
    path: `/buecher/${BOOK}`,
    masks: (page) => [siteFooter(page)],
  },
  {
    name: "buecher-chapter-reader",
    path: `/buecher/${BOOK}/${CHAPTER}`,
    masks: (page) => [siteFooter(page)],
  },
  {
    name: "impressum",
    path: "/impressum",
    masks: (page) => [siteFooter(page)],
  },
] as const;

/* ── Capture ─────────────────────────────────────────────────────────────── */

// Scroll top -> bottom -> top so every IntersectionObserver-driven Framer
// whileInView reveal fires (see the file header's void-trap note). One-shot
// reveals stay revealed after we return to the top.
async function revealAllSections(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(1, window.innerHeight);
    const max = document.documentElement.scrollHeight;
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await frame();
    }
    window.scrollTo(0, max);
    await frame();
    window.scrollTo(0, 0);
    await frame();
  });
}

async function captureRoute(page: Page, route: VisualRoute): Promise<void> {
  await page.goto(route.path, { waitUntil: "load" });

  // Readiness verified from real content, not a first-paint snapshot: the page
  // rendered an h1 (chapter readers render two by design, hence .first()) and
  // did not fall into an error boundary. Mirrors visual-regression.spec.ts.
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");

  await revealAllSections(page);

  // Settle fonts and lazy-loaded images before measuring height or comparing
  // pixels (a font swap or a late cover would shift layout / diff). Resolve to
  // a serializable value: document.fonts.ready yields a FontFaceSet, which
  // page.evaluate cannot serialize back.
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.waitForLoadState("networkidle");

  // Bound the clip height so the raw WebKit capture (device px) stays under the
  // 32767 ceiling on the dpr-3 mobile projects. min() means the clip equals the
  // full page for every route here (all are far shorter), so it does not crop
  // real content today.
  const { scrollHeight, clientWidth, dpr } = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientWidth: document.documentElement.clientWidth,
    dpr: window.devicePixelRatio || 1,
  }));
  const height = Math.min(scrollHeight, Math.floor(30000 / dpr));

  // Default scale is "css", so baselines are dpr-independent across projects.
  await expect(page).toHaveScreenshot(`${route.name}.png`, {
    fullPage: true,
    clip: { x: 0, y: 0, width: clientWidth, height },
    animations: "disabled",
    caret: "hide",
    mask: route.masks(page),
    maxDiffPixelRatio: 0.02,
  });
}

test.describe("@visual regression baselines", () => {
  // Skip unless RUN_VISUAL is set: baselines are CI-generated, so with none on
  // disk these must report SKIPPED (not failed) on a default run. Kept in a
  // beforeEach so the skip is evaluated per test and the whole group is skipped
  // cleanly.
  test.beforeEach(() => {
    test.skip(
      !process.env.RUN_VISUAL,
      "visual baselines are CI-generated; set RUN_VISUAL locally",
    );
  });

  // Freeze motion for reproducible pixels (engages MotionConfig
  // reducedMotion="user"; see the file header). reducedMotion is a context
  // option, not a top-level fixture, so it must be nested under contextOptions.
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  for (const route of ROUTES) {
    test(`${route.name} (${route.path}) matches its per-viewport baseline`, async ({
      page,
    }) => {
      await captureRoute(page, route);
    });
  }
});
