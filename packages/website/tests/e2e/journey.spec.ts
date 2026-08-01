import { test, expect, type APIResponse } from "@playwright/test";

async function expectGone(response: APIResponse, route: string) {
  expect(response.status(), `${route} status`).toBe(410);
  expect(await response.text(), `${route} body`).toBe("");
  expect(response.headers()["x-robots-tag"], `${route} X-Robots-Tag`).toContain(
    "noindex",
  );
}

test.describe("deleted commercial journey APIs", () => {
  test("/ki-transformation-check redirects to KI-Check", async ({ page }) => {
    await page.goto("/ki-transformation-check", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/ki-check$/);
  });

  test("/api/scan is gone with an empty noindex response", async ({
    request,
  }) => {
    const res = await request.post("/api/scan", { data: { url: "" } });
    await expectGone(res, "/api/scan");
  });

  test(
    "/api/journey/scan-insight is gone with an empty noindex response",
    async ({ request }) => {
      const res = await request.post("/api/journey/scan-insight", {
        data: { url: "https://example.com" },
      });
      await expectGone(res, "/api/journey/scan-insight");
    },
  );

  test("/api/journey/leads is gone with an empty noindex response", async ({
    request,
  }) => {
    const res = await request.post("/api/journey/leads", {
      data: { email: "not-an-email" },
    });
    await expectGone(res, "/api/journey/leads");
  });
});
