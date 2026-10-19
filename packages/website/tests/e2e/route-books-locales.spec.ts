import { expect, test, type Page } from "@playwright/test";
import { isWebKitRscPrefetchCancellation } from "./fixtures/console";

const CHAPTERS = [
  ["01_eisberg", "Die Zahl, die nicht stimmt", "The number that does not add up"],
  ["02_sagen_zeigen", "Sagen und zeigen", "Saying and showing"],
  ["03_zweimal_gemessen", "Dieselbe Firma, zweimal gemessen", "The same firm, measured twice"],
  ["04_branche_land", "Branche schlägt Land", "Industry beats state"],
  ["05_reden_einstellen", "Reden und Einstellen", "Talking and hiring"],
  ["06_eu_ki_verordnung", "Was seit Februar 2025 gilt", "What has applied since February 2025"],
  ["07_pilot", "Dein erster Pilot", "Your first pilot"],
  ["08_methodik", "Methode und Grenzen", "Method and limits"],
] as const;

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
            name: locale === "de" ? "Inhaltsverzeichnis" : "Table of contents",
          });
          const chapterLinks = contents.getByRole("link");
          await expect(chapterLinks).toHaveCount(8);
          await expect(chapterLinks.first()).toHaveAttribute(
            "hreflang",
            locale,
          );
          await expect(chapterLinks.first()).toHaveAttribute(
            "href",
            localized("/buecher/ki-landschaft/01_eisberg", locale),
          );
          await expect(
            page
              .getByText(locale === "de" ? "Deutsch" : "English", {
                exact: true,
              })
              .first(),
          ).toBeVisible();
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

      for (const [slug, germanTitle, englishTitle] of CHAPTERS) {
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
            name: locale === "de" ? germanTitle : englishTitle,
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

      const firstPath = localized("/buecher/ki-landschaft/01_eisberg", locale);
      const secondPath = localized(
        "/buecher/ki-landschaft/02_sagen_zeigen",
        locale,
      );
      await page.goto(firstPath, { waitUntil: "domcontentloaded" });
      await assertReaderReady(page, "01_eisberg");
      await page.keyboard.press("ArrowRight");
      await expect(page).toHaveURL(new RegExp(`${secondPath}$`));
      await assertReaderReady(page, "02_sagen_zeigen");
      await page.keyboard.press("ArrowLeft");
      await expect(page).toHaveURL(new RegExp(`${firstPath}$`));
      await assertReaderReady(page, "01_eisberg");
    }

    expect(errors).toEqual([]);
  });
}

test.describe("published book chapters without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of ["de", "en"] as const) {
    test(`keeps the complete ${locale} chapter body and navigation available`, async ({
      page,
    }) => {
      const basePath = "/buecher/ki-landschaft/01_eisberg";
      const path = localized(basePath, locale);
      const title = locale === "de" ? "Die Zahl, die nicht stimmt" : "The number that does not add up";
      const bodyText =
        locale === "de"
          ? "Wer sich im Herbst 2026 umhört, bekommt Antworten zwischen 20 und 57 Prozent"
          : "Ask around in autumn 2026 and you get answers between 20 and 57 percent";
      const tableLabel =
        locale === "de"
          ? "Tabelle, horizontal scrollbar"
          : "Table, horizontally scrollable";

      const response = await page.goto(path, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status(), path).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      const article = page.getByRole("article", { name: title });
      await expect(article).toBeVisible();
      await expect(article).toContainText(bodyText);
      // The source links stay real links, and the figures are in the server markup as finished charts.
      await expect(article.getByRole("link", { name: "KfW" }).first()).toHaveAttribute("href", /kfw\.de/);
      await expect(article.locator("figure svg title").first()).toBeAttached();
      await expect(page.locator('[data-app-hydration-marker="true"][data-hydrated="true"]')).toHaveCount(0);
      await assertLocaleMetadata(page, basePath, locale);
      // The method appendix holds the tables: readable without JavaScript.
      const appendixPath = localized("/buecher/ki-landschaft/08_methodik", locale);
      const appendix = await page.goto(appendixPath, { waitUntil: "domcontentloaded" });
      expect(appendix?.status(), appendixPath).toBe(200);
      const tableRegion = page.getByRole("group", { name: tableLabel }).first();
      await expect(tableRegion.getByRole("table")).toContainText(
        locale === "de" ? "Grundgesamtheit" : "Population",
      );
    });
  }
});
