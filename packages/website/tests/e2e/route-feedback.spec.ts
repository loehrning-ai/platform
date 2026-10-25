import { test, expect } from "@playwright/test";
import {
  collectBrowserErrors,
  formatBrowserErrors,
  meaningfulBrowserErrors,
} from "./fixtures/console";

/**
 * /feedback smoke + provider-free contact coverage. Stored feedback is an
 * optional provider-backed feature, so the credential-free publication build
 * renders a plain contact page and must not expose an inert form.
 */

const ROUTE = "/feedback";

test.describe("/feedback surface", () => {
  test("loads without login, shows the h1, and logs no console error", async ({
    page,
  }) => {
    const errors = collectBrowserErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText("Kontakt");

    const noise = meaningfulBrowserErrors(errors);
    expect(
      noise,
      `console errors on ${ROUTE}\n${formatBrowserErrors(noise)}`,
    ).toEqual([]);
  });

  test("renders the contact channels and no form", async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("group", { name: /Art der Rückmeldung/i })).toHaveCount(0);
    await expect(page.getByLabel(/Nachricht/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Rückmeldung senden/i })).toHaveCount(0);

    await expect(
      page.getByRole("link", { name: /tim@loehrning\.ai/i }),
    ).toHaveAttribute("href", "mailto:tim@loehrning.ai");
    await expect(
      page.getByRole("link", { name: /Tim Löhr auf LinkedIn/ }),
    ).toHaveAttribute("href", /^https:\/\/www\.linkedin\.com\/in\//);
  });

});

test.describe("/feedback mobile", () => {
  test("has no horizontal overflow at 390px and keeps the contact visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /tim@loehrning\.ai/i })).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});
