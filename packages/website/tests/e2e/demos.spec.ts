import { expect, test } from "@playwright/test";
import { RETIRED_DEMO_REDIRECTS } from "../../src/lib/demo-redirects";
import { demoLede, demos, getDemosForLocale } from "../../src/lib/demos";
import { DEMOS_PAGE_COPY } from "../../src/lib/demos-ui-copy";
import { expectGlassBudget } from "./fixtures/glass";

test.describe("/demos hub", () => {
  for (const locale of ["de", "en"] as const) {
    const prefix = locale === "en" ? "/en" : "";
    test(`${prefix || "/"}demos lists the five workshop demos as tiles, in order`, async ({ page }) => {
      const response = await page.goto(`${prefix}/demos`, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        DEMOS_PAGE_COPY[locale].catalog.heading,
      );
      const tiles = page.locator('[data-testid="demo-tile"]');
      await expect(tiles).toHaveCount(demos.length);
      const localized = getDemosForLocale(locale);
      for (const [index, demo] of localized.entries()) {
        const tile = tiles.nth(index);
        await expect(tile.getByRole("heading", { level: 3 })).toHaveText(demo.title);
        await expect(tile.locator("[data-demo-job]")).toHaveText(demo.job);
        await expect(tile.getByRole("link", { name: demo.title })).toHaveAttribute(
          "href",
          `${prefix}/demos/${demo.slug}?source=gallery`,
        );
        await expect(tile.locator("[data-demo-workshop-kicker]")).toHaveAttribute(
          "href",
          `${prefix}/workshops/${demo.workshopSlug}`,
        );
        await expect(tile.locator(".dt-scene svg")).toBeVisible();
      }
      await expect(page.locator("[data-demo-provenance]")).toHaveText(
        DEMOS_PAGE_COPY[locale].catalog.provenance,
      );
    });
  }

  for (const width of [360, 390]) {
    test(`has no horizontal overflow and no clipped tile at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/demos", { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const tile = await page.locator(".dt-card").first().boundingBox();
      expect(tile?.width ?? 0).toBeGreaterThan(width - 40);
      expect((tile?.x ?? 0) + (tile?.width ?? 0)).toBeLessThanOrEqual(width);
    });
  }

  test("tile 1 sits whole in the first screen at 390 x 664, under a hero of at most 160px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto("/demos", { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const hero = await page.locator("[data-demo-hub-hero]").boundingBox();
    expect(hero?.height ?? 999).toBeLessThanOrEqual(160);
    const tile = await page.locator(".dt-card").first().boundingBox();
    const fold = await page.evaluate(() => {
      const bar = document.querySelector("[data-mobile-tab-bar]");
      const top = bar ? bar.getBoundingClientRect().top : window.innerHeight;
      return Math.min(top, window.innerHeight);
    });
    expect((tile?.y ?? 999) + (tile?.height ?? 999)).toBeLessThanOrEqual(fold);
    await expectGlassBudget(page, "/demos at 390 x 664");
  });

  test("a tile plays once when seen, then holds the end frame", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/demos", { waitUntil: "networkidle" });
    const first = page.locator("[data-dt-tile]").first();
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveClass(/is-playing/);
    const settled = await first.evaluate(
      (element) => element.getAnimations({ subtree: true }).length,
    );
    expect(settled).toBeGreaterThan(0);
    await page.waitForTimeout(4200);
    const running = await first.evaluate(
      (element) =>
        element.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running")
          .length,
    );
    expect(running).toBe(0);
  });

  test("reduced motion shows the end frame and never arms a tile", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/demos", { waitUntil: "networkidle" });
    await expect(page.locator(".is-armed, .is-playing")).toHaveCount(0);
    const animations = await page.evaluate(() => document.getAnimations().length);
    expect(animations).toBe(0);
  });
});

test.describe("/demos/[slug] pages", () => {
  for (const demo of getDemosForLocale("de")) {
    test(`${demo.slug} renders its band and its demo on the server`, async ({ page }) => {
      const response = await page.goto(`/demos/${demo.slug}`, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(demo.title);
      await expect(page.locator("[data-demo-question]")).toHaveText(demoLede(demo));
      await expect(page.locator("[data-demo-workshop-link]")).toHaveAttribute(
        "href",
        `/workshops/${demo.workshopSlug}`,
      );
      await expect(page.locator(`[data-demo-mount="${demo.slug}"]`)).toBeVisible();
      await expect(page.locator(`[data-demo-page="${demo.slug}"]`)).toHaveAttribute(
        "data-plakat-page",
        demo.plakat,
      );
    });
  }

  test("the English page links back to the English workshop", async ({ page }) => {
    const [demo] = getDemosForLocale("en");
    if (!demo) throw new Error("The demo registry is empty.");
    const response = await page.goto(`/en/demos/${demo.slug}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(demo.title);
    await expect(page.locator("[data-demo-workshop-link]")).toHaveAttribute(
      "href",
      `/en/workshops/${demo.workshopSlug}`,
    );
  });

  for (const localeCase of [
    { path: "/demos/does-not-exist", locale: "de" },
    { path: "/en/demos/does-not-exist", locale: "en" },
  ] as const) {
    test(`${localeCase.path} returns the localized 404`, async ({ page }) => {
      const response = await page.goto(localeCase.path, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("lang", localeCase.locale);
    });
  }
});

test.describe("retired demo slugs", () => {
  for (const { from, to } of RETIRED_DEMO_REDIRECTS) {
    for (const prefix of ["", "/en"] as const) {
      test(`${prefix}/demos/${from} 308s to ${prefix}${to}`, async ({ request }) => {
        const response = await request.get(`${prefix}/demos/${from}`, { maxRedirects: 0 });
        expect(response.status()).toBe(308);
        expect(new URL(response.headers()["location"] ?? "", "https://loehrning.ai").pathname).toBe(
          `${prefix}${to}`,
        );
      });
    }
  }

  test("the retired briefing API answers 410", async ({ request }) => {
    const response = await request.get("/api/demos/excel/briefing.pdf");
    expect(response.status()).toBe(410);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  });
});

test.describe("legacy /leistungen/bauen/[slug] product routes", () => {
  for (const slug of ["datenpilot", "prozessautomat", "ki-assistent", "compliance-guard"] as const) {
    test(`${slug} redirects to platform stewardship`, async ({ request }) => {
      const res = await request.get(`/leistungen/bauen/${slug}`, { maxRedirects: 0 });
      expect([301, 308]).toContain(res.status());
      expect(res.headers()["location"]).toContain("/ueber-mich");
    });
  }
});
