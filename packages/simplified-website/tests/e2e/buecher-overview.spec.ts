import { test, expect, type Page } from "@playwright/test";

/**
 * /buecher/[slug] book overview deep-dive (regression coverage). The open-reader
 * table of contents between the /buecher library and a chapter page. Assertions
 * target ROLES, stable manifest data (chapter titles/slugs, counts) and fixed
 * UI strings - never book prose - so a content refresh stays green while a real
 * regression (miscounted TOC, dead first-chapter link, dropped adaptation hint,
 * mobile overflow) fails. Sibling buecher.spec.ts covers the library, the 410
 * PDFs and /api/books.json; this file does not duplicate that surface.
 */

// Console-error filter mirrors route-einstieg.spec.ts: drop framework noise and
// keep only errors that signal a genuine page fault.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !/hydration|Failed to fetch dynamically imported|prefetch/i.test(e) &&
      !/Minified React error #(418|423|425)/.test(e) &&
      !/404/.test(e) &&
      !/_vercel\//.test(e),
  );
}

// Real data read from src/lib/books.ts + content/books/<slug>/manifest.json.
// chapterCount = number of manifest chapters (what the page actually renders).
const BOOKS = [
  {
    slug: "ki-landschaft",
    title: "KI im deutschen Mittelstand",
    chapterCount: 10,
    firstChapter: { slug: "01_eisberg", title: "Das Eisberg-Problem" },
  },
  {
    slug: "ki-arbeitsalltag",
    title: "KI im Arbeitsalltag",
    chapterCount: 14,
    firstChapter: { slug: "00_intro", title: "Wie du dieses Buch nutzt" },
  },
  {
    slug: "ki-tools-selbststaendige",
    title: "KI-Tools für Selbstständige",
    chapterCount: 13,
    firstChapter: {
      slug: "01_ki_fuer_selbststaendige",
      title: "Warum KI dein wichtigstes Werkzeug ist",
    },
  },
] as const;

test.describe("/buecher/[slug] book overview", () => {
  for (const book of BOOKS) {
    test.describe(book.slug, () => {
      test("loads with h1, TOC count matching the manifest, and hints", async ({
        page,
      }) => {
        const errors = collectConsoleErrors(page);
        const res = await page.goto(`/buecher/${book.slug}`, {
          waitUntil: "domcontentloaded",
        });

        expect(res?.status(), `status for /buecher/${book.slug}`).toBe(200);
        await expect(page).not.toHaveURL(/\/login/);

        const h1 = page.getByRole("heading", { level: 1 });
        await expect(h1).toBeVisible();
        await expect(h1).toContainText(book.title);

        // Chapter list length must equal the manifest chapter count, and the
        // headline metadata must agree with it.
        const toc = page.getByRole("navigation", { name: "Inhaltsverzeichnis" });
        await expect(toc).toBeVisible();
        await expect(toc.getByRole("listitem")).toHaveCount(book.chapterCount);
        await expect(page.getByText(`${book.chapterCount} Kapitel`)).toBeVisible();

        // adaptationNote (present in all three manifests) + no-PDF license hint.
        await expect(page.getByText("Hinweis:", { exact: true })).toBeVisible();
        await expect(page.getByText(/Kein PDF-Download/i)).toBeVisible();

        // Back-to-library affordance.
        await expect(
          page.getByRole("link", { name: "Zur Buchübersicht" }),
        ).toHaveAttribute("href", "/buecher");

        const noise = meaningfulErrors(errors);
        expect(
          noise,
          `console errors on /buecher/${book.slug}\n${noise.join("\n")}`,
        ).toEqual([]);
      });

      test("first-chapter link navigates into the reader", async ({ page }) => {
        test.setTimeout(45_000);
        const response = await page.goto(`/buecher/${book.slug}`, {
          waitUntil: "load",
        });
        expect(response?.status()).toBe(200);

        const toc = page.getByRole("navigation", { name: "Inhaltsverzeichnis" });
        const firstLink = toc.locator(
          `a[href="/buecher/${book.slug}/${book.firstChapter.slug}"]`,
        );
        await expect(firstLink).toBeVisible();

        const escaped = `${book.slug}/${book.firstChapter.slug}`.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        );
        const readerUrl = new RegExp(`/buecher/${escaped}$`);
        await Promise.all([
          page.waitForURL(readerUrl),
          firstLink.click(),
        ]);
        await expect(page).toHaveURL(readerUrl);

        // Reader chrome confirms we opened chapter 1, not just any route.
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
          book.firstChapter.title,
        );
        await expect(page.getByText(/Kapitel 1 \//)).toBeVisible();
      });

      test("has no horizontal overflow at 390px", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`/buecher/${book.slug}`, { waitUntil: "domcontentloaded" });

        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(
          page.getByRole("navigation", { name: "Inhaltsverzeichnis" }),
        ).toBeVisible();

        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
          innerWidth: window.innerWidth,
        }));
        expect(
          scrollWidth,
          `horizontal overflow at 390px on /buecher/${book.slug}: ${scrollWidth} > ${innerWidth}`,
        ).toBeLessThanOrEqual(innerWidth + 1);
      });
    });
  }
});
