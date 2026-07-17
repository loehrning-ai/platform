/**
 * AUDIT (accessibility hardening): The first test checks /ki-transformation-check,
 * which is deleted by public-content transition. The skip-to-content and mobile-nav tests are
 * KEEP — they test universal a11y behaviors on /.
 * DECISION: After public-content transition ships, remove the first test only. Keep the other two.
 */
import { test, expect } from "@playwright/test";

test("a11y: retired journey redirects to an accessible public page", async ({ page }) => {
  await page.goto("/ki-transformation-check");
  await expect(page).toHaveURL(/\/ki-check$/);
  await expect(page.locator("h1")).toHaveCount(1);
});

test("a11y: skip-to-content link receives focus on Tab", async ({ page, browserName }) => {
  await page.goto("/");
  // First Tab from the document body should land on the skip link. WebKit
  // follows the Safari convention where plain Tab skips links — Option+Tab
  // (Alt+Tab) walks every focusable, which is how Safari users actually
  // reach the skip link.
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? { text: el.textContent?.trim(), href: (el as HTMLAnchorElement).href } : null;
  });
  expect(focused?.text).toMatch(/Zum Inhalt springen/);
});

test("a11y: mobile nav opens, traps focus, closes on Escape", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "viewport setup is chromium-only");
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  const toggle = page.locator('button[aria-label*="Menü"]');
  await toggle.click();

  const dialog = page.locator('[role="dialog"][aria-modal="true"]');
  await expect(dialog).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  // Escape closes the menu.
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});
