import { test, expect } from "@playwright/test";

test.describe("retired transformation-check routes", () => {
  test("/ki-transformation-check redirects to public KI-Check", async ({ request }) => {
    const res = await request.get("/ki-transformation-check", { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/ki-check");
    expect(res.headers()["x-robots-tag"]).toBeUndefined();
  });

  test("legacy /ki-readiness redirects to public KI-Check", async ({ page }) => {
    await page.goto("/ki-readiness", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/ki-check$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
