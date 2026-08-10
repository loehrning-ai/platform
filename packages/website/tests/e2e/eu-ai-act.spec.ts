import { test, expect } from "@playwright/test";

const LEGACY_ROUTES = [
  "/eu-ai-act-check",
  "/eu-ai-act-check/ergebnis",
  "/eu-ai-act-check/risikoklassifizierung",
] as const;

test.describe("legacy /eu-ai-act-check redirects", () => {
  for (const route of LEGACY_ROUTES) {
    test(`${route} redirects to KI-Check`, async ({ request }) => {
      const res = await request.get(route, { maxRedirects: 0 });
      expect([301, 308]).toContain(res.status());
      expect(res.headers()["location"]).toContain("/ki-check");
      expect(res.headers()["x-robots-tag"]).toBeUndefined();
    });
  }

  test("a visitor following the legacy URL reaches public KI-Check", async ({ page }) => {
    await page.goto("/eu-ai-act-check", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/ki-check$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
