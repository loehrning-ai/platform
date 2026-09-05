import { test, expect, type Locator } from "@playwright/test";

/**
 * Open one desktop navigation disclosure and wait until the component itself
 * reports that it is open.
 *
 * `nav.tsx` opens a disclosure on `mouseenter` (the wrapper's `openMenu`) and
 * *toggles* it on click. A bare `.click()` therefore sends two competing
 * intents: Playwright moves the pointer onto the trigger, that hover schedules
 * `setOpenDropdown(id)` at React's continuous priority - a scheduler task, not
 * a synchronous flush - and the button is pressed about a millisecond later.
 * Which one lands first decides the outcome, and nothing in the test can order
 * them:
 *
 *   - render not yet committed: the click handler still sees the previous id,
 *     sets its own, and the menu opens. The run passes.
 *   - render committed: the handler sees its own id, sets null, and the menu
 *     closes again. The run fails.
 *
 * Both branches were reproduced against a built server. The closed branch is
 * not even an immediate failure: `AnimatePresence` keeps the collapsing menu
 * mounted for ~215ms, so an assertion that arrives inside that window still
 * passes and one that arrives after it does not. Two unrelated timings decide
 * a run, which is exactly the shape of this flake.
 *
 * Hover is the unambiguous half of the pair: `mouseenter` only ever opens.
 * `aria-expanded` is the readiness signal the disclosure actually has - the
 * server renders it "false" and only React can flip it - so waiting for "true"
 * proves the handler ran and the panel is mounted. No sleep, no retried click,
 * no widened timeout.
 *
 * Two preconditions, both satisfied at every call site here:
 *   - The page must be hydrated first. A `mouseenter` dispatched before React
 *     attaches is lost for good, because the pointer is then already inside
 *     the wrapper and no second `mouseenter` will ever fire.
 *   - The pointer must arrive from outside this disclosure. The first call
 *     comes from the page's initial pointer position, the second from the
 *     other trigger.
 */
async function openDesktopDisclosure(trigger: Locator): Promise<void> {
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.hover();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
}

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
  // Load-bearing for `openDesktopDisclosure`: the triggers are server-rendered
  // but inert until React attaches their handlers, and the single `mouseenter`
  // that opens a menu cannot be replayed once it has been swallowed. Measured
  // at 20x CPU throttling, hovering the instant this marker flips still opened
  // the menu on every run, so the marker is a sound gate for the nav island and
  // not merely for the document.
  await page
    .locator('[data-app-hydration-marker="true"][data-hydrated="true"]')
    .waitFor({ state: "attached" });
  const desktopLearning = page.getByRole("button", { name: "Lernen" });
  if (await desktopLearning.isVisible()) {
    const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
    await expect(
      nav.getByRole("link", { name: "Open Source", exact: true }),
    ).toBeVisible();

    await openDesktopDisclosure(desktopLearning);
    await expect(
      page.locator("#lernen-nav-menu").getByRole("link", {
        name: "Alle Kurse",
      }),
    ).toHaveAttribute("href", "/kurse");
    await expect(
      page.locator("#lernen-nav-menu").getByRole("link", { name: "KI-Check" }),
    ).toHaveAttribute("href", "/ki-check");

    const practice = nav.getByRole("button", { name: "Praxis" });
    await openDesktopDisclosure(practice);
    await expect(
      page.locator("#praxis-nav-menu").getByRole("link", {
        name: "Workshops",
      }),
    ).toHaveAttribute("href", "/workshops");

    // The trigger's click handler still has to work, so exercise it on the
    // deterministic half of the toggle. The state is committed by now (the
    // wait above proved it), which fixes the outcome: one click collapses the
    // disclosure. That is also what distinguishes a bound handler from a
    // trigger that merely responds to hover.
    await practice.click();
    await expect(practice).toHaveAttribute("aria-expanded", "false");

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
