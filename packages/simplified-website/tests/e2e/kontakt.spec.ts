import { test, expect } from "@playwright/test";

test.describe("/kontakt retired route", () => {
  test("redirects to public feedback", async ({ request }) => {
    const res = await request.get("/kontakt", { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/feedback");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    expect(res.headers()["cache-control"]).toContain("public");
  });

  test("following the route lands on /feedback", async ({ page }) => {
    await page.goto("/kontakt", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/feedback$/);
    await expect(page.getByRole("heading", { name: "Rückmeldung" })).toBeVisible();
  });
});
