import { test, expect } from "@playwright/test";

test.describe("Homepage learning-platform transparency", () => {
  test("homepage surfaces the courses and the public resource map", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("ressourcen-section");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toContainText("Vier Kurse");
    await expect(section).toContainText("KI-Führerschein");
    await expect(section).toContainText("Lernbücher");
    await expect(section).toContainText("Arbeitsvorlagen");
    await expect(section).toContainText("Praxisbeispiele");
    await expect(section).toContainText("Workshops");
    await expect(section).toContainText("Open Source");
    await expect(section).toContainText("Blog");
  });

  test("homepage explains the simplified public/private boundary", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("platform-principles");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toContainText("Gratis");
    await expect(section).toContainText("Deutsch");
    await expect(section).toContainText("Belegt");
    await expect(section).toContainText("Ehrlich");
    await expect(section).toContainText("Alles zum Lernen ist offen zugänglich");
  });

  test("footer data pill is visible with the dated sample stamp", async ({ page }) => {
    await page.goto("/");
    const pill = page.getByTestId("footer-data-pill");
    await expect(pill).toBeVisible();
    await expect(pill).toContainText("Datenstand: Q3 2026");
    await expect(pill).toContainText("Letzte Aktualisierung: 2026-07-14");
  });

  test("book PDF paths are disabled in the simplified build", async ({
    request,
  }) => {
    const response = await request.head("/downloads/ki-landschaft-2026.pdf");
    expect(response.status()).toBe(410);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  });

  test("homepage renders under prefers-reduced-motion without errors", async ({
    page,
  }) => {
    // Smoke test: page with reduced motion loads and core content is present.
    // The in-flow hero CTA (guarded for reduced motion) and the footer data pill
    // must both render.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /Lernpfad öffnen/i }).first(),
    ).toBeVisible();
    await expect(page.getByTestId("footer-data-pill")).toBeVisible();
  });
});
