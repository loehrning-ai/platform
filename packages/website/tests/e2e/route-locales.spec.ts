import { expect, test, type Locator } from "@playwright/test";

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
    ).toHaveAttribute("href", "https://loehrning.ai/en/kurse");
  });

  test("switches the interface on the equivalent sanitized route", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/kurse", { waitUntil: "domcontentloaded" });

    const desktopNavigation = page.locator(".js-desktop-nav");
    await desktopNavigation
      .getByRole("link", { name: "EN, englische Oberfläche öffnen" })
      .click();
    await expect(page).toHaveURL(/\/en\/kurse$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await desktopNavigation
      .getByRole("link", { name: "DE, open the German interface" })
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

  test("keeps API and auth callback identities unprefixed", async ({
    request,
  }) => {
    for (const [source, target] of [
      ["/en/api/progress", "/api/progress"],
      ["/en/auth/callback?code=opaque", "/auth/callback?code=opaque"],
    ] as const) {
      const response = await request.get(source, { maxRedirects: 0 });
      expect(response.status(), source).toBe(307);
      expect(
        new URL(response.headers().location, "http://localhost").pathname,
      ).toBe(new URL(target, "https://loehrning.ai").pathname);
    }
  });

  for (const width of [320, 390, 1024] as const) {
    test(`language control fits and remains operable at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/en/kurse", { waitUntil: "domcontentloaded" });
      await page
        .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
        .waitFor({ state: "attached" });

      const expectFullTargets = async (group: Locator) => {
        const links = await group.getByRole("link").all();
        expect(links).toHaveLength(2);
        for (const target of links) {
          const box = await target.boundingBox();
          expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
          expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
        }
      };

      let activeLogin: Locator;
      if (width < 1024) {
        // Below lg the bar carries the DE/EN pill, and the menu sheet's
        // header repeats the same pill over it.
        const barLanguage = page
          .locator("[data-nav-header-row]")
          .getByRole("group", { name: "Language" });
        await expect(barLanguage).toBeVisible();
        await expectFullTargets(barLanguage);
        await expect(
          barLanguage.getByRole("link", {
            name: "DE, open the German interface",
          }),
        ).toHaveAttribute("href", "/kurse");
        await expect(
          barLanguage.getByRole("link", { name: /^EN, English/ }),
        ).toHaveAttribute("aria-current", "page");
        await page.getByRole("button", { name: "Open menu" }).click();
        const dialog = page.getByRole("dialog", { name: "Primary navigation" });
        await expect(dialog).toBeVisible();
        const sheetLanguage = dialog.getByRole("group", { name: "Language" });
        await expect(sheetLanguage).toBeVisible();
        await expectFullTargets(sheetLanguage);
        activeLogin = dialog.getByRole("link", { name: "Log in" });
      } else {
        const desktopNavigation = page.locator(".js-desktop-nav");
        const desktopLanguage = desktopNavigation.getByRole("group", {
          name: "Language",
        });
        await expect(desktopLanguage).toBeVisible();
        await expectFullTargets(desktopLanguage);
        activeLogin = desktopNavigation.getByRole("link", { name: "Log in" });
      }

      await expect(activeLogin).toBeVisible();
      const loginBox = await activeLogin.boundingBox();
      expect(loginBox?.height ?? 0).toBeGreaterThanOrEqual(44);

      const geometry = await page.evaluate(() => ({
        viewport: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      }));
      expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewport + 1);
    });
  }
});

test.describe("DE/EN no-script navigation", () => {
  test.use({ javaScriptEnabled: false });

  for (const width of [320, 1280] as const) {
    test(`exposes exactly one language control at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/en", { waitUntil: "domcontentloaded" });

      // One DE/EN pill at every width: the compact cluster's, which the
      // no-script stylesheet exposes on wide screens too.
      const language = page.getByRole("group", { name: "Language" });
      await expect(language).toHaveCount(1);
      await expect(
        language.getByRole("link", { name: /German/ }),
      ).toHaveAttribute("href", "/");
      await expect(
        language.getByRole("link", { name: /English/ }),
      ).toHaveAttribute("aria-current", "page");
    });
  }
});
