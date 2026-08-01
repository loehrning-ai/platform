import { devices, test, expect, type Page } from "@playwright/test";

/**
 * Responsive / mobile matrix (regression coverage). Codifies responsive-layout hardening's manual
 * responsive work as executable assertions across the app's key routes, plus the
 * regression coverage book-reader table fix. Four guards:
 *
 *   1. No horizontal overflow at 320/360/390/768/1024/1440 on the highest-traffic
 *      routes, incl. one real chapter reader.
 *   2. The nav hamburger appears below the Tailwind `lg` breakpoint (1024px; no
 *      override in globals.css) while the desktop Kurse dropdown is hidden there,
 *      and the reverse on a desktop width.
 *   3. The hero section and its long German headline stay inside a 320px viewport.
 *   4. Book-reader GFM tables stay inside `overflow-x-auto` wrappers
 *      (chapter-reader.tsx table override) instead of clipping the page, and
 *      the in-chapter TOC stays hidden below `lg`.
 *
 * Assertions target GEOMETRY, roles and structural anchors (data-section, the
 * hamburger's aria-label, the wrapper class, the TOC landmark), never prose, so a
 * content refresh stays green while a real layout regression fails. NOTE:
 * globals.css puts `overflow-x: clip` on <html>/<body> (responsive-layout hardening), which clamps
 * `documentElement.scrollWidth`, so the wide-table guard uses element geometry
 * (the honest signal) in addition to the page-level scrollWidth net.
 */

// The responsive-layout hardening responsive width matrix: small phone -> desktop.
const WIDTHS = [320, 360, 390, 768, 1024, 1440] as const;

// Key routes, each verified to exist in src/app and to return 200. The chapter
// reader slug/chapter is a real content file that buecher-reader-*.spec.ts
// already exercises (ki-landschaft/03_reifegrad_ueberblick ships a GFM table).
const KEY_ROUTES = [
  { path: "/", label: "home" },
  { path: "/buecher", label: "buecher library" },
  { path: "/kurse", label: "kurse hub" },
  { path: "/ki-fuehrerschein", label: "ki-fuehrerschein" },
  {
    path: "/buecher/ki-landschaft/03_reifegrad_ueberblick",
    label: "chapter reader",
  },
] as const;

// Nav breakpoint (nav.tsx): the desktop cluster is `hidden ... lg:flex` and the
// hamburger toggle is `... lg:hidden`, so widths below Tailwind's `lg` (1024px)
// show the hamburger and hide the desktop Kurse dropdown. The Kurse trigger is
// uniquely addressable by its aria-controls; the hamburger by its aria-label.
const KURSE_TRIGGER = 'button[aria-controls="akademie-nav-menu"]';
const HAMBURGER_NAME = /Menü öffnen/i;

// Table chapter: the route and title are sourced from the public catalog rather
// than an unpublished manuscript. Copy may wrap to fit; containment must remain
// correct whether the current rows require horizontal scrolling or not.
const TABLE_URL = "/buecher/ki-landschaft/08_fahrplan";
const TABLE_TITLE = "Fahrplan für die nächsten Monate";

// Every captured console error, uncaught page error, and failed request fails
// the check. Each width gets a fresh page so navigation teardown cannot leak
// speculative RSC/chunk cancellations into the next width's verdict.
function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown error";
    let expectedLoginPrefetchAbort = false;
    try {
      const target = new URL(request.url());
      const current = new URL(page.url());
      expectedLoginPrefetchAbort =
        failure === "net::ERR_ABORTED" &&
        request.method() === "GET" &&
        !request.isNavigationRequest() &&
        target.origin === current.origin &&
        target.pathname === "/login" &&
        (target.searchParams.has("_rsc") ||
          (target.searchParams.has("next") &&
            target.searchParams.get("reason") === "auth-not-configured"));
    } catch {
      // Preserve malformed URLs as failures below.
    }
    if (expectedLoginPrefetchAbort) return;
    errors.push(
      `Request failed: ${request.method()} ${request.url()} (${failure})`,
    );
  });
  return errors;
}

test.describe("responsive: no horizontal overflow across the width matrix", () => {
  for (const route of KEY_ROUTES) {
    test(`${route.label} stays within the viewport at every width`, async ({
      baseURL,
      browser,
      browserName,
      isMobile,
    }) => {
      // Six isolated loads under one route-level test. Reusing one page across
      // widths makes WebKit cancel speculative RSC/chunk requests during the
      // next navigation and misreports those cancellations as route defects.
      test.setTimeout(90_000);
      const device = isMobile
        ? devices["iPhone 13"]
        : browserName === "webkit"
          ? devices["Desktop Safari"]
          : devices["Desktop Chrome"];

      for (const width of WIDTHS) {
        const widthContext = await browser.newContext({
          ...device,
          baseURL,
          viewport: { width, height: 900 },
          reducedMotion: "reduce",
        });
        const widthPage = await widthContext.newPage();
        const errors = collectBrowserErrors(widthPage);

        try {
          const res = await widthPage.goto(route.path, { waitUntil: "load" });
          expect(res?.status(), `status for ${route.path} @${width}`).toBe(200);

          // Measure the hydrated, font-settled layout. A server-rendered page
          // can fit at first paint and overflow only after client islands or
          // web fonts settle.
          await widthPage.locator("h1").first().waitFor({ state: "visible" });
          await widthPage
            .locator('html[data-hydrated="true"]')
            .waitFor({ state: "attached" });
          await widthPage.evaluate(async () => {
            await document.fonts.ready;
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => resolve()),
              ),
            );
          });

          const { scrollWidth, innerWidth } = await widthPage.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          }));
          expect(
            scrollWidth,
            `horizontal overflow on ${route.path} @${width}px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
          ).toBeLessThanOrEqual(innerWidth + 1);

          // Error capture remains active through the full stabilization window.
          expect(
            errors,
            `browser errors on ${route.path} @${width}px\n${errors.join("\n")}`,
          ).toEqual([]);
        } finally {
          await widthContext.close();
        }
      }
    });
  }
});

test.describe("responsive: navigation hamburger breakpoint", () => {
  // Below lg (1024px): the hamburger is the only nav control; the desktop Kurse
  // dropdown trigger is display:none. Both tablet (768) and phone (390) widths.
  for (const width of [768, 390] as const) {
    test(`@${width}: hamburger is visible and the desktop Kurse dropdown is hidden`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "domcontentloaded" });

      await expect(
        page.getByRole("button", { name: HAMBURGER_NAME }),
      ).toBeVisible();
      await expect(page.locator(KURSE_TRIGGER)).toBeHidden();
    });
  }

  // At/above lg: the reverse - the desktop dropdown is visible, hamburger hidden.
  test("@1280: the desktop Kurse dropdown is visible and the hamburger is hidden", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator(KURSE_TRIGGER)).toBeVisible();
    await expect(
      page.getByRole("button", { name: HAMBURGER_NAME }),
    ).toBeHidden();
  });
});

test.describe("responsive: hero on a narrow viewport", () => {
  test("the hero and its long German headline stay inside a 320px viewport", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/", { waitUntil: "load" });

    // The hero is anchored by its stable data-section attribute, not headline
    // prose, so a copy change cannot break this layout guard.
    const hero = page.locator('[data-section="hero"]');
    await expect(hero).toBeVisible();

    // Measure the HEADLINE, not the section wrapper: the [data-section="hero"]
    // element is a scroll-linked parallax anchor whose own getBoundingClientRect
    // can compute to zero width (its visible content is laid out by descendants),
    // so measuring the wrapper is not a real overflow signal. The h1 is the
    // longest single line - if IT stays inside 320px, the hero does not overflow.
    // getBoundingClientRect() is read in-page (Locator.boundingBox() can return
    // null under the <html>/<body> `overflow-x: clip` ancestors, responsive-layout hardening).
    const headline = hero.getByRole("heading", { level: 1 });
    await expect(headline).toBeVisible();
    // Under reduced-motion the headline reveal settles from a collapsed 0x0
    // initial box to its final size over ~1s (verified), so poll until it has a
    // real width before measuring - measuring mid-reveal is a false 0.
    const readBox = () =>
      headline.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { x: rect.x, width: rect.width };
      });
    await expect
      .poll(async () => (await readBox()).width, {
        message: "hero headline never settled to a non-zero layout width",
        timeout: 10_000,
      })
      .toBeGreaterThan(0);

    const box = await readBox();
    expect(box.x, "hero headline left edge off-screen").toBeGreaterThanOrEqual(-1);
    expect(
      box.x + box.width,
      `hero headline right edge ${Math.round(box.x + box.width)}px past 320px viewport`,
    ).toBeLessThanOrEqual(321);
  });
});

test.describe("responsive: book reader wide-table containment", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("GFM tables stay inside overflow-x-auto wrappers without clipping the page", async ({
    page,
  }) => {
    await page.goto(TABLE_URL, { waitUntil: "load" });
    await page.locator('html[data-hydrated="true"]').waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });

    const article = page.getByRole("article", { name: TABLE_TITLE });
    await expect(article).toBeVisible();

    const tables = article.getByRole("table");
    const tableCount = await tables.count();
    expect(tableCount, "chapter must render at least one GFM table").toBeGreaterThan(
      0,
    );

    // Every reader table is wrapped in a `div.overflow-x-auto` by the
    // chapter-reader.tsx `table` component override (regression coverage fix). Read
    // each wrapper's geometry: computed overflow, scroll vs client width, and its
    // right edge relative to the viewport.
    const wrappers = await article.evaluate((root) => {
      const out: {
        overflowX: string;
        scrollWidth: number;
        clientWidth: number;
        left: number;
        right: number;
      }[] = [];
      root.querySelectorAll("table").forEach((t) => {
        const w = t.closest("div.overflow-x-auto") as HTMLElement | null;
        if (!w) return; // a missing wrapper is caught by the count check below
        const rect = w.getBoundingClientRect();
        out.push({
          overflowX: getComputedStyle(w).overflowX,
          scrollWidth: w.scrollWidth,
          clientWidth: w.clientWidth,
          left: rect.left,
          right: rect.right,
        });
      });
      return out;
    });

    // Regression guard: if the wrapper is ever removed, some table has no
    // overflow-x-auto ancestor and this count no longer matches.
    expect(
      wrappers.length,
      "every reader table must sit inside a div.overflow-x-auto wrapper",
    ).toBe(tableCount);

    for (const [i, w] of wrappers.entries()) {
      // The wrapper is a real horizontal scroll container ...
      expect(
        w.overflowX,
        `wrapper[${i}] must be horizontally scrollable (overflow-x)`,
      ).toBe("auto");
      // ... and it stays inside the viewport, so the PAGE never scrolls
      // horizontally while the table scrolls in place.
      expect(
        w.left,
        `wrapper[${i}] left edge ${Math.round(w.left)}px outside the viewport`,
      ).toBeGreaterThanOrEqual(-1);
      expect(
        w.right,
        `wrapper[${i}] right edge ${Math.round(w.right)}px past 390px viewport`,
      ).toBeLessThanOrEqual(391);
    }

    expect(
      Math.max(...wrappers.map((w) => w.scrollWidth - w.clientWidth)),
      "fixture must contain a genuinely overflowing table so the scroll-container assertion is meaningful",
    ).toBeGreaterThan(0);

    // The page itself has no horizontal overflow at 390px.
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `page horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });

  test("the in-chapter TOC sidebar is hidden on mobile and shown on desktop", async ({
    page,
  }) => {
    test.setTimeout(45_000);
    const toc = page.getByRole("complementary", { name: "Kapitelinhalt" });

    // Below lg the sticky TOC (chapter-reader.tsx `hidden lg:block`) must not
    // occupy the mobile viewport.
    await page.goto(TABLE_URL, { waitUntil: "domcontentloaded" });
    await expect(toc).toBeHidden();

    // At a desktop width the same landmark is revealed.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(TABLE_URL, { waitUntil: "domcontentloaded" });
    await expect(toc).toBeVisible();
  });
});
