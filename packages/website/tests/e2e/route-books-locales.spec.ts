import { expect, test, type Page } from "@playwright/test";
import { chapters, chaptersMatching, firstTableHeader, proseSnippet } from "./fixtures/book";
import { isWebKitRscPrefetchCancellation } from "./fixtures/console";

// Chapters per locale, read from the manifests on disk (the English mirror may trail the German edition).
const chaptersFor = (locale: "de" | "en") => chapters(locale);

const OVERVIEW_ROUTES = [
  {
    path: "/buecher",
    deHeading: "Sachbücher mit sichtbaren Quellen und Grenzen.",
    enHeading: "Reference books with visible sources and limits.",
  },
  {
    path: "/buecher/ki-landschaft",
    deHeading: "Von außen gesehen",
    enHeading: "Seen from the outside",
  },
] as const;

function localized(path: string, locale: "de" | "en"): string {
  return locale === "de" ? path : `/en${path}`;
}

async function assertReaderReady(page: Page, chapterSlug: string) {
  const readiness = `ki-landschaft:${chapterSlug}`;
  await expect(
    page.locator(`[data-book-reader-runtime="${readiness}"]`),
  ).toHaveAttribute("data-book-reader-ready", readiness);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-book-reader-ready",
    /.+/,
  );
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`${page.url()} :: console :: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    // Deliberately not engine-scoped here, unlike the shared allowlist entry:
    // this file has always tolerated the cancellation on every engine, and
    // narrowing it is a separate decision from removing the duplicated regex.
    if (isWebKitRscPrefetchCancellation(error.message)) return;
    errors.push(`${page.url()} :: pageerror :: ${error.message}`);
  });
  return errors;
}

async function assertGeometry(page: Page, path: string, width: number) {
  const geometry = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(
        "main h1, main h2, main h3, main p, main dt, main dd, main a, main button",
      ),
    );
    const escaped = candidates
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          (rect.left < -1 || rect.right > viewportWidth + 1)
        );
      })
      .map((element) => ({
        tag: element.tagName,
        text: (element.textContent ?? "").trim().slice(0, 80),
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
      }));
    const tableRegions = Array.from(
      document.querySelectorAll<HTMLElement>("[data-horizontal-scroll]"),
    ).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      };
    });
    return {
      bodyWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      escaped,
      tableRegions,
    };
  });

  expect(geometry.bodyWidth, `${path} body overflow`).toBeLessThanOrEqual(
    width + 1,
  );
  expect(
    geometry.documentWidth,
    `${path} document overflow`,
  ).toBeLessThanOrEqual(width + 1);
  expect(geometry.escaped, `${path} escaped content`).toEqual([]);
  for (const table of geometry.tableRegions) {
    expect(table.left, `${path} table left edge`).toBeGreaterThanOrEqual(-1);
    expect(table.right, `${path} table right edge`).toBeLessThanOrEqual(
      width + 1,
    );
    expect(table.scrollWidth).toBeGreaterThanOrEqual(table.clientWidth);
  }
}

async function assertLocaleMetadata(
  page: Page,
  path: string,
  locale: "de" | "en",
) {
  const localizedPath = localized(path, locale);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `https://loehrning.ai${localizedPath}`,
  );
  await expect(
    page.locator('link[rel="alternate"][hreflang="de"]'),
  ).toHaveAttribute("href", `https://loehrning.ai${path}`);
  await expect(
    page.locator('link[rel="alternate"][hreflang="en"]'),
  ).toHaveAttribute("href", `https://loehrning.ai/en${path}`);
}

for (const width of [320, 390, 768, 1440] as const) {
  test(`published book routes preserve edition, metadata, and geometry at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1_000 });
    const errors = collectErrors(page);

    for (const locale of ["de", "en"] as const) {
      for (const route of OVERVIEW_ROUTES) {
        const path = localized(route.path, locale);
        const response = await page.goto(path, {
          waitUntil: "domcontentloaded",
        });

        expect(response?.status(), path).toBe(200);
        expect(response?.headers()["x-robots-tag"], path).toBeUndefined();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(
          page.getByRole("heading", {
            level: 1,
            name: locale === "de" ? route.deHeading : route.enHeading,
          }),
        ).toBeVisible();
        await page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]').waitFor({ state: "attached" });
        await assertLocaleMetadata(page, route.path, locale);

        if (route.path === "/buecher/ki-landschaft") {
          const contents = page.getByRole("navigation", {
            name: locale === "de" ? "Alle Kapitel des Buchs" : "All chapters of the book",
          });
          const chapterLinks = contents.getByRole("link");
          await expect(chapterLinks).toHaveCount(chaptersFor(locale).length);
          await expect(chapterLinks.first()).toHaveAttribute(
            "hreflang",
            locale,
          );
          await expect(chapterLinks.first()).toHaveAttribute(
            "href",
            localized(`/buecher/ki-landschaft/${chaptersFor(locale)[0]!.slug}`, locale),
          );
          // The cover is the insight cover: nothing collapses.
          await expect(page.locator("main details, main summary")).toHaveCount(0);
        } else {
          const previewName =
            locale === "de"
              ? "Vorschau von „Von außen gesehen“ öffnen"
              : "Open the cover preview for “Seen from the outside”";
          await page.getByRole("button", { name: previewName }).click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await page
            .getByRole("dialog")
            .getByRole("button", {
              name: locale === "de" ? "Vorschau schließen" : "Close preview",
            })
            .click();
        }

        await assertGeometry(page, path, width);
      }

      for (const { slug, title: chapterTitle } of chaptersFor(locale)) {
        const basePath = `/buecher/ki-landschaft/${slug}`;
        const path = localized(basePath, locale);
        const response = await page.goto(path, {
          waitUntil: "domcontentloaded",
        });

        expect(response?.status(), path).toBe(200);
        expect(response?.headers()["x-robots-tag"], path).toBeUndefined();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(
          page.getByRole("heading", {
            level: 1,
            name: chapterTitle,
          }),
        ).toBeVisible();
        await assertReaderReady(page, slug);
        await assertLocaleMetadata(page, basePath, locale);
        await assertGeometry(page, path, width);

        if (locale === "en") {
          for (const germanChrome of [
            "Bücher",
            "In diesem Kapitel",
            "Alle Kapitel",
            "Inhaltsverzeichnis",
          ]) {
            await expect(
              page.getByText(germanChrome, { exact: true }),
            ).toHaveCount(0);
          }
        }
      }

      const firstChapter = chaptersFor(locale)[0]!;
      const secondChapter = chaptersFor(locale)[1]!;
      const firstPath = localized(`/buecher/ki-landschaft/${firstChapter.slug}`, locale);
      const secondPath = localized(`/buecher/ki-landschaft/${secondChapter.slug}`, locale);
      await page.goto(firstPath, { waitUntil: "domcontentloaded" });
      await assertReaderReady(page, firstChapter.slug);
      await page.keyboard.press("ArrowRight");
      await expect(page).toHaveURL(new RegExp(`${secondPath}$`));
      await assertReaderReady(page, secondChapter.slug);
      await page.keyboard.press("ArrowLeft");
      await expect(page).toHaveURL(new RegExp(`${firstPath}$`));
      await assertReaderReady(page, firstChapter.slug);
    }

    expect(errors).toEqual([]);
  });
}

test.describe("published book chapters without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of ["de", "en"] as const) {
    test(`keeps the complete ${locale} chapter body, the band, the figures and the navigation available`, async ({
      page,
    }) => {
      const first = chaptersFor(locale)[0]!;
      const basePath = `/buecher/ki-landschaft/${first.slug}`;
      const path = localized(basePath, locale);
      const snippet = proseSnippet(first.slug, locale);

      const response = await page.goto(path, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status(), path).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      const article = page.getByRole("article", { name: first.title });
      await expect(article).toBeVisible();
      if (snippet) await expect(article).toContainText(snippet);
      // The band and the chapter list are server markup; nothing needs script to be read.
      await expect(page.locator("[data-cover-band]")).toBeVisible();
      await expect(page.locator("[data-chapter-list]")).toBeVisible();
      // Every figure is in the server markup as a finished chart with its visible source line.
      for (const figure of await page.locator("main figure").all()) {
        await expect(figure.locator("svg title").first()).toBeAttached();
        await expect(figure.locator("[data-source-line]")).toBeVisible();
      }
      await expect(page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]')).toHaveCount(0);
      await assertLocaleMetadata(page, basePath, locale);
      // A chapter with a table keeps it readable without JavaScript.
      const table = chaptersMatching(/^\|.+\|\s*$/m).find((c) => chaptersFor(locale).some((l) => l.slug === c.slug));
      const header = table ? firstTableHeader(table.slug, locale) : null;
      if (table && header) {
        const tablePath = localized(`/buecher/ki-landschaft/${table.slug}`, locale);
        const tableResponse = await page.goto(tablePath, { waitUntil: "domcontentloaded" });
        expect(tableResponse?.status(), tablePath).toBe(200);
        const region = page
          .getByRole("group", {
            name: locale === "de" ? "Tabelle, horizontal scrollbar" : "Table, horizontally scrollable",
          })
          .first();
        await expect(region.getByRole("table")).toContainText(header);
      }
    });
  }
});
