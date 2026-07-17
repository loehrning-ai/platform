import { test, expect, type Page } from "@playwright/test";

/**
 * /buecher library index deep-dive (regression coverage). The existing
 * buecher.spec.ts is a light gate (login-free access, disabled PDFs, API
 * shape). This spec goes deeper into the CARD SURFACE rendered by
 * src/app/buecher/buecher-content.tsx from the src/lib/books.ts catalog:
 * every book card's metadata (title, subtitle, audience, chapter count,
 * resource type, access label), that each cover image actually loads and
 * maps to its book, that the "Reader öffnen" link resolves to the reader,
 * and that the index has no horizontal overflow on a phone. Assertions target
 * roles, test IDs and stable catalog strings, so a prose refresh stays green
 * while a real regression (a dropped card, a broken cover, a dead reader link)
 * fails. NOTE: reading time is NOT on the index card; it lives on the
 * /buecher/<slug> detail page, so it is not asserted here.
 */

const ROUTE = "/buecher";

// Exact catalog metadata as rendered by src/lib/books.ts. `·` is U+00B7 and
// the umlauts are literal, matching the DOM text (CSS uppercase is visual only).
const BOOKS = [
  {
    slug: "ki-landschaft",
    title: "KI im deutschen Mittelstand",
    subtitle: "Daten, Strukturen, Chancen",
    audience: "Alle mit beruflichem KI-Bezug",
    chapters: "10 Kapitel",
    resourceType: "HTML-Lesefassung",
  },
  {
    slug: "ki-arbeitsalltag",
    title: "KI im Arbeitsalltag",
    subtitle: "Begleitbuch zum KI-Führerschein",
    audience: "Mitarbeiter und Teams",
    chapters: "14 Kapitel",
    resourceType: "HTML-Begleitbuch",
  },
  {
    slug: "ki-tools-selbststaendige",
    title: "KI-Tools für Selbstständige",
    subtitle: "Nachschlagwerk für Freelancer",
    audience: "Freelancer und Soloselbstständige",
    chapters: "13 Kapitel",
    resourceType: "HTML-Nachschlagwerk",
  },
] as const;

const ACCESS_LABEL = "kostenlos · jetzt lesen";

// Console-error filter mirrors route-einstieg.spec.ts / qa-sweep.spec.ts.
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

// Scope to one card via its testid + the unique book heading it contains.
function cardFor(page: Page, title: string) {
  return page
    .getByTestId("book-card")
    .filter({ has: page.getByRole("heading", { level: 2, name: title }) });
}

test.describe("/buecher library index", () => {
  test("loads without login, shows the h1 and exactly three book cards", async ({
    page,
  }) => {
    const errors = collectConsoleErrors(page);
    const response = await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    expect(response?.status(), `status for ${ROUTE}`).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);

    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(`${BOOKS.length} Lesefassungen`);

    await expect(page.getByTestId("book-card")).toHaveCount(3);

    const noise = meaningfulErrors(errors);
    expect(noise, `console errors on ${ROUTE}\n${noise.join("\n")}`).toEqual([]);
  });

  for (const book of BOOKS) {
    test(`card "${book.title}" renders full metadata and a loaded cover`, async ({
      page,
    }) => {
      await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
      const card = cardFor(page, book.title);
      await expect(card).toBeVisible();

      // Title + subtitle + the four metadata pills + status label.
      await expect(card.getByText(book.subtitle, { exact: true })).toBeVisible();
      await expect(card.getByText(book.audience, { exact: true })).toBeVisible();
      await expect(card.getByText(book.chapters, { exact: true })).toBeVisible();
      await expect(
        card.getByText(book.resourceType, { exact: true }),
      ).toBeVisible();
      await expect(card.getByText(ACCESS_LABEL, { exact: true })).toBeVisible();
      await expect(card.getByText("Reader online", { exact: true })).toBeVisible();

      // Cover: mapped to THIS book and actually decoded (not a broken image).
      const cover = card.getByRole("img", { name: `Titelseite: ${book.title}` });
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
        card.getByRole("link", { name: /Reader öffnen/i }),
      ).toHaveAttribute("href", `/buecher/${book.slug}`);
    });

    test(`"Reader öffnen" on "${book.title}" opens /buecher/${book.slug}`, async ({
      page,
    }) => {
      await page.goto(ROUTE, { waitUntil: "domcontentloaded" });
      const card = cardFor(page, book.title);

      // WebKit tap hardening: bring the link fully into view before clicking
      // so the tap cannot land on the card's cover (which opens the teaser
      // modal instead of navigating).
      const readerLink = card.getByRole("link", { name: /Reader öffnen/i });
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
  test("no horizontal overflow at 390px and all three cards present", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ROUTE, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("book-card")).toHaveCount(3);

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
