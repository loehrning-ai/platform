import { test, expect } from "@playwright/test";
import { SITE_CONTENT_DATE } from "../../src/lib/content-freshness";

test.describe("Homepage learning-platform transparency", () => {
  test("homepage surfaces the courses and the public resource map", async ({
    page,
  }) => {
    await page.goto("/");
    // Courses live in the Kurse section...
    const kurse = page.getByTestId("kurse-section");
    await kurse.scrollIntoViewIfNeeded();
    await expect(kurse).toContainText("Vier Kurse");
    await expect(kurse).toContainText("KI-Führerschein");
    // Each course card leads with its people picture (course-artwork.tsx)
    // at every width: a 72px crop on a phone, the 16:7 plate from sm.
    const courseImages = kurse.locator("[data-course-artwork] img");
    await expect(courseImages).toHaveCount(4);
    for (const image of await courseImages.all()) {
      await expect(image).toHaveAttribute("src", /cover-v4\.webp/);
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (node) =>
              node instanceof HTMLImageElement &&
              node.complete &&
              node.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
    // ...and the supporting resources in their own Ressourcen section.
    const ressourcen = page.getByTestId("ressourcen-section");
    await ressourcen.scrollIntoViewIfNeeded();
    await expect(ressourcen).toContainText("Lernbücher");
    await expect(ressourcen).toContainText("Praxisbeispiele");
    await expect(ressourcen).toContainText("Workshops");
    await expect(ressourcen).toContainText("Open Source");
    await expect(ressourcen).toContainText("Blog");
  });

  test("homepage explains the public/account boundary", async ({ page }) => {
    await page.goto("/");
    // The Ground rules strip is gone; the boundary now lives where it acts:
    // the resource board says its areas need no account, and the cobalt
    // band under it names what the free account adds.
    await expect(page.locator('[data-testid="platform-principles"]')).toHaveCount(0);
    const section = page.getByTestId("ressourcen-section");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toContainText(
      "Kostenloses Konto: Fortschritt und Arbeitsbelege auf jedem Gerät.",
    );
    await expect(section.getByRole("link", { name: /Zum Konto/ })).toHaveAttribute(
      "href",
      "/konto",
    );
  });

  test("footer data pill is visible with the dated sample stamp", async ({
    page,
  }) => {
    await page.goto("/");
    const pill = page.getByTestId("footer-data-pill");
    await expect(pill).toBeVisible();
    await expect(pill).toContainText("Datenstand: Q3 2026");
    // One date line: the reviewed ISO date is the <time> datetime behind
    // "Q3 2026", no longer a second visible "Aktualisiert" date.
    await expect(pill.locator("time")).toHaveAttribute(
      "datetime",
      SITE_CONTENT_DATE,
    );
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
    // The in-flow hero CTA and the footer data pill must both render.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Lernroute wählen" }).first(),
    ).toBeVisible();
    await expect(page.getByTestId("footer-data-pill")).toBeVisible();
  });
});
