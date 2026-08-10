import { expect, test } from "@playwright/test";

test.describe("retired journey routes", () => {
  test("/ki-transformation-check redirects without noindex", async ({ request }) => {
    const res = await request.get("/ki-transformation-check", { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/ki-check");
    expect(res.headers()["x-robots-tag"]).toBeUndefined();
  });

  test("seeded local journey state cannot resurrect the retired route", async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem(
        "loehrning-journey",
        JSON.stringify({ act: 6, scan: { id: "local-e2e" } }),
      );
    });
    await page.goto("/ki-transformation-check", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/ki-check$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
