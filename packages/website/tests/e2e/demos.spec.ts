import { expect, test } from "@playwright/test";
import { RETIRED_DEMO_REDIRECTS } from "../../src/lib/demo-redirects";
import { demoLede, demos, getDemosForLocale } from "../../src/lib/demos";
import { DEMOS_PAGE_COPY } from "../../src/lib/demos-ui-copy";

test.describe("/demos hub", () => {
  for (const locale of ["de", "en"] as const) {
    const prefix = locale === "en" ? "/en" : "";
    test(`${prefix || "/"}demos lists the five workshop demos in order`, async ({ page }) => {
      const response = await page.goto(`${prefix}/demos`, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        DEMOS_PAGE_COPY[locale].catalog.heading,
      );
      const rows = page.locator('[data-testid="demo-row"]');
      await expect(rows).toHaveCount(demos.length);
      const localized = getDemosForLocale(locale);
      for (const [index, demo] of localized.entries()) {
        const row = rows.nth(index);
        await expect(row.getByRole("heading", { level: 3 })).toHaveText(demo.title);
        await expect(row.locator("[data-demo-row-question]")).toHaveText(demoLede(demo));
        await expect(row.getByRole("link")).toHaveAttribute(
          "href",
          `${prefix}/demos/${demo.slug}?source=gallery`,
        );
      }
      await expect(page.locator("[data-demo-provenance]")).toHaveText(
        DEMOS_PAGE_COPY[locale].catalog.provenance,
      );
    });
  }

  test("has no horizontal overflow at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/demos", { waitUntil: "domcontentloaded" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
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
