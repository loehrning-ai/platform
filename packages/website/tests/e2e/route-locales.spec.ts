import { expect, test } from "@playwright/test";

test.describe("DE/EN locale-routing foundation", () => {
  test("serves a reviewed English route with its own canonical and language alternates", async ({
    page,
  }) => {
    const response = await page.goto("/en/kurse", {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status()).toBe(200);
    expect(response?.headers()["x-robots-tag"]).toBeUndefined();
    await expect(page).toHaveURL(/\/en\/kurse$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeAttached();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://loehrning.ai/en/kurse",
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="de"]'),
    ).toHaveAttribute("href", "https://loehrning.ai/kurse");
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute(
      "href",
      "https://loehrning.ai/en/kurse",
    );
  });

  test("switches the interface on the equivalent sanitized route", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/kurse", { waitUntil: "domcontentloaded" });

    const desktopNavigation = page.locator(".js-desktop-nav");
    await desktopNavigation
      .getByRole("link", { name: "Englische Oberfläche öffnen" })
      .click();
    await expect(page).toHaveURL(/\/en\/kurse$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await desktopNavigation
      .getByRole("link", { name: "Open the German interface" })
      .click();
    await expect(page).toHaveURL(/\/kurse$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
  });

  test("cannot use /en to bypass a protected German course reader", async ({
    page,
  }) => {
    const response = await page.goto(
      "/en/ki-fuehrerschein/kurs/block-1?step=2",
      { waitUntil: "domcontentloaded" },
    );

    expect(response?.status()).toBe(200);
    const current = new URL(page.url());
    expect(current.pathname).toBe("/en/login");
    expect(current.searchParams.get("next")).toBe(
      "/en/ki-fuehrerschein/kurs/block-1?step=2",
    );
    expect(current.searchParams.get("reason")).toBe("auth-not-configured");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("keeps API and auth callback identities unprefixed", async ({ request }) => {
    for (const [source, target] of [
      ["/en/api/progress", "/api/progress"],
      ["/en/auth/callback?code=opaque", "/auth/callback?code=opaque"],
    ] as const) {
      const response = await request.get(source, { maxRedirects: 0 });
      expect(response.status(), source).toBe(307);
      expect(new URL(response.headers().location, "http://localhost").pathname).toBe(
        new URL(target, "https://loehrning.ai").pathname,
      );
    }
  });

  for (const width of [320, 390, 1024] as const) {
    test(`language control fits and remains operable at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/en/kurse", { waitUntil: "domcontentloaded" });
      await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });

      if (width < 1024) {
        await expect(
          page
            .locator("[data-nav-header-row]")
            .getByRole("group", { name: "Language" }),
        ).toBeVisible();
        await page.getByRole("button", { name: "Open menu" }).click();
        const dialog = page.getByRole("dialog", { name: "Primary navigation" });
        await expect(
          dialog.getByRole("group", { name: "Language" }),
        ).toBeVisible();
      } else {
        await expect(
          page
            .locator(".js-desktop-nav")
            .getByRole("group", { name: "Language" }),
        ).toBeVisible();
      }

      const geometry = await page.evaluate(() => ({
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      }));
      expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport + 1);
    });
  }
});
