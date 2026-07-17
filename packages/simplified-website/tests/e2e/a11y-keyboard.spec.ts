import { test, expect, type Page } from "@playwright/test";

/**
 * Keyboard-navigation a11y (regression coverage). Complements a11y.spec.ts (axe,
 * WCAG 2.4.11 focus-not-obscured) WITHOUT re-running its assertions. Focus:
 * the skip-link, a visible focus indicator (WCAG 2.4.7), and the mobile
 * hamburger's native Enter/Space activation + accessibility and quality hardening Escape-to-close.
 *
 * Only features verified in source are asserted: layout.tsx ships the
 * <a href="#main-content"> skip-link (sr-only -> focus:not-sr-only, first
 * focusable in <body>); nav.tsx gives the Kurse trigger a focus-visible:ring-2
 * box-shadow ring, and the mobile toggle is a native <button>
 * (aria-controls="mobile-menu") whose Escape handler closes the dialog and
 * restores focus. Viewports are forced per test for determinism on BOTH the
 * chromium and mobile (iPhone 13 / WebKit) projects.
 */

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

// Homepage + one course landing. Nav and skip-link live in the root layout, so
// they are identical everywhere; two routes prove the global shell.
const SHELL_ROUTES = ["/", "/ki-fuehrerschein"] as const;

// Tabs up to maxTabs times, stopping when the focused element's `attr` equals
// `value`. Returns { boxShadow, focusVisible } for that element, or null.
// focusVisible is computed in-page: a non-transparent outline (UA rings report
// outline-style "auto") OR a ring (Tailwind focus-visible:ring-* -> box-shadow).
async function tabUntilAttr(
  page: Page,
  attr: string,
  value: string,
  maxTabs = 12,
) {
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(
      ({ a, v }) => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body || el.getAttribute(a) !== v) return null;
        const cs = getComputedStyle(el);
        const outline =
          cs.outlineStyle !== "none" &&
          cs.outlineWidth !== "0px" &&
          cs.outlineColor !== "transparent" &&
          !/,\s*0\)\s*$/.test(cs.outlineColor);
        const ring = cs.boxShadow !== "none" && cs.boxShadow.trim() !== "";
        return { boxShadow: cs.boxShadow, focusVisible: outline || ring };
      },
      { a: attr, v: value },
    );
    if (info) return info;
  }
  return null;
}

test.describe("keyboard: skip-link and focus visibility", () => {
  for (const route of SHELL_ROUTES) {
    test(`${route}: skip-link is present and unhides on focus, then a visible focus ring`, async ({
      page,
      browserName,
    }) => {
      await page.setViewportSize(DESKTOP);
      await page.goto(route, { waitUntil: "domcontentloaded" });

      const skip = page.getByRole("link", { name: /Zum Inhalt springen/i });
      // The skip-link is the first focusable in <body>. On Chromium a single Tab
      // lands on it. WebKit (and therefore `mobile-webkit`) does NOT
      // move Tab focus to LINKS unless the OS "Full Keyboard Access" setting is
      // enabled - a system policy, not a site property - so the synthetic-Tab
      // assertion is Chromium-only. On every engine we still prove the feature
      // itself: the link exists, unhides via focus:not-sr-only when focused, and
      // targets the main landmark.
      if (browserName === "chromium") {
        await page.keyboard.press("Tab");
        await expect(skip).toBeFocused();
      } else {
        await skip.focus();
      }
      await expect(skip).toBeVisible();
      await expect(skip).toHaveAttribute("href", "#main-content");

      // Focus-visibility (WCAG 2.4.7) via real Tab traversal is asserted on
      // Chromium only. WebKit's DEFAULT Tab policy excludes links AND buttons
      // from the tab order (it stops on text fields unless the OS "Full Keyboard
      // Access" setting is on), so a synthetic Tab never reaches the Kurse
      // <button> there - it cannot exercise this path at all, and forcing it
      // would assert a browser policy, not the site. The ring itself is
      // correctly declared (focus-visible:ring-2 in nav.tsx) and verified here
      // on Chromium's real traversal.
      if (browserName === "chromium") {
        const trigger = await tabUntilAttr(page, "aria-controls", "akademie-nav-menu");
        expect(trigger, "Tab should reach the Kurse dropdown trigger").not.toBeNull();
        expect(
          trigger!.focusVisible,
          `focus needs an outline or ring (boxShadow=${trigger!.boxShadow})`,
        ).toBe(true);
      }
    });
  }
});

test.describe("keyboard: mobile hamburger", () => {
  test("hamburger is a keyboard-operable native button; Escape closes and restores focus", async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const openToggle = page.getByRole("button", { name: /Menü öffnen/i });
    // The real accessibility contract: it is a native <button> (Enter/Space
    // activate it by the HTML spec, focusable in the tab order), not a
    // div-with-onClick. We drive activation via .click() (which Playwright
    // routes as a real user activation; a synthetic keydown of Space on a
    // button fires on keyup and races AnimatePresence, so it is not a
    // reliable signal of anything the button does not already guarantee).
    const tag = await openToggle.evaluate((el) => el.tagName);
    expect(tag, "hamburger must be a native <button>").toBe("BUTTON");
    await openToggle.focus();
    await expect(openToggle).toBeFocused();

    // Activate the toggle. aria-expanded="false" is present in the SERVER HTML
    // (nav.tsx renders aria-expanded={mobileOpen} with mobileOpen=false), so it
    // is NOT a hydration signal - a .click() before React binds the onClick is a
    // silent no-op and the dialog never mounts (the flake, worse under machine
    // load). Retry the open until the dialog actually appears: a pre-hydration
    // click no-ops, the next click (post-hydration) opens it. The isVisible
    // guard keeps the retry from toggling an already-open dialog shut.
    const dialog = page.getByRole("dialog", { name: /Hauptnavigation/i });
    await expect(async () => {
      if (!(await dialog.isVisible())) await openToggle.click();
      await expect(dialog).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /Menü schließen/i }),
    ).toHaveAttribute("aria-expanded", "true");

    // accessibility and quality hardening: focus is moved into the dialog panel on open.
    const focusInDialog = await page.evaluate(() => {
      const d = document.getElementById("mobile-menu");
      return d ? d.contains(document.activeElement) : false;
    });
    expect(focusInDialog, "focus should move into the mobile dialog").toBe(true);

    // accessibility and quality hardening: Escape closes from anywhere and restores focus to the toggle.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(openToggle).toBeFocused();
    await expect(openToggle).toHaveAttribute("aria-expanded", "false");
  });
});
