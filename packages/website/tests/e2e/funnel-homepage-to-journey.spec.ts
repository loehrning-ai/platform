import { test, expect } from "@playwright/test";

test("homepage primary CTA uses the KI-Check to determine the learner's start", async ({
  page,
}) => {
  await page.goto("/");
  const startLink = page
    .getByRole("link", { name: "Start bestimmen" })
    .first();
  await expect(startLink).toHaveAttribute("href", "/ki-check");
  await startLink.click();
  await expect(page).toHaveURL(/\/ki-check$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("navigation remains resource-first on both viewports", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  const desktopCourses = page.getByRole("button", { name: /Kurse/ }).first();
  if (await desktopCourses.isVisible()) {
    const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
    await expect(
      nav.getByRole("link", { name: "Open Source", exact: true }),
    ).toBeVisible();
    await desktopCourses.click();
    await expect(
      page.locator("#akademie-nav-menu").getByRole("link", {
        name: "Alle Kurse",
      }),
    ).toHaveAttribute("href", "/kurse");

    const resources = nav.getByRole("button", { name: "Ressourcen" });
    await resources.click();
    const resourcesMenu = page.locator("#ressourcen-nav-menu");
    await expect(
      resourcesMenu.getByRole("link", { name: "KI-Check" }),
    ).toHaveAttribute("href", "/ki-check");
    await expect(
      resourcesMenu.getByRole("link", { name: "Blog", exact: true }),
    ).toHaveAttribute("href", "/blog");
  } else {
    await expect(async () => {
      await page.getByRole("button", { name: "Menü öffnen" }).click();
      await expect(page.locator("#mobile-menu")).toBeVisible({
        timeout: 1_500,
      });
    }).toPass({ timeout: 30_000 });
    const menu = page.locator("#mobile-menu");
    await expect(menu.getByRole("link", { name: /Alle Kurse/ })).toBeVisible();
    await expect(
      menu.getByRole("link", { name: /Open Source/ }).first(),
    ).toHaveAttribute("href", "/open-source");
    await expect(
      menu.getByRole("link", { name: "KI-Check" }),
    ).toHaveAttribute("href", "/ki-check");
    await expect(
      menu.getByRole("link", { name: "Blog", exact: true }),
    ).toHaveAttribute("href", "/blog");
    await expect(
      menu.getByRole("link", { name: "Workshops", exact: true }),
    ).toHaveAttribute(
      "href",
      "/workshops",
    );
  }
});
