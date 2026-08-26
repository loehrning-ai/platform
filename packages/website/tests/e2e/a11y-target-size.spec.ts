import { test, expect, type Locator } from "@playwright/test";

/**
 * Product target-size floor at the 390x844 mobile viewport. WCAG 2.2 SC 2.5.8
 * permits 24x24 CSS px with exceptions; the loehrning.ai interface contract is
 * deliberately stricter and requires 44x44 CSS px for independent controls.
 * This spec spot-checks the highest-traffic interactive
 * controls that axe cannot measure automatically: the nav hamburger toggle,
 * the book-overview links on /buecher, the chapter prev/next links in the
 * book reader, and the learning-atlas decisions on /kurse.
 *
 * Every control measured here must clear 44px in BOTH dimensions outright. If
 * a control shrinks below the product floor this fails without relying on a
 * WCAG spacing exception.
 *
 * Locators target roles + accessible names so a copy refresh stays green. Only
 * the canonical book id `ki-landschaft` (from src/lib/books.ts) is hardcoded;
 * the chapter is reached through the table of contents, so no volatile chapter
 * slug is baked in.
 */

const MIN = 44;
const BOOK_OVERVIEW_LINK_NAME =
  /^(?:Buch und Kapitel öffnen|Open book and chapters): .+$/i;

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
    `${label}: width ${Math.round(box.width)}px < ${MIN}px (product floor)`,
  ).toBeGreaterThanOrEqual(MIN);
  expect(
    box.height,
    `${label}: height ${Math.round(box.height)}px < ${MIN}px (product floor)`,
  ).toBeGreaterThanOrEqual(MIN);
}

test.describe("a11y: 44px product target floor at 390x844", () => {
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

  test("book-overview links on /buecher are large-enough touch targets", async ({
    page,
  }) => {
    // Reduced motion so the whileInView book cards settle to their final,
    // measurable layout instead of their opacity:0 entrance state.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/buecher", { waitUntil: "domcontentloaded" });

    const readerLinks = page.getByRole("link", {
      name: BOOK_OVERVIEW_LINK_NAME,
    });
    await expect(readerLinks.first()).toBeVisible();
    const count = await readerLinks.count();
    expect(
      count,
      "expected at least one book-card reader link",
    ).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expectMinTargetSize(readerLinks.nth(i), `Reader-Link #${i + 1}`);
    }
  });

  test("book reader prev/next chapter links are large-enough touch targets", async ({
    page,
  }) => {
    await page.goto("/buecher/ki-landschaft", {
      waitUntil: "domcontentloaded",
    });
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

  test("learning-atlas decisions are large-enough touch targets", async ({
    page,
  }) => {
    await page.goto("/kurse", { waitUntil: "domcontentloaded" });
    const goals = page
      .getByRole("group", { name: "Lernziel auswählen" })
      .getByRole("button");
    await expect(goals).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await expectMinTargetSize(goals.nth(i), `Lernziel #${i + 1}`);
    }

    const nextProof = page.getByTestId("next-proof").getByRole("link");
    await expect(nextProof).toBeVisible();
    await expectMinTargetSize(nextProof, "Nächster-Nachweis CTA");
  });

  test("AI-Native course navigation clears the target floor", async ({
    page,
  }) => {
    // The course reader is intentionally account-gated. Measure the public
    // landing and public companion navigation instead of asserting against the
    // provider-free login fallback.
    await page.goto("/ai-native", { waitUntil: "domcontentloaded" });
    await expectMinTargetSize(
      page.getByRole("link", { name: /Mit Modul 1 beginnen/i }),
      "AI-Native start-module link",
    );
    await expectMinTargetSize(
      page.getByRole("link", { name: /Kursstand öffnen/i }),
      "AI-Native course-progress link",
    );

    await page.goto("/en/ai-native/demos", {
      waitUntil: "domcontentloaded",
    });
    const demoBreadcrumb = page.getByRole("navigation", {
      name: "Breadcrumb",
    });
    await expectMinTargetSize(
      demoBreadcrumb.getByRole("link", {
        name: "AI-Native Workflow Course",
      }),
      "AI-Native demo breadcrumb",
    );

    await page.goto("/ai-native/glossar", {
      waitUntil: "domcontentloaded",
    });
    const glossaryBreadcrumb = page.getByRole("navigation", {
      name: "Brotkrümelnavigation",
    });
    await expectMinTargetSize(
      glossaryBreadcrumb.getByRole("link", { name: "Kurs" }),
      "AI-Native glossary breadcrumb",
    );
  });
});
