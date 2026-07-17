import { test, expect } from "@playwright/test";

test.describe("deleted commercial journey APIs", () => {
  test("/ki-transformation-check redirects to KI-Check", async ({ page }) => {
    await page.goto("/ki-transformation-check", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/ki-check$/);
  });

  test("/api/scan is absent or noindexed", async ({ request }) => {
    const res = await request.post("/api/scan", { data: { url: "" } });
    expect([404, 410]).toContain(res.status());
  });

  test("/api/journey/scan-insight is absent or noindexed", async ({ request }) => {
    const res = await request.post("/api/journey/scan-insight", {
      data: { url: "https://example.com" },
    });
    expect([404, 410]).toContain(res.status());
  });

  test("/api/journey/leads is absent", async ({ request }) => {
    const res = await request.post("/api/journey/leads", {
      data: { email: "not-an-email" },
    });
    expect([400, 404, 410, 429]).toContain(res.status());
  });
});
