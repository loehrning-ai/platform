import { test, expect, type Page } from "@playwright/test";

/**
 * /buecher library index deep-dive (regression coverage). The existing
 * buecher.spec.ts is a light gate (login-free access, auth-gated PDF route,
 * API shape). This spec goes deeper into the CARD SURFACE rendered by
 * src/app/buecher/buecher-content.tsx from the src/lib/books.ts catalog:
 * every book card's metadata (title, subtitle, audience, chapter count,
 * resource type, access label), that each cover image actually loads and
 * maps to its book, that the book-overview link resolves to the reader,
 * and that the index has no horizontal overflow on a phone. Assertions target
 * roles, test IDs and stable catalog strings, so a prose refresh stays green
 * while a real regression (a dropped card, a broken cover, a dead reader link)
 * fails. NOTE: reading time is NOT on the index card; it lives on the
 * /buecher/<slug> detail page, so it is not asserted here.
 *
 * Only ki-landschaft is in the published catalog (src/lib/books.ts) — the
 * other two books are pending re-review and don't render a card.
 */

const ROUTE = "/buecher";
const BOOK_OVERVIEW_LINK_NAME =
  /^(?:Buch und Kapitel öffnen|Open book and chapters)$/i;

// Exact catalog metadata as rendered by src/lib/books.ts. `·` is U+00B7 and
// the umlauts are literal, matching the DOM text (CSS uppercase is visual only).
const BOOKS = [
  {
    slug: "ki-landschaft",
    title: "KI im deutschen Mittelstand",
    subtitle: "Daten, Strukturen, Chancen",
    audience: "Alle mit beruflichem KI-Bezug",
    chapters: "10 Kapitel · ca. 95 Seiten",
    resourceType: "HTML-Lesefassung",
    materialLanguage: "Deutsch",
  },
] as const;

const HERO_HEADLINE = "Sachbücher mit sichtbaren Quellen und Grenzen.";

// Every captured console error and uncaught page error fails the check.
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

function meaningfulErrors(errors: string[]): string[] {
  return errors;
}

// Scope to one card via its testid + the unique book heading it contains.
function cardFor(page: Page, title: string) {
  return page
    .getByTestId("book-card")
    .filter({ has: page.getByRole("heading", { level: 3, name: title }) });
}

test.describe("/buecher library index", () => {
  test(`loads without login, shows the h1 and exactly ${BOOKS.length} book card(s)`, async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(HERO_HEADLINE);

    await expect(page.getByTestId("book-card")).toHaveCount(BOOKS.length);

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual(
      [],
    );
  });

  for (const book of BOOKS) {
    test(`card "${book.title}" renders full metadata and a loaded cover`, async ({
      page,
    }) => {
      await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
      const card = cardFor(page, book.title);
      await expect(card).toBeVisible();

      // Title + subtitle + the four metadata pills + status label.
      await expect(
        card.getByText(book.subtitle, { exact: true }),
      ).toBeVisible();
      await expect(
        card.getByText(book.audience, { exact: true }),
      ).toBeVisible();
      await expect(
        card.getByText(book.chapters, { exact: true }),
      ).toBeVisible();
      await expect(
        card.getByText(book.resourceType, { exact: true }),
      ).toBeVisible();
      await expect(
        card.getByText(book.materialLanguage, { exact: true }),
      ).toBeVisible();
      await expect(
        card.getByText("Reader online", { exact: true }),
      ).toBeVisible();

      // Cover: mapped to THIS book and actually decoded (not a broken image).
      const cover = card.getByRole("img", {
        name: `Deutsche Titelseite: ${book.title}`,
      });
      await cover.scrollIntoViewIfNeeded();
      await expect(cover).toBeVisible();
      await expect(cover).toHaveAttribute(
        "src",
        new RegExp(`book-covers.*${book.slug}-2026-1`),
      );
      await expect
        .poll(
          () =>
            cover.evaluate((el) => {
              const img = el as HTMLImageElement;
              return img.complete && img.naturalWidth > 0;
            }),
          {
            // Real PNG covers can take a while to decode under heavy
            // parallel-run load; give the decode a generous window (the src +
            // visibility are already asserted above, so this only waits on
            // pixels, never on a wrong/broken image).
            message: `cover for ${book.title} never finished decoding`,
            timeout: 15_000,
          },
        )
        .toBe(true);

      // The reader link is wired to this book's reader route.
      await expect(
        card.getByRole("link", { name: BOOK_OVERVIEW_LINK_NAME }),
      ).toHaveAttribute("href", `/buecher/${book.slug}`);
    });

    test(`book-overview link on "${book.title}" opens /buecher/${book.slug}`, async ({
      page,
    }) => {
      await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
      const card = cardFor(page, book.title);

      // WebKit tap hardening: bring the link fully into view before clicking
      // so the tap cannot land on the card's cover (which opens the teaser
      // modal instead of navigating).
      const readerLink = card.getByRole("link", {
        name: BOOK_OVERVIEW_LINK_NAME,
      });
      await readerLink.scrollIntoViewIfNeeded();
      await readerLink.click();

      await expect(page).toHaveURL(new RegExp(`/buecher/${book.slug}$`), {
        timeout: 10_000,
      });
      await expect(
        page.getByRole("heading", { level: 1, name: book.title }),
      ).toBeVisible();
    });
  }
});

test.describe("/buecher mobile", () => {
  test(`no horizontal overflow at 390px and all ${BOOKS.length} card(s) present`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("book-card")).toHaveCount(BOOKS.length);

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.scrollingElement?.scrollWidth ?? 0,
      innerWidth: window.innerWidth,
    }));
    expect(
      scrollWidth,
      `horizontal overflow at 390px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
    ).toBeLessThanOrEqual(innerWidth + 1);
  });
});
