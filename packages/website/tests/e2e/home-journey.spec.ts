import { test, expect } from "@playwright/test";

// The homepage keeps one resource section after the course pathway. It routes
// to learning material and open artifacts, not a consulting funnel.
test.describe("Home Page - Resources", () => {
  test("renders the supporting-resource pathway", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("ressourcen-section");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    await expect(
      section.getByRole("heading", { name: "Nachlesen, prüfen, übertragen." }),
    ).toBeVisible();
    for (const [name, href] of [
      ["Blog", "/blog"],
      ["Lernbücher", "/buecher"],
      ["Praxisbeispiele", "/demos"],
      ["Workshops", "/workshops"],
      ["Open Source", "/open-source"],
    ] as const) {
      await expect(section.getByRole("link", { name: new RegExp(name) })).toHaveAttribute(
        "href",
        href,
      );
    }
    await expect(section.getByRole("link", { name: /Zum Konto/ })).toHaveAttribute(
      "href",
      "/konto",
    );
  });

  test.describe("Mobile", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("resource section stacks and stays visible at 375px", async ({ page }) => {
      await page.goto("/");
      const section = page.getByTestId("ressourcen-section");
      await section.scrollIntoViewIfNeeded();
      await expect(section).toBeVisible();
      await expect(
        section.getByRole("heading", { name: "Nachlesen, prüfen, übertragen." }),
      ).toBeVisible();
      const box = await section.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(375);
    });
  });
});
