import { test, expect } from "@playwright/test";

test("homepage primary CTA leads to /kurse", async ({ page }) => {
  await page.goto("/");
  const courseLink = page.getByRole("link", { name: /Lernpfad öffnen/i }).first();
  await expect(courseLink).toBeVisible();
  await courseLink.click();
  await expect(page).toHaveURL(/\/kurse$/);
  await expect(page.getByRole("heading", { name: /KI lernen/i })).toBeVisible();
});

test("navigation remains resource-first on both viewports", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  const desktopCourses = page.getByRole("button", { name: /Kurse/ }).first();
  if (await desktopCourses.isVisible()) {
    const nav = page.getByRole("navigation");
    await expect(nav.getByRole("link", { name: "Open Source", exact: true }).first()).toBeVisible();
    await expect(nav.getByRole("link", { name: "Blog", exact: true })).toBeVisible();
    await expect(nav.locator('a:has-text("KI-CHECK")')).toHaveCount(0);
    await desktopCourses.click();
    await expect(
      page.locator("#akademie-nav-menu").getByRole("link", {
        name: "Open Source",
      }),
    ).toHaveAttribute("href", "/open-source");
  } else {
    await expect(async () => {
      await page.getByRole("button", { name: "Menü öffnen" }).click();
      await expect(page.locator("#mobile-menu")).toBeVisible({
        timeout: 1_500,
      });
    }).toPass({ timeout: 30_000 });
    const menu = page.locator("#mobile-menu");
    await expect(menu.getByRole("link", { name: /Alle Kurse/ })).toBeVisible();
    await expect(menu.getByRole("link", { name: /Open Source/ }).first()).toHaveAttribute(
      "href",
      "/open-source",
    );
    await expect(menu.getByRole("link", { name: "Blog", exact: true })).toBeVisible();
    await expect(menu.getByText("Projekt")).toHaveCount(0);
    await expect(menu.getByRole("link", { name: /KI-Check starten/ })).toHaveCount(0);
  }
});
