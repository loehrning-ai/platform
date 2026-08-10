import { test, expect } from "@playwright/test";

test("/ueber-die-plattform is the public operating-model page", async ({ page }) => {
  const res = await page.goto("/ueber-die-plattform");
  expect(res?.status()).toBe(200);
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("legacy /daten-audit redirects to /ueber-die-plattform", async ({ request }) => {
  const res = await request.get("/daten-audit", { maxRedirects: 0 });
  expect([301, 308]).toContain(res.status());
  expect(res.headers()["location"]).toContain("/ueber-die-plattform");
  expect(res.headers()["x-robots-tag"]).toBeUndefined();
});
