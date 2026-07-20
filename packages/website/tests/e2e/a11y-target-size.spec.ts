import { test, expect, type Locator } from "@playwright/test";

/**
 * WCAG 2.2 Target Size (Minimum), SC 2.5.8, at the 390x844 mobile viewport
 * (regression coverage). Pointer targets on a touch-first surface must be at
 * least 24x24 CSS px. This spec spot-checks the highest-traffic interactive
 * controls that axe cannot measure automatically: the nav hamburger toggle,
 * the "Reader oeffnen" links on /buecher, the chapter prev/next links in the
 * book reader, and the "Kurs starten" CTAs on /kurse.
 *
 * Every control measured here clears 24px in BOTH dimensions outright, so the
 * SC 2.5.8 spacing exception (a sub-24px target still passes when a 24px circle
 * around it hits no other target) is never exercised - if a control shrinks
 * below 24px this fails loudly rather than silently leaning on the exception.
 *
 * Locators target roles + accessible names so a copy refresh stays green. Only
 * the canonical book id `ki-landschaft` (from src/lib/books.ts) is hardcoded;
 * the chapter is reached through the table of contents, so no volatile chapter
 * slug is baked in.
 */

const MIN = 24;

async function expectMinTargetSize(
  locator: Locator,
  label: string,
): Promise<void> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  expect(box, `${label}: element has no layout box`).not.toBeNull();
  if (!box) return;
  expect(
    box.width,
    `${label}: width ${Math.round(box.width)}px < ${MIN}px (WCAG 2.5.8)`,
  ).toBeGreaterThanOrEqual(MIN);
  expect(
    box.height,
    `${label}: height ${Math.round(box.height)}px < ${MIN}px (WCAG 2.5.8)`,
  ).toBeGreaterThanOrEqual(MIN);
}

test.describe("a11y: target size (WCAG 2.5.8) at 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("nav hamburger toggle is a large-enough touch target", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Below lg the hamburger is the sole nav control; its closed-state label.
    const hamburger = page.getByRole("button", { name: "Menü öffnen" });
    await expect(hamburger).toBeVisible();
    await expectMinTargetSize(hamburger, "nav hamburger toggle");
  });

  test('"Reader oeffnen" links on /buecher are large-enough touch targets', async ({
    page,
  }) => {
    // Reduced motion so the whileInView book cards settle to their final,
    // measurable layout instead of their opacity:0 entrance state.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/buecher", { waitUntil: "domcontentloaded" });

    const readerLinks = page.getByRole("link", { name: /Reader öffnen/i });
    await expect(readerLinks.first()).toBeVisible();
    const count = await readerLinks.count();
    expect(count, "expected at least one book-card reader link").toBeGreaterThan(
      0,
    );
    for (let i = 0; i < count; i++) {
      await expectMinTargetSize(readerLinks.nth(i), `Reader-Link #${i + 1}`);
    }
  });

  test("book reader prev/next chapter links are large-enough touch targets", async ({
    page,
  }) => {
    await page.goto("/buecher/ki-landschaft", { waitUntil: "domcontentloaded" });
    // Enter the first chapter via the table of contents (no chapter slug hardcoded).
    await page
      .getByRole("navigation", { name: "Inhaltsverzeichnis" })
      .getByRole("link")
      .first()
      .click();
    await expect(page).toHaveURL(/\/buecher\/ki-landschaft\/.+/);
    const firstChapterUrl = page.url();

    const nextLink = page
      .getByRole("navigation", { name: "Kapitelnavigation" })
      .getByRole("link", { name: /Nächstes Kapitel/i });
    await expect(nextLink).toBeVisible();
    await expectMinTargetSize(nextLink, "reader next-chapter link");

    // Advance one chapter so a previous-chapter link exists, then measure it.
    await nextLink.click();
    await expect(page).not.toHaveURL(firstChapterUrl);
    const prevLink = page
      .getByRole("navigation", { name: "Kapitelnavigation" })
      .getByRole("link", { name: /Vorheriges Kapitel/i });
    await expect(prevLink).toBeVisible();
    await expectMinTargetSize(prevLink, "reader prev-chapter link");
  });

  test('"Kurs starten" CTAs on /kurse are large-enough touch targets', async ({
    page,
  }) => {
    await page.goto("/kurse", { waitUntil: "domcontentloaded" });
    // Native-course primary CTAs; imported-lab cards use "Details" instead, so
    // this label matches only the on-platform course-start links.
    const startCtas = page.getByRole("link", { name: /Kurs starten/i });
    await expect(startCtas.first()).toBeVisible();
    const count = await startCtas.count();
    expect(
      count,
      "expected at least one native course start CTA",
    ).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expectMinTargetSize(startCtas.nth(i), `Kurs-starten CTA #${i + 1}`);
    }
  });
});
