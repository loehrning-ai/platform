import { test, expect } from "@playwright/test";

test("homepage primary CTA opens the learning atlas", async ({ page }) => {
  await page.goto("/");
  const startLink = page
    .getByRole("link", { name: "Lernroute wählen" })
    .first();
  await expect(startLink).toHaveAttribute("href", "/kurse");
  await startLink.click();
  await expect(page).toHaveURL(/\/kurse$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("navigation remains task-oriented on both viewports", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/");
  // The dropdown triggers are server-rendered but inert until React attaches
  // their handlers. A click that lands before then is swallowed with no error
  // and never retried, so the menu simply never opens and the assertion below
  // times out looking for a link that was never revealed. The mobile branch
  // survives this because its open step is wrapped in toPass; the desktop
  // branch clicks once, so it has to wait for hydration first.
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  const desktopLearning = page.getByRole("button", { name: "Lernen" });
  if (await desktopLearning.isVisible()) {
    const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
    await expect(
      nav.getByRole("link", { name: "Open Source", exact: true }),
    ).toBeVisible();
    await desktopLearning.click();
    await expect(
      page.locator("#lernen-nav-menu").getByRole("link", {
        name: "Alle Kurse",
      }),
    ).toHaveAttribute("href", "/kurse");
    await expect(
      page.locator("#lernen-nav-menu").getByRole("link", { name: "KI-Check" }),
    ).toHaveAttribute("href", "/ki-check");

    const practice = nav.getByRole("button", { name: "Praxis" });
    await practice.click();
    await expect(
      page.locator("#praxis-nav-menu").getByRole("link", {
        name: "Workshops",
      }),
    ).toHaveAttribute("href", "/workshops");

    await expect(
      nav.getByRole("link", { name: "Blog", exact: true }),
    ).toHaveAttribute("href", "/blog");
    await expect(
      nav.getByRole("link", { name: "Über mich", exact: true }),
    ).toHaveAttribute("href", "/ueber-mich");
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
    await expect(menu.getByRole("link", { name: "KI-Check" })).toHaveAttribute(
      "href",
      "/ki-check",
    );
    await expect(
      menu.getByRole("link", { name: "Blog", exact: true }),
    ).toHaveAttribute("href", "/blog");
    await expect(
      menu.getByRole("link", { name: "Über mich", exact: true }),
    ).toHaveAttribute("href", "/ueber-mich");
    await expect(
      menu.getByRole("link", { name: "Workshops", exact: true }),
    ).toHaveAttribute("href", "/workshops");
  }
});
