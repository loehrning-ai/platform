import { expect, test } from "@playwright/test";

test.describe("workshop self-study journey", () => {
  test("lists and opens the annual-report self-study workshop", async ({
    page,
  }) => {
    await page.goto("/workshops");
    const workshop = page.getByRole("link", {
      name: /Geschäftsberichte mit KI lesen/i,
    }).first();
    await expect(workshop).toBeVisible();
    await workshop.click();
    await expect(page).toHaveURL(
      /\/workshops\/geschaeftsberichte-mit-ki-lesen$/,
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Geschäftsberichte/i,
    );
    await expect(page.locator("body")).not.toContainText("No paid service");
  });

  test("serves the complete analyst kit as a ZIP", async ({ request }) => {
    const response = await request.get(
      "/workshops/geschaeftsberichte-mit-ki-lesen/norda-analyst-kit.zip",
    );
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(
      /application\/(?:zip|octet-stream)/,
    );
    const body = await response.body();
    expect(body.byteLength).toBeGreaterThan(30_000);
    expect(body.subarray(0, 2).toString("ascii")).toBe("PK");
  });
});
